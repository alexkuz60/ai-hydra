// File utilities for uploads and storage

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOC_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
export const MAX_FILES = 5;
export const MAX_SIZE_MB = 10;

/**
 * Check if a MIME type is an image type
 */
export function isImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(type);
}

/**
 * Sanitize filename for Supabase Storage (removes Cyrillic and special characters)
 */
export function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const ext = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  
  const safeBaseName = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    || 'file';
  
  return safeBaseName + ext.toLowerCase();
}
