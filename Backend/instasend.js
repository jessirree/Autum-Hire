import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Instasend API configuration
const INSTASEND_API_URL = 'https://api.instasend.co.ke';
const INSTASEND_API_KEY = process.env.INSTASEND_API_KEY;
const INSTASEND_API_SECRET = process.env.INSTASEND_API_SECRET;

// Initialize axios with Instasend credentials
const instasendClient = axios.create({
  baseURL: INSTASEND_API_URL,
  headers: {
    'Authorization': `Bearer ${INSTASEND_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// STK Push (Lipa na M-Pesa Online)
export const initiateSTKPush = async (phoneNumber, amount, reference) => {
  try {
    const response = await instasendClient.post('/mpesa/stk-push', {
      phone_number: phoneNumber,
      amount: amount,
      reference: reference,
      description: 'Autumhire Job Posting Payment',
      callback_url: `${process.env.BACKEND_URL}/api/instasend/callback`
    });

    return {
      success: true,
      data: response.data,
      checkoutRequestID: response.data.checkout_request_id
    };
  } catch (error) {
    console.error('Instasend STK Push Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Check STK Push status
export const checkSTKPushStatus = async (checkoutRequestID) => {
  try {
    const response = await instasendClient.get(`/mpesa/stk-status/${checkoutRequestID}`);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Instasend STK Status Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// C2B (Customer to Business) - for testing
export const registerC2BUrls = async () => {
  try {
    const response = await instasendClient.post('/mpesa/c2b/register', {
      shortcode: process.env.INSTASEND_SHORTCODE,
      confirmation_url: `${process.env.BACKEND_URL}/api/instasend/confirmation`,
      validation_url: `${process.env.BACKEND_URL}/api/instasend/validation`
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Instasend C2B Registration Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// B2C (Business to Customer) - for refunds
export const initiateB2C = async (phoneNumber, amount, reference) => {
  try {
    const response = await instasendClient.post('/mpesa/b2c', {
      phone_number: phoneNumber,
      amount: amount,
      reference: reference,
      description: `Refund for ${reference}`,
      callback_url: `${process.env.BACKEND_URL}/api/instasend/b2c-callback`
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Instasend B2C Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Generate unique transaction reference
export const generateTransactionReference = () => {
  return `AUTUMHIRE_${Date.now()}_${uuidv4().substring(0, 8)}`;
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Kenyan phone number
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `254${cleaned.substring(1)}`;
  } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return `254${cleaned}`;
  }
  
  return null;
};

// Get account balance
export const getAccountBalance = async () => {
  try {
    const response = await instasendClient.get('/account/balance');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Instasend Balance Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Get transaction history
export const getTransactionHistory = async (limit = 10, offset = 0) => {
  try {
    const response = await instasendClient.get('/transactions', {
      params: { limit, offset }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Instasend Transaction History Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}; 