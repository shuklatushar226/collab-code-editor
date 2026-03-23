export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface AuthPayload {
  userId: string;
  name: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface GuestUser {
  id: string;
  name: string;
  isGuest: true;
}
