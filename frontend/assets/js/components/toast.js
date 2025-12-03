export class Toast {
  static container = null;

  static init() {
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.className = 'toast-container';
      Toast.container.id = 'toastContainer';
      document.body.appendChild(Toast.container);
    }
  }

  static show(message, type = 'info', duration = 4000) {
    Toast.init();

    const toastId = 'toast-' + Date.now();
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };

    const toastHTML = `
      <div class="toast toast-${type}" id="${toastId}">
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
          <div class="toast-title">${titles[type]}</div>
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close">✕</button>
      </div>
    `;

    Toast.container.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const closeBtn = toastElement.querySelector('.toast-close');

    closeBtn.addEventListener('click', () => Toast.remove(toastId));

    if (duration > 0) {
      setTimeout(() => Toast.remove(toastId), duration);
    }
  }

  static remove(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }

  static success(message, duration) {
    Toast.show(message, 'success', duration);
  }

  static error(message, duration) {
    Toast.show(message, 'error', duration);
  }

  static warning(message, duration) {
    Toast.show(message, 'warning', duration);
  }

  static info(message, duration) {
    Toast.show(message, 'info', duration);
  }
}
