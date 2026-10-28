
"use strict";

const form = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priority");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const message = document.getElementById("message");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const remainingCount = document.getElementById("remainingCount");

const STORAGE_KEY = "taskflow-tasks-v1";
const VALID_PRIORITIES = ["low", "medium", "high"];

let currentFilter = "all";
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean" &&
      VALID_PRIORITIES.includes(task.priority)
    );
  } catch (error) {
    console.error("Unable to load saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Unable to save tasks:", error);
    showMessage("Could not save tasks. Check your browser storage.");
    return false;
  }
}

function showMessage(text) {
  message.textContent = text;
}

function updateDate() {
  const now = new Date();

  document.getElementById("today").textContent =
    new Intl.DateTimeFormat("en", {
      weekday: "long"
    }).format(now);

  document.getElementById("date").textContent =
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(now);
}

function addTask(title, priority) {
  const task = {
    id: crypto.randomUUID(),
    title,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  showMessage("Task deleted.");
}

function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter(task => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter(task => task.completed);
  }

  return tasks;
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " done" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Complete ${task.title}`);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  const priority = document.createElement("span");
  priority.className = `priority ${task.priority}`;
  priority.textContent = `${task.priority} priority`;

  content.append(title, priority);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  item.append(checkbox, content, deleteButton);

  return item;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  const completed = tasks.filter(task => task.completed).length;

  totalCount.textContent = tasks.length;
  completedCount.textContent = completed;
  remainingCount.textContent = tasks.length - completed;

  taskList.replaceChildren();

  visibleTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });

  emptyState.hidden = visibleTasks.length > 0;
  emptyState.querySelector("h3").textContent =
    tasks.length === 0 ? "No tasks yet" : "Nothing to show";
  emptyState.querySelector("p").textContent =
    tasks.length === 0
      ? "Add a task above to get started."
      : "Try another filter or add a new task.";

  document.querySelectorAll(".filter").forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskInput.value.trim();
  const priority = priorityInput.value;

  if (!title) {
    showMessage("Please enter a task description.");
    taskInput.focus();
    return;
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    showMessage("Please select a valid priority.");
    return;
  }

  addTask(title, priority);
  taskInput.value = "";
  taskInput.focus();
  showMessage("Task added successfully.");
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

document.getElementById("clearCompleted").addEventListener("click", () => {
  const previousCount = tasks.length;
  tasks = tasks.filter(task => !task.completed);

  if (tasks.length === previousCount) {
    showMessage("There are no completed tasks to clear.");
    return;
  }

  saveTasks();
  renderTasks();
  showMessage("Completed tasks cleared.");
});

updateDate();
renderTasks();
