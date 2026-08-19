const fs = require('fs');
const sql = fs.readFileSync('scratch/local_db_all.sql', 'utf8');

const missingTables = ['vehicles', 'workshops', 'budgets', 'audit_logs', 'tyre_alerts', 'tyre_defects'];

let outSql = '';

for (const t of missingTables) {
  // Extract CreateTable block
  const tableRegex = new RegExp(`CREATE TABLE "public"."${t}" \\([\\s\\S]*?\\);`, 'm');
  const tableMatch = sql.match(tableRegex);
  if (tableMatch) {
    outSql += '-- CreateTable\n';
    outSql += tableMatch[0].replace(/"public"\./g, '') + '\n\n';
  }

  // Extract CreateIndex blocks
  const indexRegex = new RegExp(`CREATE( UNIQUE)? INDEX( IF NOT EXISTS)? "[^"]+" ON "public"."${t}"\\([^;]+\\);`, 'g');
  let match;
  while ((match = indexRegex.exec(sql)) !== null) {
    outSql += '-- CreateIndex\n';
    outSql += match[0].replace(/"public"\./g, '') + '\n\n';
  }
}

fs.writeFileSync('prisma/migrations/20260813000000_missing_foundation/migration.sql', outSql);
console.log('Done recreating missing foundation perfectly');
