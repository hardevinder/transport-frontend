import axios from 'axios';
import { API } from '../config/api';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// ✅ Admin login
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    API.LOGIN,
    { email, password }, // ← clean object, not string
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return response.data;
};

// ✅ Student login
export const loginStudent = async (
  admissionNumber: string,
  password: string
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    API.STUDENT_LOGIN,
    { admissionNumber, password }, // ← also clean
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return response.data;
};
