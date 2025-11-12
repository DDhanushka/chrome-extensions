// DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const editSection = document.getElementById('editSection');
const editInput = document.getElementById('editInput');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addTodoSection = document.getElementById('addTodoSection');

let todos = [];
let editingId = null;

// Initialize - load todos from storage
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
});

// Load todos from chrome.storage.local
function loadTodos() {
  chrome.storage.local.get(['todos'], (result) => {
    todos = result.todos || [];
    renderTodos();
  });
}

// Save todos to chrome.storage.local
function saveTodos() {
  chrome.storage.local.set({ todos: todos }, () => {
    renderTodos();
  });
}

// Render todos to the list
function renderTodos() {
  todoList.innerHTML = '';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
      <label data-id="${todo.id}">${escapeHtml(todo.text)}</label>
      <div class="todo-actions">
        <span class="icon-btn edit-icon" data-id="${todo.id}"><img src="svg/edit-3.svg" alt="add Icon" width="18" height="18" style="margin-right: 5px;" /></span>
        <span class="icon-btn delete-icon" data-id="${todo.id}"><img src="svg/trash-2.svg" alt="delete Icon" width="18" height="18" /></span>
      </div>
    `;

    todoList.appendChild(li);
  });

  updateCount();
  attachEventListeners();
}

// Update todo count
function updateCount() {
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  todoCount.textContent = `${completedCount}/${totalCount} ${totalCount === 1 ? 'task' : 'tasks'} ${completedCount === totalCount && totalCount > 0 ? 'are done 😃' : completedCount > 0 ? 'done' : ''}`;
}

// Attach event listeners to dynamically created elements
function attachEventListeners() {
  // Checkbox toggle
  document.querySelectorAll('.todo-item input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      toggleTodo(id);
    });
  });

  // Edit button
  document.querySelectorAll('.edit-icon').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      startEdit(id);
    });
  });

  // Delete button
  document.querySelectorAll('.delete-icon').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      deleteTodo(id);
    });
  });
}

// Add new todo
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

function addTodo() {
  const text = todoInput.value.trim();

  if (text === '') {
    return;
  }

  const newTodo = {
    id: Date.now(),
    text: text,
    completed: false
  };

  todos.push(newTodo);
  todoInput.value = '';
  saveTodos();
}

// Toggle todo completion
function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
  }
}

// Start editing a todo
function startEdit(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    editingId = id;
    editInput.value = todo.text;
    editSection.style.display = 'flex';
    addTodoSection.style.display = 'none'
    editInput.focus();
  }
}

// Save edited todo
saveBtn.addEventListener('click', saveEdit);
editInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveEdit();
  }
});

function saveEdit() {
  const text = editInput.value.trim();

  if (text === '' || editingId === null) {
    return;
  }

  const todo = todos.find(t => t.id === editingId);
  if (todo) {
    todo.text = text;
    saveTodos();
  }

  cancelEdit();
}

// Cancel editing
cancelBtn.addEventListener('click', cancelEdit);

function cancelEdit() {
  editingId = null;
  editInput.value = '';
  editSection.style.display = 'none';
  addTodoSection.style.display = 'flex';
}

// Delete todo
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
