// db.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const isTest = process.env.NODE_ENV === 'test';

// 1) Priorytet ścieżki bazy:
//    - DB_FILE z env (może być ':memory:')
//    - w testach fallback na ':memory:'
//    - w innych środowiskach: plik 'tasks.db' obok tego modułu
const DEFAULT_FILE = path.join(__dirname, 'tasks.db');
const envDbFile = process.env.DB_FILE; // np. ":memory:"
const dbPath = envDbFile || (isTest ? ':memory:' : DEFAULT_FILE);

// 2) W testach, tylko jeśli używamy pliku (nie ':memory:'), startuj od czystej bazy
if (isTest && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
  try { fs.unlinkSync(dbPath); } catch {}
}

const db = new Database(dbPath);

// MIGRACJE
function runMigrations() {
  const migrations = [
    '001_create_tasks.sql',
    '002_create_users.sql',
  ];
  const migrationsDir = path.join(__dirname, 'migrations');

  migrations.forEach((file) => {
    const sqlPath = path.join(migrationsDir, file);
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      db.exec(sql);
    }
  });
}
runMigrations();

// Opcjonalnie do testów
function resetTasksSequence({ deleteData = true } = {}) {
  const tx = db.transaction(() => {
    if (deleteData) {
      db.prepare('DELETE FROM tasks').run();
    }
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'tasks'").run();
  });
  tx();
}

// STATEMENTY
const listTasksStmt = db.prepare('SELECT * FROM tasks ORDER BY id DESC');
const getTaskStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
const createTaskStmt = db.prepare(
  'INSERT INTO tasks (title, due_date, priority, description) VALUES (?, ?, ?, ?)'
);
const updateTaskStmt = db.prepare(
  'UPDATE tasks SET title = ?, due_date = ?, priority = ?, description = ? WHERE id = ?'
);
const deleteTaskStmt = db.prepare('DELETE FROM tasks WHERE id = ?');

// API DB
module.exports = {
  db,
  runMigrations,
  resetTasksSequence,
  listTasks: () => listTasksStmt.all(),
  getTask: (id) => getTaskStmt.get(id),
  createTask: (t) => {
    const info = createTaskStmt.run(
      t.title,
      t.due_date,
      t.priority,
      t.description ?? null
    );
    return getTaskStmt.get(info.lastInsertRowid);
  },
  updateTask: (id, t) => {
    const info = updateTaskStmt.run(
      t.title,
      t.due_date,
      t.priority,
      t.description ?? null,
      id
    );
    return info.changes > 0 ? getTaskStmt.get(id) : null;
  },
  deleteTask: (id) => deleteTaskStmt.run(id).changes > 0,
};