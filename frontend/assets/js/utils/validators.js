export const validators = {
  required(value, message = 'This field is required') {
    return {
      valid: value !== null && value !== undefined && value.toString().trim() !== '',
      message
    };
  },

  email(value, message = 'Please enter a valid email address') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: !value || emailRegex.test(value),
      message
    };
  },

  minLength(value, length, message = `Minimum ${length} characters required`) {
    return {
      valid: !value || value.length >= length,
      message
    };
  },

  maxLength(value, length, message = `Maximum ${length} characters allowed`) {
    return {
      valid: !value || value.length <= length,
      message
    };
  },

  pattern(value, regex, message = 'Invalid format') {
    return {
      valid: !value || regex.test(value),
      message
    };
  },

  phone(value, message = 'Please enter a valid phone number') {
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return {
      valid: !value || (phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10),
      message
    };
  },

  url(value, message = 'Please enter a valid URL') {
    try {
      if (!value) return { valid: true, message };
      new URL(value);
      return { valid: true, message };
    } catch {
      return { valid: false, message };
    }
  },

  number(value, message = 'Please enter a valid number') {
    return {
      valid: !value || !isNaN(Number(value)),
      message
    };
  },

  min(value, minValue, message = `Value must be at least ${minValue}`) {
    return {
      valid: !value || Number(value) >= minValue,
      message
    };
  },

  max(value, maxValue, message = `Value must be at most ${maxValue}`) {
    return {
      valid: !value || Number(value) <= maxValue,
      message
    };
  },

  match(value, matchValue, message = 'Values do not match') {
    return {
      valid: value === matchValue,
      message
    };
  },

  username(value, message = 'Username must be 3-20 alphanumeric characters') {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return {
      valid: !value || usernameRegex.test(value),
      message
    };
  },

  password(value, message = 'Password must be at least 8 characters with letters and numbers') {
    const hasLength = value && value.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    return {
      valid: hasLength && hasLetter && hasNumber,
      message
    };
  },

  custom(value, validatorFn, message = 'Invalid value') {
    return {
      valid: validatorFn(value),
      message
    };
  }
};
