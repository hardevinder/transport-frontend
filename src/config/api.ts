const BASE_URL = 'http://localhost:3000/api';

export const API = {
  LOGIN: `${BASE_URL}/auth/login`,
  TRANSPORT_PROFILE: `${BASE_URL}/transport-org/profile`,
  TRANSPORT_ORG_PROFILE: `${BASE_URL}/transport-org/profile`, // ✅ Added for clarity
  DRIVERS: `${BASE_URL}/drivers`,
  ROUTES: `${BASE_URL}/routes`,
  STOPS: `${BASE_URL}/stops`,
  VEHICLES: `${BASE_URL}/vehicles`,
  STUDENTS: `${BASE_URL}/students`,
  CLASSES: `${BASE_URL}/classes`,
  FINE_SETTINGS: `${BASE_URL}/fine-settings`,
  FEE_STRUCTURES: `${BASE_URL}/fee-structures`,

  // ✅ Fee Collection
  TRANSACTIONS: `${BASE_URL}/transactions`,

   // Opt-Out-Slabs CRUD
  OPT_OUT_SLABS:       `${BASE_URL}/opt-out-slabs`,
  OPT_OUT_SLAB:        (id: string) => `${BASE_URL}/opt-out-slabs/${id}`,
};
