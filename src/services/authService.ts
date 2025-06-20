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

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(API.LOGIN, { email, password });
  return response.data;
};
