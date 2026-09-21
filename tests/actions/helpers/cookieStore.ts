// Backing store for the mocked `next/headers` cookies() (see ../setup.ts).
export const cookieJar = new Map<string, string>();

export function resetCookies() {
  cookieJar.clear();
}
