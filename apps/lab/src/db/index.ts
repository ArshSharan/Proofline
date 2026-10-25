import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

let dbInstance: Database.Database | null = null;

export function getDb(customPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath =
    customPath ??
    process.env.LAB_DB_PATH ??
    path.resolve(process.cwd(), "lab.sqlite");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);
  dbInstance = db;
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      mode TEXT NOT NULL,
      params TEXT NOT NULL,
      metrics TEXT,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      max_uses INTEGER NOT NULL,
      uses INTEGER NOT NULL,
      value_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY,
      balance_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      user_id TEXT NOT NULL,
      key TEXT,
      at INTEGER NOT NULL,
      UNIQUE(code, user_id)
    );

    CREATE TABLE IF NOT EXISTS redemptions_naive (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      user_id TEXT NOT NULL,
      key TEXT,
      at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      title TEXT NOT NULL,
      cwe TEXT NOT NULL,
      owasp TEXT NOT NULL,
      vector_vulnerable TEXT NOT NULL,
      vector_hardened TEXT NOT NULL
    );
  `);
}
