Bitácora Meta 1.1

Prompt enviado:
Para la construcción de una lista de tareas offline mediante el uso de un asistente de IA para generar los pilares técnicos (Manifest y SW). Cuales serian los primeros pasos para poder trabajar con unicamente con visual studio code en JavaScript

Código relevante recibido:

app.js:
const input = document.getElementById('taskInput');
const button = document.getElementById('addTask');
const list = document.getElementById('taskList');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function renderTasks() {
  list.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.textContent = task;
    li.onclick = () => {
      tasks.splice(index, 1);
      saveTasks();
    };
    list.appendChild(li);
  });
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

button.addEventListener('click', () => {
  if (input.value.trim() !== '') {
    tasks.push(input.value);
    input.value = '';
    saveTasks();
  }
});

renderTasks();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('sw.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.error('Error SW:', err));
}

manifest.json
{
  "name": "Lista de tareas Offline",
  "short_name": "Tareas",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}


sw.js
const CACHE_NAME = 'todo-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Lista de tareas Offline</title>

  <!-- Manifest -->
  <link rel="manifest" href="manifest.json">

  <!-- Estilos -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <h1>📝 Lista de tareas</h1>

  <input id="taskInput" placeholder="Nueva tarea">
  <button id="addTask">Agregar</button>

  <ul id="taskList"></ul>

  <script src="app.js"></script>
</body>
</html>

Análisis crítico y modificaciones:
Aunque el código proporcionado por la inteligencia artificial mostró ser suficiente para el correcto funcionamiento de la aplicación, fue necesario el agregar de forma externa iconos, los cuales fueron guardados dentro del proyecto. El código funciona guardando de forma local los archivos, por lo que se tendrán que hacer modificaciones con un nuevo promp para trabajar con SQLite. 

Prompt enviado:
Cambia el sistema de persistencia de la aplicación para trabajar con SQLite

Código relevante recibido:
index.html:
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Lista de Tareas Offline (SQLite)</title>

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Manifest -->
  <link rel="manifest" href="manifest.json">

  <!-- Estilos -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>

  <h1>📝 Lista de tareas</h1>

  <div class="input-group">
    <input id="taskInput" type="text" placeholder="Nueva tarea">
    <button id="addTask">Agregar</button>
  </div>

  <ul id="taskList"></ul>

  <!-- SQL.js -->
  <script src="sql/sql-wasm.js"></script>

  <!-- App -->
  <script src="app.js"></script>
</body>
</html>

styles.css:
body {
  font-family: Arial, sans-serif;
  background: #f4f4f4;
  padding: 20px;
}

h1 {
  text-align: center;
}

.input-group {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

input {
  padding: 10px;
  width: 200px;
}

button {
  padding: 10px;
  margin-left: 5px;
  cursor: pointer;
}

ul {
  list-style: none;
  padding: 0;
  max-width: 300px;
  margin: auto;
}

li {
  background: white;
  padding: 10px;
  margin-bottom: 5px;
  cursor: pointer;
}

li:hover {
  background: #ffdddd;
}

app.js:
let db;
let SQL;

// Inicializar base de datos SQLite
const initDB = async () => {
  SQL = await initSqlJs({
    locateFile: file => `sql/${file}`
  });

  const savedDb = localStorage.getItem('sqlite-db');

  if (savedDb) {
    const bytes = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL
      );
    `);
    saveDB();
  }
};

// Guardar SQLite en LocalStorage
const saveDB = () => {
  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem('sqlite-db', base64);
};

// CRUD
const addTask = text => {
  db.run('INSERT INTO tasks (text) VALUES (?)', [text]);
  saveDB();
  renderTasks();
};

const deleteTask = id => {
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
  saveDB();
  renderTasks();
};

const getTasks = () => {
  const result = db.exec('SELECT * FROM tasks');
  if (result.length === 0) return [];

  return result[0].values.map(row => ({
    id: row[0],
    text: row[1]
  }));
};

// Render UI
const list = document.getElementById('taskList');

const renderTasks = () => {
  list.innerHTML = '';
  const tasks = getTasks();

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = task.text;
    li.onclick = () => deleteTask(task.id);
    list.appendChild(li);
  });
};

// UI Events
const input = document.getElementById('taskInput');
const button = document.getElementById('addTask');

button.addEventListener('click', () => {
  if (input.value.trim()) {
    addTask(input.value);
    input.value = '';
  }
});

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Inicializar app
initDB().then(renderTasks);

sw.js:
const CACHE_NAME = 'todo-sqlite-cache-v1';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/sql/sql-wasm.js',
  '/sql/sql-wasm.wasm'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(
      response => response || fetch(event.request)
    )
  );
});

manifest.json:
{
  "name": "Lista de tareas Offline SQLite",
  "short_name": "Tareas",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

Análisis crítico y modificaciones:
El nuevo código logra cumplir con el funcionamiento esperado, además de que ahora ya no se utiliza el almacenamiento interno del navegador, ahora utilizando SQLite para la persistencia de los datos.

