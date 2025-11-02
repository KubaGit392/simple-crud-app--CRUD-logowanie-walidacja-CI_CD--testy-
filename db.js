// db.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const isTest = process.env.NODE_ENV === 'test';
const DB_FILE = path.join(__dirname, isTest ? 'tasks.test.db' : 'tasks.db');

// W trybie testowym startuj zawsze od czystej bazy
if (isTest && fs.existsSync(DB_FILE)) {
  try { fs.unlinkSync(DB_FILE); } catch {}
}

const db = new Database(DB_FILE);

// MIGRACJE
function runMigrations() {
  const migrations = [
    '001_create_tasks.sql',
    '002_create_users.sql'
  ];
  migrations.forEach(file => {
    const sqlPath = path.join(__dirname, 'migrations', file);
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
    const info = createTaskStmt.run(t.title, t.due_date, t.priority, t.description ?? null);
    return getTaskStmt.get(info.lastInsertRowid);
  },
  updateTask: (id, t) => {
    const info = updateTaskStmt.run(t.title, t.due_date, t.priority, t.description ?? null, id);
    return info.changes > 0 ? getTaskStmt.get(id) : null;
  },
  deleteTask: (id) => deleteTaskStmt.run(id).changes > 0,
};