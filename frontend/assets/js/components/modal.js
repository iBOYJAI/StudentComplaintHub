export class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.size = options.size || 'md'; // sm, md, lg, xl
    this.onConfirm = options.onConfirm || null;
    this.onCancel = options.onCancel || null;
    this.confirmText = options.confirmText || 'Confirm';
    this.cancelText = options.cancelText || 'Cancel';
    this.showActions = options.showActions !== false;
  }

  render() {
    return `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal modal-${this.size}">
          <div class="modal-header">
            <h3 class="modal-title">${this.title}</h3>
            <button class="modal-close" id="modalClose" aria-label="Close">
              ✕
            </button>
          </div>
          <div class="modal-body">
            ${this.content}
          </div>
          ${this.showActions ? `
            <div class="modal-footer">
              <button class="btn btn-secondary" id="modalCancel">${this.cancelText}</button>
              <button class="btn btn-primary" id="modalConfirm">${this.confirmText}</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  show() {
    const existing = document.getElementById('modalBackdrop');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', this.render());
    this.attachEvents();
  }

  hide() {
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  attachEvents() {
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('modalCancel');
    const confirmBtn = document.getElementById('modalConfirm');

    // Close on backdrop click
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.hide();
        if (this.onCancel) this.onCancel();
      }
    });

    // Close button
    closeBtn?.addEventListener('click', () => {
      this.hide();
      if (this.onCancel) this.onCancel();
    });

    // Cancel button
    cancelBtn?.addEventListener('click', () => {
      this.hide();
      if (this.onCancel) this.onCancel();
    });

    // Confirm button
    confirmBtn?.addEventListener('click', () => {
      if (this.onConfirm) {
        this.onConfirm();
      }
      this.hide();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
        if (this.onCancel) this.onCancel();
      }
    });
  }

  static confirm(title, message, onConfirm) {
    const modal = new Modal({
      title,
      content: `<p>${message}</p>`,
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm
    });
    modal.show();
  }

  static alert(title, message) {
    const modal = new Modal({
      title,
      content: `<p>${message}</p>`,
      showActions: false
    });
    modal.show();
    setTimeout(() => modal.hide(), 3000);
  }
}
