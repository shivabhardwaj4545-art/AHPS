import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Derive 32-byte key from ENCRYPTION_KEY
const getKey = (): Buffer => {
  return crypto.createHash('sha256').update(String(env.ENCRYPTION_KEY)).digest();
};

export const encrypt = (text: string | null | undefined): string | null => {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return null;
  }
};

export const decrypt = (encryptedText: string | null | undefined): string | null => {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText; // Fallback if plain text

    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return null;
  }
};

// Mask sensitive numbers, e.g. "XXXXXXXX1234"
export const maskSensitive = (text: string | null | undefined, visibleEndChars = 4): string => {
  if (!text) return '';
  if (text.length <= visibleEndChars) return text;
  const maskedLength = text.length - visibleEndChars;
  return 'X'.repeat(maskedLength) + text.slice(-visibleEndChars);
};

