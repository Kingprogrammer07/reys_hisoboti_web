import { request } from "./client";

export interface LoginPayload {
  username?: string;
  password?: string;
  pin?: string;
}

export interface LoginResponse {
  ok: boolean;
  user: string;
  token?: string;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: string | null;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request<AuthMeResponse>("/api/auth/me"),

  logout: async () => {
    try {
      await request<{ ok: boolean }>("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore network errors on logout
    }
  },
};
