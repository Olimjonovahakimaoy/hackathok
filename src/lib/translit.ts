/** "Jo'rayev O'tkir" → "jorayev.otkir" kabi lotin login */
export function toLogin(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[ʻʼ'’`‘]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.|\.$/g, "");
}
