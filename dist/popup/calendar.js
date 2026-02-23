const Calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  goalStartDate: null,
  entries: [],
  onDayClick: null,

  init(goalStartDate, entries, onDayClick) {
    this.goalStartDate = goalStartDate;
    this.entries = entries || [];
    this.onDayClick = onDayClick;
    this.today = Storage.formatDate(new Date());
    this.render();
  },

  setMonth(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    this.render();
  },

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.render();
  },

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.render();
  },

  getEntriesMap() {
    const map = {};
    this.entries.forEach(entry => {
      map[entry.date] = entry;
    });
    return map;
  },

  render() {
    const monthDisplay = document.getElementById('current-month');
    const grid = document.getElementById('calendar-grid');
    
    monthDisplay.textContent = Storage.getMonthName(this.currentYear, this.currentMonth);
    
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const entriesMap = this.getEntriesMap();
    let html = '';
    
    // Previous month days
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      html += `<div class="calendar-day other-month">${prevMonthLastDay - i}</div>`;
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = entriesMap[dateStr];
      const isToday = dateStr === this.today;
      const isFuture = dateStr > this.today;
      const isBeforeStart = this.goalStartDate && dateStr < this.goalStartDate;
      
      let classes = ['calendar-day'];
      
      if (entry) {
        classes.push('filled');
      } else if (isFuture) {
        classes.push('future');
      } else if (isBeforeStart) {
        classes.push('disabled');
      } else {
        classes.push('empty');
      }
      
      if (isToday) classes.push('today');
      if (isBeforeStart) classes.push('before-start');
      
      const dataAttrs = `data-date="${dateStr}"`;
      const noteAttr = entry ? `data-note="${this.escapeHtml(entry.note)}"` : '';
      
      html += `<div class="${classes.join(' ')}" ${dataAttrs} ${noteAttr}>${day}</div>`;
    }
    
    // Next month days to fill grid
    const remainingDays = 42 - (startDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
      html += `<div class="calendar-day other-month">${day}</div>`;
    }
    
    grid.innerHTML = html;
    
    // Add event listeners - allow clicking on empty, filled, and before-start days
    grid.querySelectorAll('.calendar-day:not(.future):not(.other-month)').forEach(el => {
      el.addEventListener('click', () => {
        if (this.onDayClick) {
          const note = el.dataset.note || null;
          this.onDayClick(el.dataset.date, note);
        }
      });
      
      el.addEventListener('mouseenter', (e) => {
        if (el.dataset.note) {
          this.showTooltip(e, el.dataset.note);
        }
      });
      
      el.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  },

  showTooltip(e, note) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = note;
    tooltip.classList.remove('hidden');
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.bottom + 6}px`;
  },

  hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  updateEntries(entries) {
    this.entries = entries || [];
    this.render();
  }
};
