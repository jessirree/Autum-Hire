// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.autumhire.com' 
  : 'http://localhost:3001';

export const API_ENDPOINTS = {
  SEND_JOB_ALERT: `${API_BASE_URL}/send-job-alert`,
  SEND_CONTACT_MESSAGE: `${API_BASE_URL}/send-contact-message`,
  NOTIFY_JOB_POSTED: `${API_BASE_URL}/notify-job-posted`,
};

export default API_BASE_URL; 