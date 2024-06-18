import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUsersService {
  private onlineUsers: Map<string, { socketId: string; matched: boolean }> =
    new Map();

  addUser(userId: string, socketId: string) {
    this.onlineUsers.set(userId, { socketId, matched: false });
  }

  removeUser(userId: string) {
    this.onlineUsers.delete(userId);
  }

  setMatched(userId: string, matched: boolean) {
    if (this.onlineUsers.has(userId)) {
      this.onlineUsers.get(userId).matched = matched;
    }
  }

  getUnmatchedUsers(): string {
    return Array.from(this.onlineUsers.keys()).filter(
      (userId) => !this.onlineUsers.get(userId).matched,
    )[0];
  }

  getSocketId(userId: string): string | undefined {
    return this.onlineUsers.get(userId)?.socketId;
  }
}
