import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('CryptoService', () => {
  let service: CryptoService;
  const TEST_KEY = '12345678901234567890123456789012';

  beforeEach(async () => {
    process.env.FI360_TELEMATICS_ENCRYPTION_KEY = TEST_KEY;
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
    service.onModuleInit();
  });

  afterEach(() => {
    delete process.env.FI360_TELEMATICS_ENCRYPTION_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('1. valid AES-256-GCM encryption and 2. decrypt round trip', () => {
    const plaintext = 'super-secret-password';
    const ciphertext = service.encrypt(plaintext);
    expect(ciphertext).toBeDefined();
    expect(ciphertext.startsWith('v1:')).toBeTruthy();
    
    const decrypted = service.decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('3. unique IV', () => {
    const plaintext = 'test-data';
    const c1 = service.encrypt(plaintext);
    const c2 = service.encrypt(plaintext);
    expect(c1).not.toBe(c2); // Due to random IV
  });

  it('4. tamper detection (modify IV)', () => {
    const plaintext = 'tamper-test';
    const ciphertext = service.encrypt(plaintext);
    
    // Format: v1:iv:authTag:ciphertext
    const parts = ciphertext.split(':');
    
    // Modify IV (hex string, change last character)
    let iv = parts[1];
    const lastChar = iv[iv.length - 1];
    iv = iv.slice(0, -1) + (lastChar === '0' ? '1' : '0');
    parts[1] = iv;
    
    const tampered = parts.join(':');
    expect(() => service.decrypt(tampered)).toThrow(InternalServerErrorException);
  });

  it('4. tamper detection (modify Auth Tag)', () => {
    const plaintext = 'tamper-test';
    const ciphertext = service.encrypt(plaintext);
    
    const parts = ciphertext.split(':');
    let tag = parts[2];
    tag = tag.slice(0, -1) + (tag[tag.length - 1] === '0' ? '1' : '0');
    parts[2] = tag;
    
    const tampered = parts.join(':');
    expect(() => service.decrypt(tampered)).toThrow(InternalServerErrorException);
  });

  it('4. tamper detection (modify Ciphertext)', () => {
    const plaintext = 'tamper-test';
    const ciphertext = service.encrypt(plaintext);
    
    const parts = ciphertext.split(':');
    let enc = parts[3];
    enc = enc.slice(0, -1) + (enc[enc.length - 1] === '0' ? '1' : '0');
    parts[3] = enc;
    
    const tampered = parts.join(':');
    expect(() => service.decrypt(tampered)).toThrow(InternalServerErrorException);
  });

  it('5. wrong key', () => {
    const plaintext = 'wrong-key-test';
    const ciphertext = service.encrypt(plaintext);
    
    // Re-init with wrong key
    process.env.FI360_TELEMATICS_ENCRYPTION_KEY = '98765432109876543210987654321098';
    service.onModuleInit();
    
    expect(() => service.decrypt(ciphertext)).toThrow(InternalServerErrorException);
  });

  it('6. malformed ciphertext', () => {
    expect(() => service.decrypt('v1:invalid')).toThrow(InternalServerErrorException);
    expect(() => service.decrypt('v2:a:b:c')).toThrow(InternalServerErrorException);
    expect(() => service.decrypt('random_string')).toThrow(InternalServerErrorException);
  });

  it('7. invalid key length', () => {
    process.env.FI360_TELEMATICS_ENCRYPTION_KEY = 'too-short';
    service.onModuleInit();
    
    expect(() => service.encrypt('test')).toThrow(InternalServerErrorException);
  });

  it('8. missing key', () => {
    delete process.env.FI360_TELEMATICS_ENCRYPTION_KEY;
    service.onModuleInit();
    
    expect(() => service.encrypt('test')).toThrow(InternalServerErrorException);
  });

  it('9. JSON encrypt/decrypt', () => {
    const obj = { secret: '123', token: 'abc' };
    const ciphertext = service.encryptJson(obj);
    const decrypted = service.decryptJson<any>(ciphertext);
    
    expect(decrypted.secret).toBe('123');
    expect(decrypted.token).toBe('abc');
  });

  it('10. ciphertext version validation', () => {
    const ciphertext = service.encrypt('test');
    const parts = ciphertext.split(':');
    parts[0] = 'v2'; // change version
    const invalidVersion = parts.join(':');
    expect(() => service.decrypt(invalidVersion)).toThrow(InternalServerErrorException);
  });
});
