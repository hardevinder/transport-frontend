const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api-transport.edubridgeerp.in/api'
    : 'http://localhost:3100/api';

export const API = {
  // 🔐 Login
  LOGIN: `${BASE_URL}/auth/login`,
  STUDENT_LOGIN: `${BASE_URL}/students/login`,

  // 🏫 Transport Org
  TRANSPORT_PROFILE: `${BASE_URL}/transport-org/profile`,
  TRANSPORT_ORG_PROFILE: `${BASE_URL}/transport-org/profile`,

  // 📦 Master Data
  DRIVERS: `${BASE_URL}/drivers`,
  DRIVER_COUNT: `${BASE_URL}/drivers/count`,        // ✅ NEW
  ROUTES: `${BASE_URL}/routes`,
  ROUTE_COUNT: `${BASE_URL}/routes/count`,          // ✅ NEW
  STOPS: `${BASE_URL}/stops`,
  VEHICLES: `${BASE_URL}/vehicles`,
  STUDENTS: `${BASE_URL}/students`,
  CLASSES: `${BASE_URL}/classes`,
  FINE_SETTINGS: `${BASE_URL}/fine-settings`,
  FEE_STRUCTURES: `${BASE_URL}/fee-structures`,

  // 💸 Transactions
  TRANSACTIONS: `${BASE_URL}/transactions`,
  FEE_DUE_DETAILS: (studentId: string) =>
    `${BASE_URL}/transactions/fee-due-details/${studentId}`,
  COLLECTION_SUMMARY_CARDS: `${BASE_URL}/transactions/collection-summary-cards`,

  // 🚫 Opt-Out Slabs
  OPT_OUT_SLABS: `${BASE_URL}/opt-out-slabs`,
  OPT_OUT_SLAB: (id: string) => `${BASE_URL}/opt-out-slabs/${id}`,

  // 💳 Razorpay Payments
  CREATE_ORDER: `${BASE_URL}/payments/create-order`,
  VERIFY_PAYMENT: `${BASE_URL}/payments/verify-payment`,

  // 👤 Student Profile
  GET_STUDENT_PROFILE: (id: string) => `${BASE_URL}/students/${id}`,
  UPDATE_STUDENT_PROFILE: (id: string) => `${BASE_URL}/students/${id}`,
  UPLOAD_STUDENT_PHOTO: `${BASE_URL}/students/upload-picture`,
};
