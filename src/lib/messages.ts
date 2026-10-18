import type { Database } from "./types";

export function unreadCount(db: Database, userId: string) {
  let n = 0;
  for (const m of db.messages) {
    if (m.senderId !== userId && !m.readAt && m.threadId.split("__").includes(userId)) n++;
  }
  return n;
}
