const App = {
  goals: [],
  entries: [],
  currentGoalId: null,
  currentEntryDate: null,
  editingEntry: null,

  async init() {
    this.goals = await Storage.getGoals();
    this.entries = await Storage.getEntries();
    
    this.bindEvents();
    this.renderDashboard();
  },

  bindEvents() {
    document.getElementById('add-goal-btn').addEventListener('click', () => this.showAddGoalModal());
    document.getElementById('cancel-goal-btn').addEventListener('click', () => this.hideAddGoalModal());
    document.getElementById('add-goal-form').addEventListener('submit', (e) => this.handleAddGoal(e));

    document.getElementById('back-btn').addEventListener('click', () => this.showDashboard());
    document.getElementById('delete-goal-btn').addEventListener('click', () => this.deleteCurrentGoal());
    document.getElementById('prev-month').addEventListener('click', () => Calendar.prevMonth());
    document.getElementById('next-month').addEventListener('click', () => Calendar.nextMonth());

    document.getElementById('cancel-entry-btn').addEventListener('click', () => this.hideEntryModal());
    document.getElementById('delete-entry-btn').addEventListener('click', () => this.deleteEntry());
    document.getElementById('entry-form').addEventListener('submit', (e) => this.handleEntrySubmit(e));

    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  },

  renderDashboard() {
    const goalsList = document.getElementById('goals-list');
    const emptyState = document.getElementById('empty-state');
    
    if (this.goals.length === 0) {
      goalsList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }
    
    goalsList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    goalsList.innerHTML = this.goals.map(goal => {
      const goalEntries = this.entries.filter(e => e.goalId === goal.id);
      const completedDays = goalEntries.length;
      const progress = Math.min((completedDays / goal.targetDays) * 100, 100);
      const endDate = Storage.calculateEndDate(goal.startDate, goal.targetDays);
      const isComplete = completedDays >= goal.targetDays;
      
      return `
        <div class="goal-card" data-goal-id="${goal.id}">
          <div class="goal-top">
            <span class="goal-name">${this.escapeHtml(goal.name)}</span>
            <span class="goal-count ${isComplete ? 'complete' : ''}">${completedDays}<span>/${goal.targetDays}</span></span>
          </div>
          <div class="goal-meta">
            <span>${Storage.formatDisplayDate(goal.startDate)} → ${Storage.formatDisplayDate(endDate)}</span>
          </div>
          <div class="goal-progress">
            <div class="goal-progress-fill" style="width: ${progress}%"></div>
          </div>
          
        </div>
      `;
    }).join('');
    
    goalsList.querySelectorAll('.goal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('goal-delete')) return;
        this.showCalendar(card.dataset.goalId);
      });
    });
  },

  showAddGoalModal() {
    const modal = document.getElementById('add-goal-modal');
    document.getElementById('start-date').value = Storage.formatDate(new Date());
    modal.classList.remove('hidden');
    document.getElementById('goal-name').focus();
  },

  hideAddGoalModal() {
    document.getElementById('add-goal-modal').classList.add('hidden');
    document.getElementById('add-goal-form').reset();
  },

  async handleAddGoal(e) {
    e.preventDefault();
    
    const name = document.getElementById('goal-name').value.trim();
    const startDate = document.getElementById('start-date').value;
    const targetDays = parseInt(document.getElementById('target-days').value, 10);
    
    if (!name || !startDate || !targetDays) return;
    
    const goal = {
      id: Storage.generateId(),
      name,
      startDate,
      targetDays,
      createdAt: new Date().toISOString()
    };
    
    this.goals.push(goal);
    await Storage.saveGoals(this.goals);
    
    this.hideAddGoalModal();
    this.renderDashboard();
  },

  showCalendar(goalId) {
    this.currentGoalId = goalId;
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;
    
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('calendar-view').classList.remove('hidden');
    document.getElementById('calendar-goal-name').textContent = goal.name;
    
    const goalEntries = this.entries.filter(e => e.goalId === goalId);
    
    Calendar.init(goal.startDate, goalEntries, (date, note) => {
      this.openEntryModal(date, note);
    });
  },

  showDashboard() {
    document.getElementById('calendar-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    this.currentGoalId = null;
  },

  openEntryModal(date, note) {
    this.currentEntryDate = date;
    this.editingEntry = note ? date : null;
    
    const modal = document.getElementById('entry-modal');
    const dateDisplay = document.getElementById('entry-date-display');
    const noteInput = document.getElementById('entry-note');
    const deleteBtn = document.getElementById('delete-entry-btn');
    
    dateDisplay.textContent = Storage.formatDisplayDate(date);
    noteInput.value = note || '';
    
    deleteBtn.classList.toggle('hidden', !note);
    
    modal.classList.remove('hidden');
    noteInput.focus();
  },

  hideEntryModal() {
    document.getElementById('entry-modal').classList.add('hidden');
    this.currentEntryDate = null;
    this.editingEntry = null;
    document.getElementById('entry-note').value = '';
  },

  async handleEntrySubmit(e) {
    e.preventDefault();
    
    const note = document.getElementById('entry-note').value.trim();
    if (!note) return;
    
    if (this.editingEntry) {
      const entry = this.entries.find(e => e.goalId === this.currentGoalId && e.date === this.currentEntryDate);
      if (entry) {
        entry.note = note;
      }
    } else {
      const entry = {
        id: Storage.generateId(),
        goalId: this.currentGoalId,
        date: this.currentEntryDate,
        note,
        createdAt: new Date().toISOString()
      };
      this.entries.push(entry);
    }
    
    await Storage.saveEntries(this.entries);
    
    const goalEntries = this.entries.filter(e => e.goalId === this.currentGoalId);
    Calendar.updateEntries(goalEntries);
    this.renderDashboard();
    this.hideEntryModal();
  },

  async deleteEntry() {
    this.entries = this.entries.filter(e => !(e.goalId === this.currentGoalId && e.date === this.currentEntryDate));
    await Storage.saveEntries(this.entries);
    
    const goalEntries = this.entries.filter(e => e.goalId === this.currentGoalId);
    Calendar.updateEntries(goalEntries);
    this.renderDashboard();
    this.hideEntryModal();
  },

  async deleteCurrentGoal() {
    if (!this.currentGoalId) return;
    if (!confirm('Delete this goal? All progress will be lost.')) return;
    
    const goalName = this.goals.find(g => g.id === this.currentGoalId)?.name;
    
    this.goals = this.goals.filter(g => g.id !== this.currentGoalId);
    this.entries = this.entries.filter(e => e.goalId !== this.currentGoalId);
    
    await Storage.saveGoals(this.goals);
    await Storage.saveEntries(this.entries);
    
    this.showDashboard();
    this.renderDashboard();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
