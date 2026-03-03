const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());
// Middleware для CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Разрешить все источники
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  // Обработка preflight-запросов (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Путь к файлу базы данных
const dbPath = path.join(__dirname, "comments.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.message);
  } else {
    console.log("Подключено к базе данных SQLite.");
    // Создаем таблицу, если её нет
    db.run(
      `
            CREATE TABLE IF NOT EXISTS Comment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fio TEXT NOT NULL,
                user_email TEXT NOT NULL
            )
        `,
      (err) => {
        if (err) {
          console.error("Ошибка создания таблицы:", err.message);
        } else {
          console.log("Таблица Comment проверена/создана.");
          // Добавляем тестовые записи, если таблица пуста
          db.get("SELECT COUNT(*) AS count FROM Comment", (err, row) => {
            if (err) {
              console.error("Ошибка проверки количества записей:", err.message);
            } else if (row.count === 0) {
              const testComments = [
                ["Иван Иванов", "ivan@example.com"],
                ["Петр Петров", "petr@example.com"],
                ["Анна Смирнова", "anna@example.com"],
              ];
              const stmt = db.prepare(
                "INSERT INTO Comment (fio, user_email) VALUES (?, ?)",
              );
              testComments.forEach((comment) => {
                stmt.run(comment[0], comment[1], (err) => {
                  if (err)
                    console.error(
                      "Ошибка вставки тестовых данных:",
                      err.message,
                    );
                });
              });
              stmt.finalize();
              console.log("Тестовые записи добавлены.");
            }
          });
        }
      },
    );
  }
});

// Вспомогательная функция для выполнения запросов с промисами
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function queryGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function queryRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Маршруты API

// GET /api/comments - получение всех комментариев
app.get("/api/comments", async (req, res) => {
  try {
    const comments = await query("SELECT * FROM Comment ORDER BY id DESC");
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/comment/:id - получение одного комментария
app.get("/api/comment/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const comment = await queryGet("SELECT * FROM Comment WHERE id = ?", [id]);
    if (!comment) {
      return res.status(404).json({ error: "Комментарий не найден" });
    }
    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST /api/comment - добавление комментария
app.post("/api/comment", async (req, res) => {
  const { fio, user_email } = req.body;
  if (!fio || !user_email) {
    return res.status(400).json({ error: "Поля fio и user_email обязательны" });
  }
  // Простейшая валидация email (можно улучшить)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user_email)) {
    return res.status(400).json({ error: "Некорректный email" });
  }

  try {
    const result = await queryRun(
      "INSERT INTO Comment (fio, user_email) VALUES (?, ?)",
      [fio, user_email],
    );
    res.status(201).json({ id: result.id, fio, user_email });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
