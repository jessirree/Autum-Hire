// API Configuration
// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  SEND_JOB_ALERT: `${API_BASE_URL}/send-job-alert`,
  SEND_CONTACT_MESSAGE: `${API_BASE_URL}/send-contact-message`,
  NOTIFY_JOB_POSTED: `${API_BASE_URL}/notify-job-posted`,
  BASE_URL: API_BASE_URL,
};

export default API_BASE_URL; 