/**
 * Input validation and sanitization for calculation engines
 */

export interface NumericValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

const MAX_SAFE_CALCULATION_VALUE = 1e15; // 1 Petabyte / Petabit range threshold to avoid float overflow

/**
 * Safely parse and validate positive numbers for calculator inputs
 */
export function validatePositiveNumber(
  input: unknown,
  fieldName = 'Value',
  allowZero = false
): NumericValidationResult {
  if (input === null || input === undefined || input === '') {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} is required.`,
    };
  }

  let num: number;
  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') {
      return {
        isValid: false,
        value: 0,
        error: `${fieldName} is required.`,
      };
    }
    num = Number(trimmed);
  } else {
    return {
      isValid: false,
      value: 0,
      error: `Invalid format for ${fieldName}.`,
    };
  }

  if (Number.isNaN(num)) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must be a valid number.`,
    };
  }

  if (!Number.isFinite(num)) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must be a finite number.`,
    };
  }

  if (!allowZero && num <= 0) {
    return {
      isValid: false,
      value: num,
      error: `${fieldName} must be greater than zero.`,
    };
  }

  if (allowZero && num < 0) {
    return {
      isValid: false,
      value: num,
      error: `${fieldName} cannot be negative.`,
    };
  }

  if (num > MAX_SAFE_CALCULATION_VALUE) {
    return {
      isValid: false,
      value: num,
      error: `${fieldName} exceeds maximum allowable calculation limit.`,
    };
  }

  return {
    isValid: true,
    value: num,
  };
}

/**
 * Validate efficiency percentage (typically 1 to 100, default 100)
 */
export function validateEfficiency(
  input: unknown,
  defaultEfficiency = 100
): NumericValidationResult {
  if (input === null || input === undefined || input === '') {
    return { isValid: true, value: defaultEfficiency };
  }

  const result = validatePositiveNumber(input, 'Efficiency', false);
  if (!result.isValid) {
    return result;
  }

  if (result.value > 100) {
    return {
      isValid: false,
      value: result.value,
      error: 'Efficiency cannot exceed 100%.',
    };
  }

  return result;
}
