import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export const ALLOWED_PHOTO_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/** Multer file filter enforcing allowed image MIME types. */
export function photoFileFilter(
  _req: unknown,
  file: { mimetype: string },
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if ((ALLOWED_PHOTO_MIME as readonly string[]).includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException('Only jpg, jpeg and png images are allowed'),
      false,
    );
  }
}

function extensionFor(mimetype: string): string {
  return mimetype === 'image/png' ? 'png' : 'jpg';
}

/** YYYYMMDD for the current server date. */
function dateStamp(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Persist an uploaded photo buffer to
 *   {uploadDir}/attendance/{userId}/{YYYYMMDD}-{kind}.{ext}
 * and return the public path (/uploads/...) to store in the database.
 *
 * Security: userId is coerced to an integer and the resolved path is verified
 * to remain inside the attendance directory (prevents path traversal).
 */
export async function saveAttendancePhoto(params: {
  uploadDir: string;
  userId: number;
  kind: 'checkin' | 'checkout';
  file: { buffer: Buffer; mimetype: string; size: number };
}): Promise<string> {
  const { uploadDir, userId, kind, file } = params;

  if (!file || !file.buffer) {
    throw new BadRequestException('Photo is required');
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new BadRequestException('Photo exceeds the 5MB size limit');
  }
  if (!(ALLOWED_PHOTO_MIME as readonly string[]).includes(file.mimetype)) {
    throw new BadRequestException('Only jpg, jpeg and png images are allowed');
  }

  const safeUserId = Number.parseInt(String(userId), 10);
  if (!Number.isInteger(safeUserId) || safeUserId <= 0) {
    throw new BadRequestException('Invalid user id');
  }

  const attendanceRoot = path.resolve(uploadDir, 'attendance');
  const userDir = path.resolve(attendanceRoot, String(safeUserId));

  // Path traversal guard.
  if (
    userDir !== attendanceRoot &&
    !userDir.startsWith(attendanceRoot + path.sep)
  ) {
    throw new BadRequestException('Invalid upload path');
  }

  await fs.mkdir(userDir, { recursive: true });

  const filename = `${dateStamp(new Date())}-${kind}.${extensionFor(
    file.mimetype,
  )}`;
  const absolutePath = path.join(userDir, filename);
  await fs.writeFile(absolutePath, file.buffer);

  // Public path (served statically at /uploads).
  return `/uploads/attendance/${safeUserId}/${filename}`;
}
