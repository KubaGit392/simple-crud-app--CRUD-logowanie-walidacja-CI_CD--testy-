const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const { listTasks, getTask, createTask, updateTask, deleteTask } = require('../../db');
const { errorResponse } = require('../../utils/validation');

const router = express.Router();

function isISODate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s));
}

function validateTask(body) {
  const errors = [];

  // title
  if (!body.title || typeof body.title !== 'string') {
    errors.push({ field: 'title', code: 'REQUIRED', message: 'Pole title jest wymagane' });
  } else if (body.title.trim().length < 3) {
    errors.push({ field: 'title', code: 'INVALID_LENGTH', message: 'Tytuł musi mieć minimum 3 znaki' });
  } else if (body.title.length > 100) {
    errors.push({ field: 'title', code: 'INVALID_LENGTH', message: 'Tytuł może mieć maksymalnie 100 znaków' });
  }

  // due_date
  if (!body.due_date) {
    errors.push({ field: 'due_date', code: 'REQUIRED', message: 'Pole due_date jest wymagane' });
  } else if (!isISODate(body.due_date)) {
    errors.push({ field: 'due_date', code: 'INVALID_FORMAT', message: 'Data musi być w formacie YYYY-MM-DD' });
  } else {
    const dueDate = new Date(body.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      errors.push({ field: 'due_date', code: 'INVALID_VALUE', message: 'Data nie może być z przeszłości' });
    }
  }

  // priority
  if (body.priority === undefined || body.priority === null) {
    errors.push({ field: 'priority', code: 'REQUIRED', message: 'Pole priority jest wymagane' });
  } else {
    const p = Number(body.priority);
    if (!Number.isFinite(p) || p < 1 || p > 5) {
      errors.push({ field: 'priority', code: 'INVALID_VALUE', message: 'Priorytet musi być liczbą od 1 do 5' });
    }
  }

  // description
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push({ field: 'description', code: 'INVALID_TYPE', message: 'Opis musi być tekstem lub null' });
  }

  return errors.length > 0 ? errors : null;
}

// GET /api/tasks
router.get('/', authMiddleware, (req, res) => {
  try {
    const tasks = listTasks();
    res.json(tasks);
  } catch (err) {
    console.error('Błąd pobierania zadań:', err);
    res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

// GET /api/tasks/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json(errorResponse(400, [{
        field: 'id',
        code: 'INVALID_FORMAT',
        message: 'ID musi być liczbą całkowitą większą od 0'
      }]));
    }

    const task = getTask(id);
    if (!task) {
      return res.status(404).json(errorResponse(404, [], 'Zadanie nie znalezione'));
    }

    res.json(task);
  } catch (err) {
    console.error('Błąd pobierania zadania:', err);
    res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

// POST /api/tasks
router.post('/', authMiddleware, (req, res) => {
  try {
    const validationErrors = validateTask(req.body || {});
    if (validationErrors) {
      return res.status(400).json(errorResponse(400, validationErrors));
    }

    const created = createTask({
      title: req.body.title.trim(),
      due_date: req.body.due_date,
      priority: Number(req.body.priority),
      description: req.body.description?.trim() || null
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Błąd tworzenia zadania:', err);
    res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

// PUT /api/tasks/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json(errorResponse(400, [{
        field: 'id',
        code: 'INVALID_FORMAT',
        message: 'ID musi być liczbą całkowitą większą od 0'
      }]));
    }

    const existingTask = getTask(id);
    if (!existingTask) {
      return res.status(404).json(errorResponse(404, [], 'Zadanie nie znalezione'));
    }

    const validationErrors = validateTask(req.body || {});
    if (validationErrors) {
      return res.status(400).json(errorResponse(400, validationErrors));
    }

    const updated = updateTask(id, {
      title: req.body.title.trim(),
      due_date: req.body.due_date,
      priority: Number(req.body.priority),
      description: req.body.description?.trim() || null
    });

    if (!updated) {
      return res.status(500).json(errorResponse(500, [], 'Nie udało się zaktualizować zadania'));
    }

    res.json(updated);
  } catch (err) {
    console.error('Błąd aktualizacji zadania:', err);
    res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json(errorResponse(400, [{
        field: 'id', 
        code: 'INVALID_FORMAT', 
        message: 'ID musi być liczbą całkowitą większą od 0'
      }]));
    }

    const existingTask = getTask(id);
    if (!existingTask) {
      return res.status(404).json(errorResponse(404, [], 'Zadanie nie znalezione'));
    }

    const deleted = deleteTask(id);
    if (!deleted) {
      return res.status(500).json(errorResponse(500, [], 'Nie udało się usunąć zadania'));
    }

    res.status(204).end();
  } catch (err) {
    console.error('Błąd usuwania zadania:', err);
    res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

module.exports = router;