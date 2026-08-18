const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { TelematicsService } = require('../dist/src/telematics/telematics.service');
const { CryptoService } = require('../dist/src/crypto/crypto.service');
const { PrismaService } = require('../dist/src/prisma/prisma.service');
const assert = require('assert');

async function run() {
  process.env.FI360_TELEMATICS_ENCRYPTION_KEY = '12345678901234567890123456789012'; // Test key
  console.log('Starting E2E Telematics Security Test...');
  
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const telematicsService = app.get(TelematicsService);
  const cryptoService = app.get(CryptoService);
  const prisma = app.get(PrismaService);

  try {
    const scopeCtx = {
      tenantId: 't-test-tenant-1',
      organizationId: 'org-test-1',
    };

    // Find any existing user or create one
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: 'usr-sec-test',
                email: 'test_sec@fi360.com',
                firstName: 'Sec',
                lastName: 'Test',
                password: 'dummy',
                passwordHash: 'dummy',
                status: 'ACTIVE',
                tenantId: scopeCtx.tenantId,
            }
        });
    }

    console.log('1. Testing createConnection (AES encryption & API masking)');
    const testCreds = { apiKey: 'secret-123', token: 'token-456' };
    const conn = await telematicsService.createConnection({
      provider: 'GEOTAB',
      connectionName: 'Test Sec Connection',
      credentials: testCreds,
    }, String(user.id), scopeCtx);

    // API masking test
    assert(conn.encryptedCredentials === '[ENCRYPTED_SECRET_CONFIGURED]', 'API response must mask credentials');

    // DB plaintext absence test
    const rawConn = await prisma.integrationConnection.findUnique({ where: { id: conn.id } });
    assert(rawConn.encryptedCredentials, 'Credentials must be saved');
    assert(rawConn.encryptedCredentials !== '[ENCRYPTED_SECRET_CONFIGURED]', 'DB should not store the masked string');
    assert(!rawConn.encryptedCredentials.includes('secret-123'), 'Plaintext must not be in DB');
    
    // Decrypt round trip test
    const decrypted = cryptoService.decryptJson(rawConn.encryptedCredentials);
    assert(decrypted.apiKey === 'secret-123', 'Decrypted payload must match original');

    console.log('2. Unique ciphertext test');
    const conn2 = await telematicsService.createConnection({
        provider: 'GEOTAB',
        connectionName: 'Test Sec Connection 2',
        credentials: testCreds,
      }, String(user.id), scopeCtx);
    const rawConn2 = await prisma.integrationConnection.findUnique({ where: { id: conn2.id } });
    assert(rawConn.encryptedCredentials !== rawConn2.encryptedCredentials, 'Ciphertext must be unique for same plaintext');

    console.log('3. AuditLog secret absence test');
    const logs = await prisma.auditLog.findMany({
      where: { entityId: conn.id },
      orderBy: { createdAt: 'desc' }
    });
    const log = logs[0];
    const logStr = JSON.stringify(log.afterValue || {});
    assert(!logStr.includes('secret-123'), 'Audit log must not contain plaintext');
    assert(!logStr.includes(rawConn.encryptedCredentials), 'Audit log must not contain ciphertext');

    console.log('4. Invalid key failure test');
    const oldKey = process.env.FI360_TELEMATICS_ENCRYPTION_KEY;
    process.env.FI360_TELEMATICS_ENCRYPTION_KEY = 'invalid';
    cryptoService.onModuleInit();
    try {
        await telematicsService.createConnection({
            provider: 'GEOTAB',
            connectionName: 'Fail Test',
            credentials: testCreds,
        }, String(user.id), scopeCtx);
        assert.fail('Should have thrown InternalServerErrorException');
    } catch (e) {
        assert(e.status === 500 || e.message.includes('Cryptographic key') || e.name === 'InternalServerErrorException', 'Must fail closed on invalid key');
    }
    process.env.FI360_TELEMATICS_ENCRYPTION_KEY = oldKey; // restore
    cryptoService.onModuleInit();

    console.log('All E2E security tests passed!');
  } finally {
    // Cleanup
    await prisma.integrationConnection.deleteMany({
      where: { connectionName: { in: ['Test Sec Connection', 'Test Sec Connection 2', 'Fail Test'] } }
    });
    await app.close();
  }
}

run().catch(e => {
  console.error('Test Failed!', e);
  process.exit(1);
});
