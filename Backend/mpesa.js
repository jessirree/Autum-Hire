import Mpesa from 'mpesa-node';
import { v4 as uuidv4 } from 'uuid';

// Initialize M-Pesa with environment variables
const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox', // 'sandbox' or 'live'
  shortCode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
  initiatorName: process.env.MPESA_INITIATOR_NAME,
  initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
});

// STK Push (Lipa na M-Pesa Online)
export const initiateSTKPush = async (phoneNumber, amount, reference) => {
  try {
    const response = await mpesa.stkPush({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: process.env.MPESA_PASSKEY,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.BACKEND_URL}/api/mpesa/callback`,
      AccountReference: reference,
      TransactionDesc: 'Autumhire Job Posting Payment'
    });

    return {
      success: true,
      data: response,
      checkoutRequestID: response.CheckoutRequestID
    };
  } catch (error) {
    console.error('STK Push Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check STK Push status
export const checkSTKPushStatus = async (checkoutRequestID) => {
  try {
    const response = await mpesa.stkPushQuery({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: process.env.MPESA_PASSKEY,
      Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3),
      CheckoutRequestID: checkoutRequestID
    });

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('STK Push Query Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// C2B (Customer to Business) - for testing
export const registerC2BUrls = async () => {
  try {
    const response = await mpesa.c2bRegister({
      ShortCode: process.env.MPESA_SHORTCODE,
      ResponseType: 'Completed',
      ConfirmationURL: `${process.env.BACKEND_URL}/api/mpesa/confirmation`,
      ValidationURL: `${process.env.BACKEND_URL}/api/mpesa/validation`
    });

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('C2B Registration Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// B2C (Business to Customer) - for refunds
export const initiateB2C = async (phoneNumber, amount, reference) => {
  try {
    const response = await mpesa.b2c({
      InitiatorName: process.env.MPESA_INITIATOR_NAME,
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: phoneNumber,
      Remarks: `Refund for ${reference}`,
      QueueTimeOutURL: `${process.env.BACKEND_URL}/api/mpesa/timeout`,
      ResultURL: `${process.env.BACKEND_URL}/api/mpesa/result`,
      Occasion: reference
    });

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('B2C Error:', error);
    return {
      success: false,
      error: error.message
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