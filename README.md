# **Simple CRUD App (Express \+ SQLite \+ HTML/JS \+ JWT Auth)**

Prosty projekt end-to-end spełniający kryteria zaliczeniowe: własna encja z min. 4 polami, migracje SQL, REST API (GET/GET{id}/POST/PUT/DELETE) z poprawnymi kodami i walidacją, autoryzacja JWT oraz prosty frontend (HTML/CSS/JS) do listowania, dodawania, edytowania i usuwania rekordów.

## **Stos technologiczny**

* Backend: Node.js, Express, better-sqlite3  
* Baza: SQLite (plikowa – brak serwera)  
* Frontend: HTML \+ CSS \+ JavaScript (Fetch API)  
* Autoryzacja: JWT (token w localStorage \+ httpOnly cookie)  
* Migracje: pliki SQL uruchamiane przy starcie  
* Testy: Jest \+ Supertest  
* CI/CD: GitHub Actions (build/test \+ smoke test po wdrożeniu)

## **Wymagania wstępne**

* Node.js 18+ (działa także na 20/22)  
* System z dostępem do portu HTTP

## **Jak uruchomić lokalnie**

1. Zainstaluj zależności:

npm install

2. Start w trybie developerskim (z nodemon):

bash  
npm run dev  

3. Start produkcyjny:

bash  
npm start  

