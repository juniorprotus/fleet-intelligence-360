import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly logger = new Logger(CryptoService.name);
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;
  private readonly IV_LENGTH = 12;
  private readonly AUTH_TAG_LENGTH = 16;
  private encryptionKey: Buffer | null = null;

  onModuleInit() {
    const keyString = process.env.FI360_TELEMATICS_ENCRYPTION_KEY;
    
    if (!keyString) {
      this.logger.error('FI360_TELEMATICS_ENCRYPTION_KEY is missing. Cryptography failed closed.');
      this.encryptionKey = null;
      return;
    }

    const keyBuf = Buffer.from(keyString, 'utf-8');
    if (keyBuf.length !== this.KEY_LENGTH) {
      this.logger.error(`FI360_TELEMATICS_ENCRYPTION_KEY must be exactly ${this.KEY_LENGTH} bytes long. Cryptography failed closed.`);
      this.encryptionKey = null;
      return;
    }
    
    this.encryptionKey = keyBuf;
    this.logger.log('CryptoService initialized securely.');
  }

  private ensureKey(): Buffer {
    if (!this.encryptionKey) {
      throw new InternalServerErrorException('Cryptographic key is not configured or invalid');
    }
    return this.encryptionKey;
  }

  encrypt(plaintext: string): string {
    const key = this.ensureKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
    return `v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const key = this.ensureKey();
    
    if (!ciphertext || typeof ciphertext !== 'string') {
      throw new InternalServerErrorException('Invalid ciphertext format');
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 4 || parts[0] !== 'v1') {
      throw new InternalServerErrorException('Invalid ciphertext envelope');
    }

    const [version, ivHex, authTagHex, encryptedHex] = parts;
    
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      if (iv.length !== this.IV_LENGTH || authTag.length !== this.AUTH_TAG_LENGTH) {
        throw new Error('Invalid crypto parameters length');
      }

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed: Integrity check or format error');
      throw new InternalServerErrorException('Decryption failed');
    }
  }

  encryptJson(value: unknown): string {
    return this.encrypt(JSON.stringify(value));
  }

  decryptJson<T>(ciphertext: string): T {
    const plaintext = this.decrypt(ciphertext);
    try {
      return JSON.parse(plaintext) as T;
    } catch (e) {
      this.logger.error('Failed to parse decrypted JSON');
      throw new InternalServerErrorException('Invalid JSON payload in decrypted secret');
    }
  }
}
