/**
 * Demo ma'lumotlarni yaratish.
 *   npm run seed            — bazani noldan qayta yaratadi (eski ma'lumotlar o'chadi!)
 *   tsx scripts/seed.ts --if-missing — baza bo'lmasa yaratadi
 */
import fs from "node:fs";
import path from "node:path";
import { createSeed, DEMO_ACCOUNTS } from "../src/lib/seed";
import { DB_FILE, UPLOAD_DIR, dbExists, saveDb, writeCredentialsCsv, DATA_DIR } from "../src/lib/db";

const force = process.argv.includes("--force");
if (dbExists() && !force) {
  process.exit(0);
}
if (force && fs.existsSync(UPLOAD_DIR)) {
  for (const f of fs.readdirSync(UPLOAD_DIR)) fs.rmSync(path.join(UPLOAD_DIR, f), { force: true });
}
const t0 = Date.now();
const { db, credentials } = createSeed();
saveDb(db);
writeCredentialsCsv(credentials);
const size = (fs.statSync(DB_FILE).size / 1024).toFixed(0);
console.log(`\n✅ SmartSchool bazasi yaratildi (${Date.now() - t0} ms, ${size} KB)`);
console.log(`   Foydalanuvchilar: ${db.users.length}, sinflar: ${db.classes.length}, vazifalar: ${db.assignments.length}, baholar: ${db.grades.length}`);
console.log(`   Barcha login/parollar: ${path.relative(process.cwd(), path.join(DATA_DIR, "credentials.csv"))}\n`);
console.log("   Demo hisoblar:");
for (const a of DEMO_ACCOUNTS) console.log(`   • ${a.role.padEnd(30)} ${a.login.padEnd(20)} ${a.password}`);
console.log("");
