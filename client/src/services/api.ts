import axios from 'axios';
import { useUserStore } from '../store/userStore';

// In dev, VITE_API_URL is empty → relative URL → Vite proxy forwards to localhost:3001
// In production, VITE_API_URL = https://your-railway-backend.railway.app
const BASE_URL = import.meta.env.VITE_API_URL ?? '';
console.log('[api] VITE_API_URL =', import.meta.env.VITE_API_URL);
console.log('[api] BASE_URL =', BASE_URL);
console.log('[api] baseURL =', `${BASE_URL}/api`);

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 90_000,
});

api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useUserStore.getState().clearUser();
    }
    return Promise.reject(err);
  }
);

export interface CreateRoomResponse { roomId: string; name: string }
export interface RoomInfoResponse { room: any; files: any[] }

export const authApi = {
  register: (data: { name: string; email?: string; password?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  guest: (data: { name: string }) =>
    api.post('/auth/guest', data),
};

export const roomApi = {
  create: (data: { name?: string; isInterviewMode?: boolean }) =>
    api.post<CreateRoomResponse>('/rooms', data),
  get: (roomId: string) =>
    api.get<RoomInfoResponse>(`/rooms/${roomId}`),
  createFile: (roomId: string, name: string) =>
    api.post(`/rooms/${roomId}/files`, { name }),
};

export const executionApi = {
  execute: (data: { code: string; language: string; stdin?: string }) =>
    api.post('/execute', data),
};

export const versionApi = {
  save: (roomId: string, data: { fileId: string; content: string; label?: string }) =>
    api.post(`/rooms/${roomId}/versions`, data),
  list: (roomId: string, fileId: string) =>
    api.get(`/rooms/${roomId}/files/${fileId}/versions`),
  get: (versionId: string) =>
    api.get(`/versions/${versionId}`),
};

export default api;
