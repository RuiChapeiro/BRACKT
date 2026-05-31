import { http } from './http';

// Typed mirrors of the API's DTOs + the endpoint functions.

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  playerId: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: ApiUser;
}

export interface ApiTournament {
  id: string;
  name: string;
  description: string | null;
  status: string;
  maxParticipants: number | null;
  publicRegistrationToken: string;
  createdAtUtc: string;
}

export const authApi = {
  register: (body: { email: string; password: string; displayName: string }) =>
    http.post<AuthResponse>('/api/auth/register', body),
  login: (body: { email: string; password: string }) =>
    http.post<AuthResponse>('/api/auth/login', body),
  me: () => http.get<ApiUser>('/api/auth/me'),
};

export const tournamentsApi = {
  list: () => http.get<ApiTournament[]>('/api/tournaments'),
  get: (id: string) => http.get<ApiTournament>(`/api/tournaments/${id}`),
  create: (body: { name: string; description?: string; maxParticipants: number }) =>
    http.post<ApiTournament>('/api/tournaments', body),
};
