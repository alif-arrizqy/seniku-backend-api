import { Readable } from 'stream';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_IMAGE_WIDTH = 800;
export const MIN_IMAGE_HEIGHT = 600;
export const MAX_IMAGE_WIDTH = 5000;
export const MAX_IMAGE_HEIGHT = 5000;

export function validateFileType(mimetype: string): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }
  return { valid: true };
}

export function validateFileSize(size: number): FileValidationResult {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  return { valid: true };
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function generateFileName(originalName: string, prefix?: string): string {
  const ext = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const name = prefix ? `${prefix}-${timestamp}-${random}.${ext}` : `${timestamp}-${random}.${ext}`;
  return name;
}

export function bufferToStream(buffer: Buffer): Readable {
  return Readable.from(buffer);
}

