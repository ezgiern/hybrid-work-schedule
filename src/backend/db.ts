import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'src/backend/database.sqlite');
const db = new sqlite3.Database(dbPath);


// Veritabanı dosyasının var olup olmadığını kontrol edelim
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at path: ${dbPath}`);
} else {
  console.log('Database connection established');
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      weekly_remote_days INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS WorkSchedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      day TEXT,
      location TEXT,
      note TEXT,
      FOREIGN KEY(user_id) REFERENCES Users(id)
    )
  `);
});

export default db;

