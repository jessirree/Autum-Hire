import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import admin from 'firebase-admin';
import { 
  initiateSTKPush, 
  checkSTKPushStatus, 
  generateTransactionReference, 
  validatePhoneNumber 
} from './instasend.js';

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "autumhire",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: "googleapis.com"
    })
  });
}
const firestore = admin.firestore();

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from your frontend

// Nodemailer transporter for job alerts
const jobAlertsTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.autumhire.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.JOB_ALERTS_EMAIL || 'jobalerts@autumhire.com',
    pass: process.env.JOB_ALERTS_PASSWORD
  }
});

// Nodemailer transporter for contact form (info@autumhire.com)
const infoTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.autumhire.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.INFO_EMAIL || 'info@autumhire.com',
    pass: process.env.INFO_EMAIL_PASSWORD
  }
});

// In-memory array to store subscribers
const subscribers = [];

app.post('/send-job-alert', async (req, res) => {
  const { email, industries, location } = req.body;
  if (!email || !industries || !Array.isArray(industries) || industries.length === 0) {
    return res.status(400).json({ error: 'Email and at least one industry are required.' });
  }
  try {
    // Save subscriber to Firestore
    await firestore.collection('subscribers').doc(email).set({
      email,
      industries,
      location,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await jobAlertsTransporter.sendMail({
      from: '"Autumhire Job Alerts" <jobalerts@autumhire.com>',
      to: email,
      subject: 'You are subscribed to Autumhire Job Alerts!',
      text: `Hi! You have subscribed to job alerts for industries: ${industries.join(', ')} and location: ${location || "Any"}.`,
      html: `<p>Hi!</p>
             <p>You have subscribed to job alerts for:</p>
             <ul>
               <li><b>Industries:</b> ${industries.join(', ')}</li>
               <li><b>Location:</b> ${location || "Any"}</li>
             </ul>
             <p>Thank you for subscribing!</p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to notify subscribers when a job is posted
app.post('/notify-job-posted', async (req, res) => {
  const { title, industry, url, plan, jobId } = req.body;
  if (!title || !industry || !url || !plan || !jobId) {
    return res.status(400).json({ error: 'Missing job details.' });
  }
  if (plan !== 'standard' && plan !== 'premium') {
    return res.json({ success: false, message: 'No notification sent for free plan.' });
  }
  try {
    // Query Firestore for matching subscribers
    const snapshot = await firestore.collection('subscribers')
      .where('industries', 'array-contains', industry)
      .get();

    let sent = 0;
    for (const doc of snapshot.docs) {
      const sub = doc.data();
      await jobAlertsTransporter.sendMail({
        from: '"Autumhire Job Alerts" <jobalerts@autumhire.com>',
        to: sub.email,
        subject: `New Job Posted: ${title}`,
        text: `A new job in your industry (${industry}) has been posted. View it here: ${url}/jobs/${jobId}`,
        html: `<p>A new job in your industry (<b>${industry}</b>) has been posted.</p><p><a href="${url}/jobs/${jobId}">View Job Listing</a></p>`
      });
      sent++;
    }
    res.json({ success: true, notified: sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New endpoint to handle contact form submissions
app.post('/send-contact-message', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  
  try {
    // Send email to info@autumhire.com
    await infoTransporter.sendMail({
      from: '"Autumhire Contact Form" <info@autumhire.com>',
      to: 'info@autumhire.com',
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Reply to this email to respond directly to the sender.</em></p>
      `,
      replyTo: email
    });
    
    // Send confirmation email to the sender
    await infoTransporter.sendMail({
      from: '"Autumhire Support" <info@autumhire.com>',
      to: email,
      subject: 'Thank you for contacting Autumhire',
      text: `Dear ${name},\n\nThank you for reaching out to us. We have received your message regarding "${subject}" and will get back to you as soon as possible.\n\nBest regards,\nThe Autumhire Team`,
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to us. We have received your message regarding "<strong>${subject}</strong>" and will get back to you as soon as possible.</p>
        <p>Best regards,<br>The Autumhire Team</p>
      `
    });
    
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error sending contact form email:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// M-Pesa Payment Endpoints

// Initiate STK Push payment
app.post('/api/instasend/initiate-payment', async (req, res) => {
  const { phoneNumber, amount, plan, jobId } = req.body;
  
  if (!phoneNumber || !amount || !plan) {
    return res.status(400).json({ error: 'Phone number, amount, and plan are required.' });
  }

  // Validate phone number
  const validatedPhone = validatePhoneNumber(phoneNumber);
  if (!validatedPhone) {
    return res.status(400).json({ error: 'Invalid phone number format. Please use Kenyan format (e.g., 0712345678 or 254712345678).' });
  }

  try {
    const reference = generateTransactionReference();
    
    // Store payment attempt in Firestore
    await firestore.collection('payment_attempts').doc(reference).set({
      phoneNumber: validatedPhone,
      amount: parseInt(amount),
      plan,
      jobId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      checkoutRequestID: null
    });

    // Initiate STK Push
    const stkResponse = await initiateSTKPush(validatedPhone, amount, reference);
    
    if (stkResponse.success) {
      // Update payment attempt with checkout request ID
      await firestore.collection('payment_attempts').doc(reference).update({
        checkoutRequestID: stkResponse.checkoutRequestID
      });

      res.json({
        success: true,
        checkoutRequestID: stkResponse.checkoutRequestID,
        reference,
        message: 'Payment initiated. Please check your phone for M-Pesa prompt.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: stkResponse.error
      });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate payment. Please try again.' });
  }
});

// Check payment status
app.post('/api/instasend/check-status', async (req, res) => {
  const { checkoutRequestID } = req.body;
  
  if (!checkoutRequestID) {
    return res.status(400).json({ error: 'Checkout request ID is required.' });
  }

  try {
    const statusResponse = await checkSTKPushStatus(checkoutRequestID);
    
    if (statusResponse.success) {
      const resultCode = statusResponse.data.ResultCode;
      
      if (resultCode === '0') {
        // Payment successful
        res.json({
          success: true,
          status: 'completed',
          message: 'Payment completed successfully!'
        });
      } else if (resultCode === '1') {
        // Payment failed
        res.json({
          success: false,
          status: 'failed',
          message: 'Payment failed. Please try again.'
        });
      } else {
        // Still pending
        res.json({
          success: false,
          status: 'pending',
          message: 'Payment is still being processed. Please wait.'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: statusResponse.error
      });
    }
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: 'Failed to check payment status.' });
  }
});

// M-Pesa callback endpoint
app.post('/api/instasend/callback', async (req, res) => {
  try {
    const { Body: { stkCallback } } = req.body;
    
    if (stkCallback.ResultCode === '0') {
      // Payment successful
      const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc } = stkCallback;
      
      // Update payment status in Firestore
      const paymentQuery = await firestore.collection('payment_attempts')
        .where('checkoutRequestID', '==', CheckoutRequestID)
        .get();
      
      if (!paymentQuery.empty) {
        const paymentDoc = paymentQuery.docs[0];
        await paymentDoc.ref.update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          mpesaResponse: stkCallback
        });
        
        // Update job payment status if jobId exists
        const paymentData = paymentDoc.data();
        if (paymentData.jobId) {
          await firestore.collection('jobs').doc(paymentData.jobId).update({
            paymentStatus: 'paid',
            paymentReference: paymentDoc.id,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Available endpoints:`);
  console.log(`  - POST /send-job-alert`);
  console.log(`  - POST /send-contact-message`);
  console.log(`  - POST /notify-job-posted`);
  console.log(`  - POST /api/mpesa/initiate-payment`);
  console.log(`  - POST /api/mpesa/check-status`);
  console.log(`  - POST /api/mpesa/callback`);
}); 