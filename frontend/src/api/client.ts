import type { ApiResponse, ApiErrorResponse } from '../types';

let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
  if (token) {
    sessionStorage.setItem('gym_access_token', token);
  } else {
    sessionStorage.removeItem('gym_access_token');
  }
};

export const getStoredAccessToken = (): string | null => {
  if (currentAccessToken) return currentAccessToken;
  return sessionStorage.getItem('gym_access_token');
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthRefresh?: boolean;
}

export class ApiError extends Error {
  public code: string;
  public details?: Array<{ field?: string; message: string }>;
  public status: number;

  constructor(message: string, code: string, status: number, details?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuthRefresh, ...customConfig } = options;

  let url = endpoint.startsWith('/api') ? endpoint : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customConfig.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    credentials: 'include', // for HttpOnly refresh cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new ApiError(err?.message || 'Network connection failed', 'NETWORK_ERROR', 0);
  }

  // Handle 401 Token Expiry & Automatic Refresh
  if (response.status === 401 && !skipAuthRefresh && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData: ApiResponse<{ accessToken: string }> = await refreshRes.json();
        const newToken = refreshData.data.accessToken;
        setAccessToken(newToken);
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      } else {
        setAccessToken(null);
      }
    } catch {
      setAccessToken(null);
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload = data as ApiErrorResponse | null;
    const message = errorPayload?.error?.message || response.statusText || 'An unexpected error occurred';
    const code = errorPayload?.error?.code || `HTTP_${response.status}`;
    const details = errorPayload?.error?.details;
    throw new ApiError(message, code, response.status, details);
  }

  return (data as ApiResponse<T>).data;
}
