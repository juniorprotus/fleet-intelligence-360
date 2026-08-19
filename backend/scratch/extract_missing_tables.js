const fs = require('fs');
const sql = fs.readFileSync('scratch/local_db_all.sql', 'utf8');

const missingTables = ['vehicles', 'workshops', 'budgets', 'audit_logs', 'tyre_alerts', 'tyre_defects'];

let outSql = '';
// Split by double newline or double CRLF
const blocks = sql.split(/\r?\n\r?\n/);

for (const block of blocks) {
  if (block.startsWith('-- CreateTable')) {
    for (const t of missingTables) {
      if (block.includes(`"${t}"`)) {
        // Just take the block. We will replace '"public".' with '' to match prisma standard
        outSql += block.replace(/"public"\./g, '') + '\n\n';
      }
    }
  } else if (block.startsWith('-- CreateIndex') || block.startsWith('-- CreateUniqueIndex')) {
     for (const t of missingTables) {
      if (block.includes(`ON "${t}"`) || block.includes(`ON "public"."${t}"`)) {
        outSql += block.replace(/"public"\./g, '') + '\n\n';
      }
    }
  }
}

fs.writeFileSync('prisma/migrations/20260813000000_missing_foundation/migration.sql', outSql);
console.log('Done recreating missing foundation');
