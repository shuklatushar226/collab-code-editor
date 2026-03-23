import { redis, cacheGet, cacheSet, cacheDel } from './redis';
import { Room, RoomUser } from '@collab-editor/shared';
import { CONFIG } from '../config';

const ROOM_KEY = (id: string) => `room:${id}`;
const ROOM_USERS_KEY = (id: string) => `room:${id}:users`;
const USER_ROOM_KEY = (userId: string) => `user:${userId}:room`;
const ROOM_YJS_KEY = (id: string) => `room:${id}:yjs`;

export async function getRoomFromCache(roomId: string): Promise<Room | null> {
  return cacheGet<Room>(ROOM_KEY(roomId));
}

export async function setRoomInCache(room: Room): Promise<void> {
  await cacheSet(ROOM_KEY(room.id), room, CONFIG.REDIS.TTL);
}

export async function invalidateRoom(roomId: string): Promise<void> {
  await cacheDel(ROOM_KEY(roomId));
}

export async function addUserToRoom(roomId: string, user: RoomUser): Promise<void> {
  await redis.hset(ROOM_USERS_KEY(roomId), user.id, JSON.stringify(user));
  await redis.expire(ROOM_USERS_KEY(roomId), CONFIG.REDIS.TTL);
  await redis.set(USER_ROOM_KEY(user.id), roomId, 'EX', CONFIG.REDIS.TTL);
}

export async function removeUserFromRoom(roomId: string, userId: string): Promise<void> {
  await redis.hdel(ROOM_USERS_KEY(roomId), userId);
  await cacheDel(USER_ROOM_KEY(userId));
}

export async function getRoomUsers(roomId: string): Promise<RoomUser[]> {
  const usersMap = await redis.hgetall(ROOM_USERS_KEY(roomId));
  if (!usersMap) return [];
  return Object.values(usersMap).map(v => JSON.parse(v) as RoomUser);
}

export async function updateUserInRoom(roomId: string, userId: string, updates: Partial<RoomUser>): Promise<void> {
  const userStr = await redis.hget(ROOM_USERS_KEY(roomId), userId);
  if (!userStr) return;
  const user = JSON.parse(userStr) as RoomUser;
  const updated = { ...user, ...updates };
  await redis.hset(ROOM_USERS_KEY(roomId), userId, JSON.stringify(updated));
}

export async function getUserRoom(userId: string): Promise<string | null> {
  return redis.get(USER_ROOM_KEY(userId));
}

export async function storeYjsState(roomId: string, fileId: string, state: Buffer): Promise<void> {
  await redis.set(`${ROOM_YJS_KEY(roomId)}:${fileId}`, state, 'EX', CONFIG.REDIS.TTL);
}

export async function getYjsState(roomId: string, fileId: string): Promise<Buffer | null> {
  const result = await redis.getBuffer(`${ROOM_YJS_KEY(roomId)}:${fileId}`);
  return result;
}
