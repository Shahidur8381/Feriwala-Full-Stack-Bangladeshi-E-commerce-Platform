// Move this to a separate file like src/utils/auth.ts for reusability

// Save token
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

// Get token
export function getToken(): string | null {
  return localStorage.getItem('token');
}

// Remove token
export const logout = () => {
  localStorage.removeItem('token');
};


// Check if logged in
export function isLoggedIn(): boolean {
  return !!getToken();
}