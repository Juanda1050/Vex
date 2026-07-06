export interface SessionData {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SessionResult {
  session: SessionData | null;
  error: string | null;
}
