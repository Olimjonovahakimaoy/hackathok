export const threadIdFor = (a: string, b: string) => [a, b].sort().join("__");
export const otherInThread = (threadId: string, me: string) => threadId.split("__").find((id) => id !== me) ?? me;
