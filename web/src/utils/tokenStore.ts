let accessToken: string | null = null;

export function setAccessTokenForClient(token: string | null): void {
  accessToken = token;
}

export function getAccessTokenForClient(): string | null {
  return accessToken;
}
