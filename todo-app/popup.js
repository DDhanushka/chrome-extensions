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
const themeIcon = document.getElementById('theme-icon');

let isDarkMode = false;

let todos = [];
let editingId = null;

// Initialize - load todos from storage
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  loadTheme();
});

// Load todos from chrome.storage.sync
function loadTodos() {
  chrome.storage.sync.get(['todos'], (result) => {
    todos = result.todos || [];
    renderTodos();
  });
}

// Save todos to chrome.storage.sync
function saveTodos() {
  chrome.storage.sync.set({ todos: todos }, () => {
    renderTodos();
  });
}

// Render todos to the list
function renderTodos() {
  todoList.innerHTML = '';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.draggable = true;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <span class="drag-handle">⋮⋮</span>
      <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
      <label data-id="${todo.id}">${escapeHtml(todo.text)}</label>
      <div class="todo-actions">
        <span class="icon-btn edit-icon" data-id="${todo.id}">
          <img src="svg/edit-3.svg" alt="add Icon" width="18" height="18" style="margin-right: 5px;" class="todo-svg" />
        </span>
        <span class="icon-btn delete-icon" data-id="${todo.id}">
          <img src="svg/trash-2.svg" alt="delete Icon" width="18" height="18" class="todo-svg" />
        </span>
      </div>
    `;

    todoList.appendChild(li);
  });

  updateCount();
  attachEventListeners();
  attachDragListeners();
  updateSvgFilters();
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

// Drag and drop functionality
let draggedElement = null;
let draggedIndex = null;

function attachDragListeners() {
  const todoItems = document.querySelectorAll('.todo-item');

  todoItems.forEach((item, index) => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedIndex = Array.from(todoList.children).indexOf(draggedElement);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';

  // Add drag-over class while dragging over
  if (e.currentTarget !== draggedElement) {
    e.currentTarget.classList.add('drag-over');
  }

  return false;
}

function handleDragEnter(e) {
  e.preventDefault();
  if (e.currentTarget !== draggedElement) {
    e.currentTarget.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  // Only remove if we're actually leaving the todo-item, not just entering a child
  if (e.currentTarget === e.target) {
    e.currentTarget.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  e.currentTarget.classList.remove('drag-over');

  if (draggedElement !== e.currentTarget) {
    const dropIndex = Array.from(todoList.children).indexOf(e.currentTarget);

    // Reorder the todos array
    const draggedTodo = todos[draggedIndex];
    todos.splice(draggedIndex, 1);
    todos.splice(dropIndex, 0, draggedTodo);

    saveTodos();
  }

  return false;
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');

  // Remove drag-over class from all items
  document.querySelectorAll('.todo-item').forEach((item) => {
    item.classList.remove('drag-over');
  });

  draggedElement = null;
  draggedIndex = null;
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

// Theme Toggle Functions
function loadTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    const theme = result.theme || 'light';
    applyTheme(theme);
  });
}

function updateSvgFilters() {
  const filterValue = isDarkMode ? 'invert(1)' : 'invert(0)';

  // Update theme icon
  themeIcon.style.filter = filterValue;

  // Update all todo SVG icons
  document.querySelectorAll('.todo-svg').forEach((img) => {
    img.style.filter = filterValue;
  });
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    themeIcon.src = 'svg/sun.svg';
    isDarkMode = true;
  } else {
    document.body.classList.remove('dark-theme');
    themeIcon.src = 'svg/moon.svg';
    isDarkMode = false;
  }

  updateSvgFilters();
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-theme');
  const newTheme = isDark ? 'light' : 'dark';

  chrome.storage.local.set({ theme: newTheme }, () => {
    applyTheme(newTheme);
  });
}

// Theme icon click event
themeIcon.addEventListener('click', toggleTheme);
