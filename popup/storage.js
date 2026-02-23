const Storage = {
  KEYS: {
    GOALS: 'streekflow_goals',
    ENTRIES: 'streekflow_entries'
  },

  async getGoals() {
    const data = await chrome.storage.local.get(this.KEYS.GOALS);
    return data[this.KEYS.GOALS] || [];
  },

  async saveGoals(goals) {
    await chrome.storage.local.set({ [this.KEYS.GOALS]: goals });
  },

  async getEntries() {
    const data = await chrome.storage.local.get(this.KEYS.ENTRIES);
    return data[this.KEYS.ENTRIES] || [];
  },

  async saveEntries(entries) {
    await chrome.storage.local.set({ [this.KEYS.ENTRIES]: entries });
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  getMonthName(year, month) {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  },

  calculateEndDate(startDate, targetDays) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + targetDays);
    return this.formatDate(end);
  },

  daysBetween(date1, date2) {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    const diffTime = d2 - d1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};
