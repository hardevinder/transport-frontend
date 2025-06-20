// src/config/api.ts

const BASE_URL = 'http://localhost:3000/api';

export const API = {
  LOGIN: `${BASE_URL}/auth/login`,
  TRANSPORT_PROFILE: `${BASE_URL}/transport-org/profile`, // ✅ Transport profile CRUD API
  DRIVERS: `${BASE_URL}/drivers`,                         // ✅ Driver management API
  ROUTES: `${BASE_URL}/routes`,                           // ✅ Route management API
  STOPS: `${BASE_URL}/stops`,                             // ✅ Stop management API (by routeId)
};
