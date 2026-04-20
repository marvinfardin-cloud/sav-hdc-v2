/**
 * Usage:
 *   npx tsx scripts/import-clients.ts clients.csv
 *
 * CSV format (header row required):
 *   nom,prenom,email,telephone
 *
 * - Columns may be in any order; header names are matched case-insensitively.
 * - Rows with missing nom/prenom/email are skipped with a warning.
 * - Existing clients (matched by email) are skipped silently.
 * - Default password: "Client2024!" (bcrypt, 12 rounds).
 * - Reads DATABASE_URL from .env (same file used by the app).
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

// ---------------------------------------------------------------------------
// Load .env so DATABASE_URL is available (Prisma reads it automatically,
// but we call dotenv manually so the process.env is also populated for logs).
// ---------------------------------------------------------------------------
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) {
      const [, key, val] = match;
      if (!process.env[key]) process.env[key] = val.replace(/^["']|["']$/g, "");
    }
  }
}

const DEFAULT_PASSWORD = "Client2024!";
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// CSV parsing — handles quoted fields and comma-in-quotes
// ---------------------------------------------------------------------------
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function readCsv(filePath: string): Promise<Record<string, string>[]> {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, "utf-8"),
    crlfDelay: Infinity,
  });

  const rows: string[][] = [];
  for await (const line of rl) {
    if (line.trim()) rows.push(parseCsvLine(line));
  }

  if (rows.length < 2) throw new Error("CSV has no data rows (need header + at least 1 row).");

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const csvArg = process.argv[2];
  if (!csvArg) {
    console.error("Usage: npx tsx scripts/import-clients.ts <file.csv>");
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), csvArg);
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`\nReading: ${csvPath}`);
  const rows = await readCsv(csvPath);
  console.log(`Found ${rows.length} data row(s)\n`);

  const prisma = new PrismaClient();

  console.log(`Hashing default password (${BCRYPT_ROUNDS} rounds)…`);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  console.log("Done.\n");

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nom      = row["nom"]       || row["lastname"]  || "";
    const prenom   = row["prenom"]    || row["firstname"] || row["prénom"] || "";
    const email    = (row["email"]    || "").toLowerCase();
    const telephone = row["telephone"] || row["téléphone"] || row["phone"] || "";

    const lineNum = i + 2; // 1-based, offset for header

    if (!nom || !email) {
      console.warn(`  [line ${lineNum}] Skipped — missing required field (nom=${nom || "?"}, email=${email || "?"})`);
      errors++;
      continue;
    }

    const existing = await prisma.client.findUnique({ where: { email } });
    if (existing) {
      console.log(`  [line ${lineNum}] Skipped (already exists): ${email}`);
      skipped++;
      continue;
    }

    await prisma.client.create({
      data: { nom, prenom, email, telephone: telephone || null, passwordHash },
    });

    console.log(`  [line ${lineNum}] Created: ${prenom} ${nom} <${email}>`);
    created++;
  }

  await prisma.$disconnect();

  console.log(`\n─────────────────────────────`);
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Errors  : ${errors}`);
  console.log(`─────────────────────────────\n`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
