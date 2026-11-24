import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
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

// ── Medication Stop/Resume & Remove helpers ──────────────────────────────────

/**
 * Toggle (or explicitly set) a medicine's status to 'active' or 'stopped'.
 * @param {string} prescriptionId
 * @param {number} medicineIndex
 * @param {string|undefined} status  - optional: 'active' | 'stopped'. Omit to toggle.
 */
export function updateMedicineStatus(prescriptionId, medicineIndex, status) {
  return api.patch(`/medications/${prescriptionId}/${medicineIndex}/status`, status ? { status } : {});
}

/**
 * Permanently remove a medicine from a prescription.
 * @param {string} prescriptionId
 * @param {number} medicineIndex
 */
export function deleteMedicine(prescriptionId, medicineIndex) {
  return api.delete(`/medications/${prescriptionId}/${medicineIndex}`);
}

export default api;
