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
