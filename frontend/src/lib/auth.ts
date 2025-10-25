// frontend/src/lib/auth.ts
import { jwtDecode } from "jwt-decode";

export interface User {
  id: string;
  username: string;
  email: string;
  debateStats: {
    total: number;
    wins: number;
    losses: number;
    avgScore: number;
  };
}

// --- Token Handling ---
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// --- User Handling ---
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

// --- JWT Validation ---
export const isTokenValid = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    // The backend now sends token with payload { id, iat, exp }
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// --- Authentication Check ---
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token ? isTokenValid(token) : false;
};
