import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api", // Your local backend URL
  withCredentials: true, // Optional, only if using cookies/auth
});

export default instance;