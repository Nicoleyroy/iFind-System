// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/user`,
  USERS: `${API_BASE_URL}/users`,
  LOST_ITEMS: `${API_BASE_URL}/lost-items`,
  LOST_ITEM_BY_ID: (id) => `${API_BASE_URL}/lost-items/${id}`,
  FOUND_ITEMS: `${API_BASE_URL}/found-items`,
  FOUND_ITEM_BY_ID: (id) => `${API_BASE_URL}/found-items/${id}`,
  USER_BY_ID: (id) => `${API_BASE_URL}/user/${id}`,
  CHANGE_PASSWORD: (id) => `${API_BASE_URL}/user/${id}/password`,
  GOOGLE_AUTH: `${API_BASE_URL}/auth/google`,
  GOOGLE_CODE: `${API_BASE_URL}/auth/google/code`,
  FORGOT_PASSWORD: '/api/forgot',
  VERIFY_CODE: '/api/verify-code',
  RESET_PASSWORD: '/api/reset-password',
  CLAIM_LOST_ITEM: (id) => `${API_BASE_URL}/lost-items/${id}/claim`,
  CLAIM_FOUND_ITEM: (id) => `${API_BASE_URL}/found-items/${id}/claim`,
  CLAIMS: `${API_BASE_URL}/claims`,
  CLAIMS_ANALYTICS: `${API_BASE_URL}/claims/analytics`,
  CLAIM_BY_ID: (id) => `${API_BASE_URL}/claims/${id}`,
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_BASE_URL}/notifications/unread-count`,
  NOTIFICATION_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/notifications/read-all`,
  AUDIT_LOGS: `${API_BASE_URL}/audit-logs`,
  AUDIT_LOGS_STATS: `${API_BASE_URL}/audit-logs/stats`,
};

// reCAPTCHA Configuration
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LepYPArAAAAAFkkMgW82_pHWpvGRiKXa3ZSTBqT';

