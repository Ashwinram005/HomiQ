import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  userId?: string;
  id?: string;
  _id?: string;
  [key: string]: any;
};

export const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const id = decoded.userId || decoded.id || decoded._id; // depends on how you encoded it
    return id;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};
