import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generate = customAlphabet(alphabet, 8);

export function generateRoomId(): string {
  const id = generate();
  return `${id.slice(0, 4)}-${id.slice(4)}`;
}

export function isValidRoomId(id: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(id);
}

export function generateUserId(): string {
  return customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16)();
}

export function generateFileId(): string {
  return customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12)();
}
