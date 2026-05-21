// --- App State Management ---
let state = {
    habits: [],       // Array of { id, name }
    history: {},      // Object mapping habitId -> array of completed date strings "YYYY-MM-DD"
    currentWeekMonday: null // Date object pointing to currently viewed Monday
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setWeekToCurrent();
    renderApp();
    setupEventListeners();
});

// --- LocalStorage Layer ---
function loadData() {
    const savedHabits = localStorage.getItem("pulse_habits");
    const savedHistory = localStorage.getItem("pulse_history");
    
    state.habits = savedHabits ? JSON.parse(savedHabits) : [];
    state.history = savedHistory ? JSON.parse(savedHistory) : {};
}

function saveData() {
    localStorage.setItem("pulse_habits", JSON.stringify(state.habits));
    localStorage.setItem("pulse_history", JSON.stringify(state.history));
}

// --- Date Math Engine ---
function setWeekToCurrent() {
    const today = new Date();
    state.currentWeekMonday = getMondayOfDate(today);
}

function getMondayOfDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    // In JS getDay(): Sun=0, Mon=1... Sat=6. Convert to standard Monday start:
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getDaysOfWeek(mondayDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(mondayDate);
        nextDay.setDate(mondayDate.getDate() + i);
        days.push(nextDay);
    }
    return days;
}

function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- Streak Calculation Engine ---
function calculateCurrentStreak(habitId) {
    const records = state.history[habitId] || [];
    if (records.length === 0) return 0;

    const recordSet = new Set(records);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todayStr = formatDateString(today);
    const yesterdayStr = formatDateString(yesterday);

    let checkDate = null;

    // Streak Logic Strategy:
    // If today is checked -> start streak evaluation today.
    // If today is not checked but yesterday was -> start evaluating from yesterday.
    // Otherwise -> streak is currently zero.
    if (recordSet.has(todayStr)) {
        checkDate = today;
    } else if (recordSet.has(yesterdayStr)) {
        checkDate = yesterday;
    } else {
        return 0;
    }

    let streakCount = 0;
    while (true) {
        const checkStr = formatDateString(checkDate);
        if (recordSet.has(checkStr)) {
            streakCount++;
            // Move backward one full calendar day
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streakCount;
}

// --- Rendering Layer ---
function renderApp() {
    const emptyStateEl = document.getElementById("empty-state");
    const gridContainerEl = document.getElementById("grid-container");
    
    if (state.habits.length === 0) {
        emptyStateEl.classList.remove("hidden");
        gridContainerEl.style.display = "none";
        updateWeekLabelOnly();
        return;
    }

    emptyStateEl.classList.add("hidden");
    gridContainerEl.style.display = "block";

    const days = getDaysOfWeek(state.currentWeekMonday);
    renderTableHeader(days);
    renderTableRows(days);
}

function updateWeekLabelOnly() {
    const days = getDaysOfWeek(state.currentWeekMonday);
    const startStr = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById("week-label").textContent = `${startStr} – ${endStr}`;
}

function renderTableHeader(days) {
    const headerRow = document.getElementById("table-header-row");
    const todayStr = formatDateString(new Date());

    let html = `<th class="col-habit">Habit Name</th>
                <th class="col-streak">Streak</th>`;

    days.forEach(day => {
        const dayStr = formatDateString(day);
        const isToday = dayStr === todayStr;
        const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = day.getDate();
        
        html += `
            <th class="col-day ${isToday ? 'today-col' : ''}">
                <div>${dayName}</div>
                <div style="font-size: 1.1rem; margin-top: 0.2rem; color: var(--text-primary);">${dayNum}</div>
            </th>`;
    });

    headerRow.innerHTML = html;
}

function renderTableRows(days) {
    const tableBody = document.getElementById("table-body");
    const todayStr = formatDateString(new Date());
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    let html = "";

    state.habits.forEach(habit => {
        const records = state.history[habit.id] || [];
        const currentStreak = calculateCurrentStreak(habit.id);

        html += `<tr>`;
        // Habit Column with inline Actions
        html += `
            <td class="col-habit">
                <div class="habit-actions">
                    <span class="habit-name-text" onclick="renameHabit('${habit.id}')" title="Click to rename">${escapeHtml(habit.name)}</span>
                    <button class="action-icon-btn" onclick="deleteHabit('${habit.id}')" title="Delete habit" aria-label="Delete ${escapeHtml(habit.name)}">🗑</button>
                </div>
            </td>`;
        
        // Streak Display Column
        html += `
            <td class="col-streak">
                <span class="streak-badge">🔥 ${currentStreak}d</span>
            </td>`;
        
        // 7 Toggle Checkbox Grid Cells
        days.forEach(day => {
            const dayStr = formatDateString(day);
            const isChecked = records.includes(dayStr);
            const isToday = dayStr === todayStr;
            
            // Assessment Guardrail: "Future weeks may be empty or disabled"
            // Disallow clicking days that are further in the timeline than today
            const isFuture = day > startOfToday;

            html += `
                <td class="col-day ${isToday ? 'today-col' : ''}">
                    <button 
                        class="cell-toggle ${isChecked ? 'checked' : ''}" 
                        onclick="toggleDay('${habit.id}', '${dayStr}')"
                        ${isFuture ? 'disabled' : ''}
                        aria-label="Toggle ${escapeHtml(habit.name)} for ${dayStr}">
                    </button>
                </td>`;
        });

        html += `</tr>`;
    });

    tableBody.innerHTML = html;
}

// --- Action & Mutation Handlers ---
function toggleDay(habitId, dateStr) {
    if (!state.history[habitId]) {
        state.history[habitId] = [];
    }

    const index = state.history[habitId].indexOf(dateStr);
    if (index > -1) {
        state.history[habitId].splice(index, 1); // Uncheck
    } else {
        state.history[habitId].push(dateStr);    // Check
    }

    saveData();
    renderApp();
}

function renameHabit(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    const newName = prompt("Rename your habit:", habit.name);
    if (newName === null) return; // Cancel clicked
    
    const trimmed = newName.trim();
    if (trimmed === "") {
        alert("Habit name cannot be empty.");
        return;
    }

    habit.name = trimmed;
    saveData();
    renderApp();
}

function deleteHabit(habitId) {
    if (!confirm("Are you sure you want to delete this habit and all its history?")) return;

    state.habits = state.habits.filter(h => h.id !== habitId);
    delete state.history[habitId];

    saveData();
    renderApp();
}

// --- Setup Event Subscriptions ---
function setupEventListeners() {
    // Form submission event
    document.getElementById("add-habit-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("habit-input");
        const name = input.value.trim();
        
        if (name) {
            const newHabit = {
                id: "habit_" + Date.now(),
                name: name
            };
            state.habits.push(newHabit);
            state.history[newHabit.id] = [];
            
            saveData();
            input.value = "";
            renderApp();
        }
    });

    // Week navigation buttons
    document.getElementById("prev-week-btn").addEventListener("click", () => {
        state.currentWeekMonday.setDate(state.currentWeekMonday.getDate() - 7);
        renderApp();
    });

    document.getElementById("next-week-btn").addEventListener("click", () => {
        state.currentWeekMonday.setDate(state.currentWeekMonday.getDate() + 7);
        renderApp();
    });

    document.getElementById("current-week-btn").addEventListener("click", () => {
        setWeekToCurrent();
        renderApp();
    });
}

// --- Helper Functions ---
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}