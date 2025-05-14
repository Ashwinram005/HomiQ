import { jwtDecode } from "jwt-decode";

export const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const id = decoded.userId || decoded.id || decoded._id; // depends on how you encoded it
    return id;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};
