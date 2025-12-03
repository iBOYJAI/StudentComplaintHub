export class Form {
  static getFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      // Handle multiple values (checkboxes with same name)
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }

  static setFormData(formElement, data) {
    Object.keys(data).forEach(key => {
      const input = formElement.elements[key];
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = Boolean(data[key]);
        } else if (input.type === 'radio') {
          const radio = formElement.querySelector(`input[name="${key}"][value="${data[key]}"]`);
          if (radio) radio.checked = true;
        } else {
          input.value = data[key] || '';
        }
      }
    });
  }

  static clearForm(formElement) {
    formElement.reset();
    formElement.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });
    formElement.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
    });
  }

  static showErrors(formElement, errors) {
    // Clear previous errors
    formElement.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });

    // Show new errors
    Object.keys(errors).forEach(fieldName => {
      const input = formElement.elements[fieldName];
      const errorMessage = errors[fieldName];

      if (input) {
        input.classList.add('is-invalid');
        const feedback = input.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
          feedback.textContent = errorMessage;
        }
      }
    });
  }

  static validate(formElement, rules) {
    const data = Form.getFormData(formElement);
    const errors = {};

    Object.keys(rules).forEach(fieldName => {
      const value = data[fieldName];
      const fieldRules = rules[fieldName];

      fieldRules.forEach(rule => {
        if (rule.required && (!value || value.trim() === '')) {
          errors[fieldName] = rule.message || `${fieldName} is required`;
        } else if (rule.minLength && value && value.length < rule.minLength) {
          errors[fieldName] = rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
        } else if (rule.maxLength && value && value.length > rule.maxLength) {
          errors[fieldName] = rule.message || `${fieldName} must be less than ${rule.maxLength} characters`;
        } else if (rule.pattern && value && !rule.pattern.test(value)) {
          errors[fieldName] = rule.message || `${fieldName} format is invalid`;
        } else if (rule.custom && !rule.custom(value, data)) {
          errors[fieldName] = rule.message || `${fieldName} is invalid`;
        }
      });
    });

    if (Object.keys(errors).length > 0) {
      Form.showErrors(formElement, errors);
      return false;
    }

    return true;
  }

  static createField(config) {
    const {
      type = 'text',
      name,
      label,
      required = false,
      placeholder = '',
      value = '',
      options = [],
      helpText = ''
    } = config;

    let inputHTML = '';

    if (type === 'textarea') {
      inputHTML = `<textarea class="form-control" name="${name}" placeholder="${placeholder}" ${required ? 'required' : ''}>${value}</textarea>`;
    } else if (type === 'select') {
      inputHTML = `
        <select class="form-control" name="${name}" ${required ? 'required' : ''}>
          <option value="">Select ${label}</option>
          ${options.map(opt => `
            <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>
          `).join('')}
        </select>
      `;
    } else if (type === 'checkbox') {
      inputHTML = `
        <div class="form-check">
          <input type="checkbox" class="form-check-input" name="${name}" value="1" ${value ? 'checked' : ''}>
          <label class="form-check-label">${label}</label>
        </div>
      `;
      return inputHTML; // Return early for checkbox (no label wrapper needed)
    } else {
      inputHTML = `<input type="${type}" class="form-control" name="${name}" placeholder="${placeholder}" value="${value}" ${required ? 'required' : ''}>`;
    }

    return `
      <div class="form-group">
        <label class="form-label ${required ? 'required' : ''}">${label}</label>
        ${inputHTML}
        ${helpText ? `<small class="form-text">${helpText}</small>` : ''}
        <div class="invalid-feedback"></div>
      </div>
    `;
  }
}
