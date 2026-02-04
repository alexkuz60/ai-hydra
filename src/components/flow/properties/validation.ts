// Validation utilities for node property forms

export interface ValidationError {
  field: string;
  message: string;
}

export function validateUrl(url: string): string | null {
  if (!url.trim()) return null; // Empty is ok, will be caught by required check
  try {
    new URL(url);
    return null;
  } catch {
    // Check if it's a template variable
    if (url.includes('{{') && url.includes('}}')) {
      return null; // Template variables are allowed
    }
    return 'invalidUrl';
  }
}

export function validateJson(value: string): string | null {
  if (!value.trim()) return null;
  try {
    JSON.parse(value);
    return null;
  } catch {
    return 'invalidJson';
  }
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return 'required';
  }
  return null;
}

export function validatePositiveNumber(value: number | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || value <= 0) {
    return 'mustBePositive';
  }
  return null;
}

export function validateNonNegativeNumber(value: number | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || value < 0) {
    return 'mustBeNonNegative';
  }
  return null;
}

export function validateTableName(value: string): string | null {
  if (!value.trim()) return null;
  // Table names should be alphanumeric with underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value) && !value.includes('{{')) {
    return 'invalidTableName';
  }
  return null;
}

export function validateBucketName(value: string): string | null {
  if (!value.trim()) return null;
  // Bucket names should be lowercase alphanumeric with hyphens
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(value) && !value.includes('{{')) {
    return 'invalidBucketName';
  }
  return null;
}
