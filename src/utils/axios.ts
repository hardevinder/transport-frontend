import axios from 'axios';

// const BASE_URL =
//   process.env.NODE_ENV === 'production'
//     ? 'https://api-transport.edubridgeerp.in/api'
//     : 'http://localhost:3100/api';

const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api-lstravel.edubridgeerp.in/api'
    : 'http://localhost:2100/api';


const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add JWT token from localStorage if available
instance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('studentToken') || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
