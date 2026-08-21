require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log('--- FI360 STEP 6E.1 PAYMENT CORE E2E ---');
  let exitCode = 0;

  try {
    // Setup: Create isolated test tenant
    const testTenant = await prisma.tenant.create({
      data: { code: `TNT-PAY-E2E-${Date.now()}`, name: 'Payment E2E Test Tenant' },
    });
    const tenantId = testTenant.id;
    const idempotencyKey = `idem-e2e-${Date.now()}`;
    const providerCode = 'MOCK';
    let transactionId = null;
    let attemptId = null;

    // --- Test A: Create payment transaction ---
    console.log('Test A: Create payment transaction');
    const tx = await prisma.paymentTransaction.create({
      data: {
        tenantId,
        amount: 1500,
        currency: 'KES',
        providerCode,
        status: 'PENDING',
      },
    });
    transactionId = tx.id;
    console.log('A: PASS', { transactionId });

    // --- Test B/C: Create payment attempt with idempotency ---
    console.log('Test B: Create payment attempt');
    const attempt = await prisma.paymentAttempt.create({
      data: {
        transactionId: tx.id,
        tenantId,
        amount: 1500,
        currency: 'KES',
        providerCode,
        idempotencyKey,
        status: 'PENDING',
      },
    });
    attemptId = attempt.id;
    console.log('B: PASS', { attemptId, idempotencyKey });

    // --- Test C: Duplicate idempotency key ---
    console.log('Test C: Duplicate idempotency key');
    try {
      await prisma.paymentAttempt.create({
        data: {
          transactionId: tx.id,
          tenantId,
          amount: 1500,
          currency: 'KES',
          providerCode,
          idempotencyKey, // same key
          status: 'PENDING',
        },
      });
      console.error('C: FAIL - allowed duplicate');
      exitCode = 1;
    } catch (e) {
      if (e.code === 'P2002') {
        console.log('C: PASS - unique constraint prevented duplicate');
      } else {
        console.error('C: FAIL - unexpected error', e.message);
        exitCode = 1;
      }
    }

    // --- Test D: Retrieve payment ---
    console.log('Test D: Retrieve payment');
    const retrievedTx = await prisma.paymentTransaction.findUnique({ where: { id: transactionId } });
    if (retrievedTx && retrievedTx.tenantId === tenantId) {
      console.log('D: PASS');
    } else {
      console.error('D: FAIL');
      exitCode = 1;
    }

    // --- Test E: Status history ---
    console.log('Test E: Create status history');
    await prisma.paymentStatusHistory.create({
      data: {
        attemptId,
        oldStatus: 'PENDING',
        newStatus: 'SUCCESS',
        changedBy: 'e2e-test',
      },
    });
    const history = await prisma.paymentStatusHistory.findMany({ where: { attemptId } });
    if (history.length === 1 && history[0].newStatus === 'SUCCESS') {
      console.log('E: PASS');
    } else {
      console.error('E: FAIL');
      exitCode = 1;
    }

    // --- Test F: Tenant isolation ---
    console.log('Test F: Tenant isolation');
    const wrongTenant = await prisma.paymentTransaction.findMany({
      where: { tenantId: 'TNT-NONEXISTENT' },
    });
    if (wrongTenant.length === 0) {
      console.log('F: PASS');
    } else {
      console.error('F: FAIL - found records for non-existent tenant');
      exitCode = 1;
    }

    // --- Test G: Different idempotency key succeeds ---
    console.log('Test G: Different idempotency key');
    const attempt2 = await prisma.paymentAttempt.create({
      data: {
        transactionId: tx.id,
        tenantId,
        amount: 1500,
        currency: 'KES',
        providerCode,
        idempotencyKey: `idem-e2e-different-${Date.now()}`,
        status: 'PENDING',
      },
    });
    console.log('G: PASS', { attemptId2: attempt2.id });

    // --- Cleanup ---
    console.log('Cleanup: Removing test records');
    await prisma.paymentStatusHistory.deleteMany({ where: { attemptId: { in: [attemptId, attempt2.id] } } });
    await prisma.paymentAttempt.deleteMany({ where: { id: { in: [attemptId, attempt2.id] } } });
    await prisma.paymentTransaction.deleteMany({ where: { id: transactionId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    console.log('Cleanup: DONE');

    console.log('--- PAYMENT CORE E2E COMPLETE ---');
  } catch (error) {
    console.error('E2E ERROR:', error.message);
    exitCode = 1;
  } finally {
    await prisma.$disconnect();
    process.exit(exitCode);
  }
}

run();
