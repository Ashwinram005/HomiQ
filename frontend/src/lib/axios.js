import axios from "axios";

const instance = axios.create({
  baseURL: "https://homiq.onrender.com/api", // Your local backend URL
  withCredentials: true, // Optional, only if using cookies/auth
});

export default instance;