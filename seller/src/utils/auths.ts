import { supabase } from './supabase';

const SUPABASE_AUTH_KEY = 'sb-iyughaaouhzrhdjcfqle-auth-token';

// Save token is no longer needed manually as Supabase handles it, but we keep it for signature compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setToken(_token: string): void {
  // no-op
}

// Get token
export function getToken(): string | null {
  try {
    const authData = localStorage.getItem(SUPABASE_AUTH_KEY);
    if (!authData) return null;
    const parsed = JSON.parse(authData);
    return parsed.access_token || null;
  } catch {
    return null;
  }
}

// Remove token (logout)
export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem(SUPABASE_AUTH_KEY);
  window.location.href = '/login';
};

// Check if logged in
export function isLoggedIn(): boolean {
  return !!getToken();
}