// Ключ для localStorage
const STORAGE_KEY = 'tasks_simple';

document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const newTaskInput = document.getElementById('newTaskInput');
    const priorityInput = document.getElementById('priorityInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const taskList = document.getElementById('taskList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedButton = document.getElementById('clearCompleted');
    const totalCountSpan = document.getElementById('totalCount');
    const activeCountSpan = document.getElementById('activeCount');

    // Текущий фильтр
    let currentFilter = 'all';
    
    // Загрузка задач из localStorage
    let tasks = loadTasks();
    
    // Инициализация приложения
    function init() {
        renderTasks();
        updateStats();
        
        // Обработчики событий
        addTaskButton.addEventListener('click', addTask);
        newTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        clearCompletedButton.addEventListener('click', clearCompleted);
        
        filterButtons.forEach(function(button) {
            button.addEventListener('click', function(e) {
                setFilter(e.target.dataset.filter);
            });
        });
        
        // Проверка поддержки localStorage
        if (!window.localStorage) {
            alert('Ваш браузер не поддерживает сохранение данных. Задачи не будут сохраняться.');
        }
    }
    
    // Добавление новой задачи
    function addTask() {
        const text = newTaskInput.value.trim();
        const priority = priorityInput.value;
        
        if (text) {
            const newTask = {
                id: Date.now(),
                text: text,
                priority: priority,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.unshift(newTask);
            saveTasks();
            renderTasks();
            updateStats();
            
            newTaskInput.value = '';
            newTaskInput.focus();
            
            // Вибрация на мобильных устройствах
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            alert('Пожалуйста, введите задачу.');
        }
    }
    
    // Сохранение задач в localStorage
    function saveTasks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Ошибка сохранения:', e);
        }
    }
    
    // Загрузка задач из localStorage
    function loadTasks() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            console.error('Ошибка загрузки задач:', e);
            return [];
        }
    }
    
    // Отображение задач с учетом фильтра
    function renderTasks() {
        const filteredTasks = tasks.filter(function(task) {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });
        
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = getEmptyMessage();
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '30px';
            emptyMessage.style.color = '#6c757d';
            emptyMessage.style.fontSize = '16px';
            taskList.appendChild(emptyMessage);
            return;
        }
        
        filteredTasks.forEach(function(task) {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
    
    // Создание элемента задачи
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task ${task.completed ? 'completed' : ''} priority-${task.priority}`;
        taskItem.setAttribute('data-id', task.id);
        
        const priorityText = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий'
        };
        
        taskItem.innerHTML = 
            `<span class="priority-badge priority-${task.priority}">${priorityText[task.priority]}</span>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="completeButton" aria-label="${task.completed ? 'Вернуть задачу' : 'Выполнить задачу'}">
                    ${task.completed ? '↶' : '✓'}
                </button>
                <button class="deleteButton" aria-label="Удалить задачу">✕</button>
            </div>`;
        
        // Обработчики для кнопок
        const completeButton = taskItem.querySelector('.completeButton');
        completeButton.addEventListener('click', function() {
            toggleComplete(task.id);
        });
        
        const deleteButton = taskItem.querySelector('.deleteButton');
        deleteButton.addEventListener('click', function() {
            deleteTask(task.id);
        });
        
        return taskItem;
    }
    
    // Экранирование HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Переключение статуса выполнения
    function toggleComplete(taskId) {
        tasks = tasks.map(function(task) {
            if (task.id === taskId) {
                return { 
                    ...task,
                    completed: !task.completed
                };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    // Удаление задачи
    function deleteTask(taskId) {
        if (confirm('Удалить эту задачу?')) {
            const taskElement = document.querySelector(`.task[data-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('fade-out');
                setTimeout(function() {
                    tasks = tasks.filter(function(task) {
                        return task.id !== taskId;
                    });
                    saveTasks();
                    renderTasks();
                    updateStats();
                }, 300);
            }
        }
    }
    
    // Установка активного фильтра
    function setFilter(filter) {
        currentFilter = filter;
        
        filterButtons.forEach(function(button) {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
        
        renderTasks();
    }
    
    // Очистка выполненных задач
    function clearCompleted() {
        const completedTasks = tasks.filter(function(task) {
            return task.completed;
        });
        
        if (completedTasks.length === 0) {
            alert('Нет выполненных задач для удаления.');
            return;
        }
        
        if (confirm(`Удалить все выполненные задачи? (${completedTasks.length} шт.)`)) {
            tasks = tasks.filter(function(task) {
                return !task.completed;
            });
            saveTasks();
            renderTasks();
            updateStats();
        }
    }
    
    // Обновление статистики
    function updateStats() {
        const total = tasks.length;
        const active = tasks.filter(function(task) {
            return !task.completed;
        }).length;
        
        totalCountSpan.textContent = total;
        activeCountSpan.textContent = active;
    }
    
    // Сообщение когда список пуст
    function getEmptyMessage() {
        switch (currentFilter) {
            case 'active': return '🎉 Все задачи выполнены!';
            case 'completed': return '📝 Выполненных задач пока нет';
            default: return '📝 Список задач пуст. Добавьте первую задачу!';
        }
    }
    
    // Запуск приложения
    init();
});

// Проверка поддержки localStorage
if (typeof(Storage) === "undefined") {
    alert("Ваш браузер не поддерживает локальное хранилище. Задачи не будут сохраняться.");
}