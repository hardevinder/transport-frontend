import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api', // your Fastify API base
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add JWT token from localStorage if available
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {}; // ✅ Ensure headers is defined
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
