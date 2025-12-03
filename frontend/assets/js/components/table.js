export class Table {
  constructor(options = {}) {
    this.columns = options.columns || [];
    this.data = options.data || [];
    this.actions = options.actions || [];
    this.onRowClick = options.onRowClick || null;
    this.striped = options.striped || false;
  }

  render() {
    return `
      <div class="table-container">
        <table class="table ${this.striped ? 'table-striped' : ''}">
          <thead>
            <tr>
              ${this.columns.map(col => `
                <th>${col.label}</th>
              `).join('')}
              ${this.actions.length > 0 ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${this.data.length === 0 ? `
              <tr>
                <td colspan="${this.columns.length + (this.actions.length > 0 ? 1 : 0)}" class="text-center text-secondary p-8">
                  No data available
                </td>
              </tr>
            ` : this.data.map((row, index) => `
              <tr data-row-index="${index}" class="${this.onRowClick ? 'cursor-pointer' : ''}">
                ${this.columns.map(col => `
                  <td>${this.formatCell(row, col)}</td>
                `).join('')}
                ${this.actions.length > 0 ? `
                  <td>
                    <div class="table-actions">
                      ${this.actions.map(action => `
                        <button 
                          class="btn btn-sm ${action.class || 'btn-secondary'}"
                          data-action="${action.name}"
                          data-row-index="${index}"
                          ${action.disabled && action.disabled(row) ? 'disabled' : ''}
                        >
                          ${action.label}
                        </button>
                      `).join('')}
                    </div>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  formatCell(row, column) {
    const value = column.field ? row[column.field] : '';
    
    if (column.format) {
      return column.format(value, row);
    }
    
    return value || '-';
  }

  attachEvents(container) {
    // Row click events
    if (this.onRowClick) {
      container.querySelectorAll('tr[data-row-index]').forEach(tr => {
        tr.addEventListener('click', (e) => {
          if (!e.target.closest('button')) {
            const index = parseInt(tr.dataset.rowIndex);
            this.onRowClick(this.data[index], index);
          }
        });
      });
    }

    // Action button events
    container.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionName = btn.dataset.action;
        const rowIndex = parseInt(btn.dataset.rowIndex);
        const action = this.actions.find(a => a.name === actionName);
        
        if (action && action.onClick) {
          action.onClick(this.data[rowIndex], rowIndex);
        }
      });
    });
  }
}
