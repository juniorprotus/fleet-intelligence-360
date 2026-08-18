const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { CryptoService } = require('../dist/src/crypto/crypto.service');
const { PrismaService } = require('../dist/src/prisma/prisma.service');

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  const envKey = process.env.FI360_TELEMATICS_ENCRYPTION_KEY;
  if (!envKey && !isDryRun) {
    // Only fail if missing in real run without fallback
  }

  process.env.FI360_TELEMATICS_ENCRYPTION_KEY = envKey || '12345678901234567890123456789012'; 

  console.log(`Starting Legacy Credential Migration (Dry Run: ${isDryRun})`);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const cryptoService = app.get(CryptoService);
  const prisma = app.get(PrismaService);

  const connections = await prisma.integrationConnection.findMany({
    where: {
      encryptedCredentials: {
        not: null
      }
    }
  });

  let candidateCount = connections.length;
  let legacyCount = 0;
  let migratedCount = 0;
  let unknownCount = 0;
  let readyCount = 0;

  for (const conn of connections) {
    const creds = conn.encryptedCredentials;
    
    // AES_GCM_V1 check
    if (creds.startsWith('v1:')) {
      migratedCount++;
      continue;
    }

    // Try parsing as base64 legacy
    try {
      const decoded = Buffer.from(creds, 'base64').toString('utf8');
      JSON.parse(decoded);
      legacyCount++;
      
      if (!isDryRun) {
        const encrypted = cryptoService.encrypt(decoded);
        await prisma.integrationConnection.update({
          where: { id: conn.id },
          data: { encryptedCredentials: encrypted }
        });
        console.log(`Migrated connection ${conn.id}`);
        readyCount++;
      }
    } catch (e) {
      unknownCount++;
      console.warn(`WARNING: Connection ${conn.id} has UNKNOWN_FORMAT credentials. MANUAL CREDENTIAL RE-ENTRY REQUIRED.`);
    }
  }

  console.log('\n--- Migration Report ---');
  console.log(`Total candidates: ${candidateCount}`);
  console.log(`Already AES-GCM (v1): ${migratedCount}`);
  console.log(`Legacy Base64: ${legacyCount}`);
  console.log(`Unknown Format (Requires Manual Re-entry): ${unknownCount}`);
  if (!isDryRun) {
    console.log(`Successfully Migrated: ${readyCount}`);
  } else {
    console.log(`Ready to Migrate: ${legacyCount}`);
  }

  await app.close();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
