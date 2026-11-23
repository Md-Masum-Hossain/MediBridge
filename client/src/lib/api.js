import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer Token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('medibridge_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract clean data & handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

// Backward-compatible fetchApi helper
export async function fetchApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toLowerCase();
  let data = undefined;

  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        data = JSON.parse(options.body);
      } catch {
        data = options.body;
      }
    } else {
      data = options.body;
    }
  }

  return api.request({
    url: endpoint,
    method,
    data,
    headers: options.headers,
  });
}

export default api;
