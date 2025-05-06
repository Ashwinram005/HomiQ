// src/utils/auth.ts
export const getToken = () => localStorage.getItem("token");

export const isAuthenticated = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch("http://localhost:5000/api/users/validate-token", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const logout = async () => {
  // Clear any stored auth data
  localStorage.removeItem("token");

  // Optionally: call backend logout API
  // await fetch('/api/logout', { method: 'POST' });

  // You could also clear cookies or invalidate sessions here
};

