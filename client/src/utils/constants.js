// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/user`,
  ITEMS: `${API_BASE_URL}/items`,
  ITEM_BY_ID: (id) => `${API_BASE_URL}/items/${id}`,
  USER_BY_ID: (id) => `${API_BASE_URL}/user/${id}`,
  CHANGE_PASSWORD: (id) => `${API_BASE_URL}/user/${id}/password`,
  GOOGLE_AUTH: `${API_BASE_URL}/auth/google`,
  GOOGLE_CODE: `${API_BASE_URL}/auth/google/code`,
  FORGOT_PASSWORD: '/api/forgot',
  VERIFY_CODE: '/api/verify-code',
  RESET_PASSWORD: '/api/reset-password',
};

// reCAPTCHA Configuration
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LepYPArAAAAAFkkMgW82_pHWpvGRiKXa3ZSTBqT';

