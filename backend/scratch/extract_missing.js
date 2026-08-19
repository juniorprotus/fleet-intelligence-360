const fs = require('fs');

const sql = fs.readFileSync('scratch/local_db_all.sql', 'utf8');

// We want to extract:
// - ENUMs: BudgetCategory, BudgetStatus, AlertType, AlertSeverity, DefectStatus
// - TABLEs: vehicles, workshops, budgets, audit_logs, tyre_alerts, tyre_defects

const missingEnums = ['BudgetCategory', 'BudgetStatus', 'AlertType', 'AlertSeverity', 'DefectStatus', 'VehicleStatus', 'WorkshopStatus'];
const missingTables = ['vehicles', 'workshops', 'budgets', 'audit_logs', 'tyre_alerts', 'tyre_defects'];

let outSql = '';

const blocks = sql.split('\n\n');

for (const block of blocks) {
  let include = false;
  
  if (block.includes('CREATE TYPE')) {
    for (const e of missingEnums) {
      if (block.includes(`"${e}"`)) {
        include = true;
        break;
      }
    }
  } else if (block.includes('CREATE TABLE')) {
    for (const t of missingTables) {
      if (block.includes(`"${t}"`)) {
        include = true;
        break;
      }
    }
  } else if (block.includes('CREATE INDEX') || block.includes('CREATE UNIQUE INDEX')) {
    for (const t of missingTables) {
      if (block.includes(`ON "${t}"`)) {
        include = true;
        break;
      }
    }
  }
  
  // Exclude foreign keys for now, we just want the base tables so phase1 doesn't crash.
  // Actually, wait, some foreign keys belong to these tables!
  // It's safer to not create foreign keys in this missing foundation to avoid order issues,
  // OR we can just let Prisma diff generator create them later.
  // But let's just include the table definitions.
  
  if (include) {
    outSql += block + '\n\n';
  }
}

fs.mkdirSync('prisma/migrations/20260813000000_missing_foundation', { recursive: true });
fs.writeFileSync('prisma/migrations/20260813000000_missing_foundation/migration.sql', outSql);
console.log('Extracted missing foundation DDL.');