4. Otwórz aplikację:  
* UI: [http://localhost:3000](http://localhost:3000)  
* Healthcheck: [http://localhost:3000/health](http://localhost:3000/health)  
* API: [http://localhost:3000/api/tasks](http://localhost:3000/api/tasks)

## **Zmiana portu**

### **macOS/Linux:**

bash  
Copy  
PORT=8000 npm start  

### **Windows CMD:**

bat  
set PORT=8000 && npm start  

### **Windows PowerShell:**

powershell  
$env:PORT=8000; npm start  

## **Jak uruchomić w środowisku zewnętrznym (lab/hosting)**

Aplikacja nasłuchuje na `0.0.0.0`, więc jest dostępna z sieci zewnętrznej (po otwarciu portu).  
 Ustaw zmienną `PORT` zgodnie z platformą i uruchom:

bash  
Copy  
npm start  

Wejdź na:

* UI: `http://<host>:<PORT>/`  
* API: `http://<host>:<PORT>/api/tasks`

## **Encje i walidacja**

### **Encja: Task (Zadanie)**

* `id`: integer (PRIMARY KEY AUTOINCREMENT)  
* `title`: text (min. 3 znaki, max. 100\)  
* `due_date`: text (data w formacie `YYYY-MM-DD`, nie może być z przeszłości)  
* `priority`: integer od 1 do 5 (CHECK)  
* `description`: text | null

Walidacja (backend):

* `title`: minimum 3 znaki, maksimum 100  
* `due_date`: regex `YYYY-MM-DD` \+ data nie może być z przeszłości  
* `priority`: liczba 1–5  
* `description`: opcjonalny tekst lub `null`

### **Użytkownik**

* `id`: integer (PRIMARY KEY AUTOINCREMENT)  
* `username`: text (unikalny, 3–50 znaków)  
* `email`: text (unikalny, poprawny format)  
* `password_hash`: text (bcrypt)  
* `rola`: `USER`/`ADMIN` (domyślnie `USER`)  
* `created_at`: datetime

Walidacja (backend):

* `username`: 3–50 znaków, unikalny  
* `email`: poprawny format, unikalny  
* `password`: min. 6 znaków

## **Migracje SQL**

Uruchamiają się automatycznie przy starcie serwera (w `db.js`).

* Plik: `migrations/001_create_tasks.sql`

```sql  
CREATE TABLE IF NOT EXISTS tasks (    
  id INTEGER PRIMARY KEY AUTOINCREMENT,    
  title TEXT NOT NULL,    
  due\_date TEXT NOT NULL, \-- format YYYY-MM-DD    
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),    
  description TEXT    
);
```  

* Plik: `migrations/002_create_users.sql`

```sql  
CREATE TABLE IF NOT EXISTS users (    
  id INTEGER PRIMARY KEY AUTOINCREMENT,    
  username TEXT NOT NULL UNIQUE,    
  email TEXT NOT NULL UNIQUE,    
  password\_hash TEXT NOT NULL,    
  rola TEXT NOT NULL DEFAULT 'USER' CHECK(rola IN ('USER','ADMIN')),    
  created\_at TEXT DEFAULT (datetime('now'))    
);
```  

## **Struktura projektu**

* `entities/`  
  * `tasks/`  
    * `routes.js` — trasy REST dla `/api/tasks`  
  * `users/`  
    * `db.js` — operacje DB użytkowników (better-sqlite3)  
    * `routes.js` — rejestracja/logowanie/me/logout (`/api/users`)  
* `middleware/`  
  * `auth.js` — `authMiddleware` (JWT)  
* `migrations/`  
  * `001_create_tasks.sql`  
  * `002_create_users.sql`  
* `public/`  
  * `home.html` — strona główna  
  * `index.html` — panel zadań (CRUD)  
  * `login.html`, `register.html`  
  * `stylesheet.css`  
* `utils/`  
  * `validation.js` — spójny format błędów API  
* `db.js` — połączenie z SQLite \+ migracje \+ zapytania  
* `server.js` — serwer Express (produkcyjny start)  
* `app.js` — inicjalizacja aplikacji (używane m.in. w testach)  
* `tasks.db` — plik bazy (generuje się automatycznie)  
* `tests/` — testy integracyjne i walidacyjne  
* `.github/workflows/ci.yml` — CI/CD pipeline

## **Frontend – funkcje UI**

* Lista zadań, formularz dodawania/edycji, usuwanie.  
* Kolorowe badge dla priorytetów 1–5.  
* Gdy rekord jest edytowany:  
  * przycisk „Edytuj” w danym wierszu jest wyłączony i szary,  
  * wiersz jest delikatnie podświetlony.  
* Natywna walidacja formularza \+ obsługa błędów z backendu.  
* Autoryzacja:  
  * token JWT zapisany w `localStorage`,  
  * wysyłany jako `Authorization: Bearer <token>`.

## **API REST – endpointy i kody**

* GET `/api/tasks`  
  * 200: lista zadań  
* GET `/api/tasks/{id}`  
  * 200: pojedyncze zadanie  
  * 400: błędny format ID  
  * 404: nie znaleziono  
* POST `/api/tasks`  
  * 201: utworzono  
  * 400: błąd walidacji  
* PUT `/api/tasks/{id}`  
  * 200: zaktualizowano  
  * 400: błąd walidacji / format ID  
  * 404: nie znaleziono  
* DELETE `/api/tasks/{id}`  
  * 204: usunięto  
  * 400: błędny format ID  
  * 404: nie znaleziono

Moduł użytkowników:

* POST `/api/users/register`  
  * 201: zarejestrowano (zwraca `token` i `user`)  
  * 400: błąd walidacji  
  * 409: duplikat `username` lub `email`  
* POST `/api/users/login`  
  * 200: zalogowano (zwraca `token` i `user`)  
  * 400: brak danych  
  * 401: nieprawidłowe dane logowania  
* POST `/api/users/logout`  
  * 200: wylogowano (czyści cookie; po stronie frontu usuwany jest też token z localStorage)  
* GET `/api/users/me`  
  * 200: dane zalogowanego użytkownika  
  * 401: brak autoryzacji  
  * 404: użytkownik nie znaleziony

Publiczne:

* GET `/api/public/stats`  
  * 200: `{ users: <liczba_zarejestrowanych> }`

### **Przykładowy payload (Task)**

```json 
{    
  "title": "Wyrzucić śmieci",    
  "due\_date": "2025-10-17",    
  "priority": 2,    
  "description": "Trzeba wyrzucić śmieci :-)"    
}
```  

## **Przykłady curl**

CREATE:
```bash  
curl \-X POST http://localhost:3000/api/tasks \\    
  \-H "Content-Type: application/json" \\    
  \-H "Authorization: Bearer \<TOKEN\>" \\    
  \-d '{"title":"Raport","due\_date":"2025-10-20","priority":3,"description":"do 12:00"}'  
```
LIST:
```bash    
curl \-H "Authorization: Bearer \<TOKEN\>" http://localhost:3000/api/tasks  
```
GET/{id}:
```bash
curl \-H "Authorization: Bearer \<TOKEN\>" http://localhost:3000/api/tasks/1  
```
UPDATE:  
```bash
curl \-X PUT http://localhost:3000/api/tasks/1 \\    
  \-H "Content-Type: application/json" \\    
  \-H "Authorization: Bearer \<TOKEN\>" \\    
  \-d '{"title":"Raport v2","due\_date":"2025-10-21","priority":5,"description":null}'  
```
DELETE:
```bash  
curl \-X DELETE \-i \-H "Authorization: Bearer \<TOKEN\>" http://localhost:3000/api/tasks/1  
```

## **Testy i CI/CD**

* Uruchamianie testów:

```bash  
npm test  
```

* GitHub Actions (`.github/workflows/ci.yml`):  
  * checkout kodu  
  * setup Node.js  
  * `npm ci`, `npm test`  
  * deploy (Render) przez SSH (jeśli skonfigurowano sekrety)  
  * smoke test na `/health`

## **Troubleshooting**

* `SqliteError: no such table: tasks`  
  * Upewnij się, że `migrations/001_create_tasks.sql` i `002_create_users.sql` istnieją;  
     zatrzymaj serwer, usuń plik `tasks.db` i uruchom ponownie (migracje odtworzą tabele).  
* `Error: Cannot find module './entities/tasks/routes'`  
  * Sprawdź ścieżki importów (`../../` vs `./`), zgodność nazw plików i exportów.  
* UI puste, a API zwraca dane  
  * Sprawdź błędy w konsoli przeglądarki (F12 \-\> Console) — najczęściej błąd JS w `index.html`.  
* Problemy z autoryzacją  
  * Sprawdź, czy token JWT jest zapisany w `localStorage` i wysyłany w nagłówku `Authorization: Bearer`.  
  * W razie błędów 401 usuń token i zaloguj się ponownie.

## **Kryteria zaliczeniowe – checklista**

* Model \+ tabela: encja Task (id, title, due\_date, priority, description) \+ migracje SQL.  
* API REST: `GET / GET{id} / POST / PUT / DELETE` z poprawnymi kodami i walidacją.  
* Autoryzacja użytkowników: rejestracja/logowanie, JWT, `/me`, `/logout`.  
* Frontend: strona listująca, dodająca, edytująca i usuwająca encję przez API.  
* README: jak uruchomić (lokalnie \+ w labie), opis endpointów, przykłady curl, troubleshooting.  
* Testy: integracyjne (Jest \+ Supertest).  
* CI/CD: pipeline GitHub Actions \+ smoke test.

## **Źródła (oficjalne)**

* Node.js: [https://nodejs.org/en/docs](https://nodejs.org/en/docs)  
* Express: [https://expressjs.com/](https://expressjs.com/)  
* better-sqlite3: [https://github.com/WiseLibs/better-sqlite3/wiki](https://github.com/WiseLibs/better-sqlite3/wiki)  
* SQLite: [https://sqlite.org/lang.html](https://sqlite.org/lang.html)  
* Fetch API: [https://developer.mozilla.org/en-US/docs/Web/API/Fetch\_API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)  
* Walidacja formularzy: [https://developer.mozilla.org/en-US/docs/Learn/Forms/Form\_validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)