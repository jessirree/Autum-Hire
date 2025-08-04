import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { API_ENDPOINTS } from '../config/api';

interface MpesaPaymentProps {
  show: boolean;
  onHide: () => void;
  plan: 'standard' | 'premium';
  amount: number;
  onPaymentSuccess: () => void;
  jobId?: string;
}

const MpesaPayment: React.FC<MpesaPaymentProps> = ({
  show,
  onHide,
  plan,
  amount,
  onPaymentSuccess,
  jobId
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutRequestID, setCheckoutRequestID] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/mpesa/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
          plan,
          jobId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCheckoutRequestID(data.checkoutRequestID);
        setSuccessMessage('Payment initiated! Please check your phone for M-Pesa prompt.');
        
        // Start polling for payment status
        pollPaymentStatus(data.checkoutRequestID);
      } else {
        setError(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (requestID: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/mpesa/check-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkoutRequestID: requestID
          }),
        });

        const data = await response.json();

        if (data.success && data.status === 'completed') {
          setPaymentStatus('completed');
          setSuccessMessage('Payment completed successfully!');
          onPaymentSuccess();
          onHide();
          return;
        } else if (data.status === 'failed') {
          setPaymentStatus('failed');
          setError('Payment failed. Please try again.');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          setError('Payment timeout. Please check your M-Pesa and try again.');
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        }
      }
    };

    setTimeout(checkStatus, 5000); // Start checking after 5 seconds
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // Format the phone number
    if (value.length <= 3) {
      value = value;
    } else if (value.length <= 6) {
      value = `${value.slice(0, 3)} ${value.slice(3)}`;
    } else if (value.length <= 9) {
      value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
    } else {
      value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 9)} ${value.slice(9)}`;
    }
    
    setPhoneNumber(value);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>M-Pesa Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <h5>Pay with M-Pesa</h5>
          <p className="text-muted">
            {plan === 'standard' ? 'Standard Plan' : 'Premium Plan'} - {formatAmount(amount)}
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-3">
            {successMessage}
          </Alert>
        )}

        {paymentStatus === 'pending' && !checkoutRequestID && (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>M-Pesa Phone Number</Form.Label>
              <Form.Control
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="e.g., 0712 345 678"
                maxLength={13}
                required
              />
              <Form.Text className="text-muted">
                Enter the phone number registered with M-Pesa
              </Form.Text>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                style={{
                  backgroundColor: 'var(--pumpkin-orange)',
                  borderColor: 'var(--pumpkin-orange)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--golden-yellow)';
                    e.currentTarget.style.borderColor = 'var(--golden-yellow)';
                    e.currentTarget.style.color = 'var(--charcoal-gray)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--pumpkin-orange)';
                    e.currentTarget.style.borderColor = 'var(--pumpkin-orange)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Initiating Payment...
                  </>
                ) : (
                  `Pay ${formatAmount(amount)}`
                )}
              </Button>
            </div>
          </Form>
        )}

        {checkoutRequestID && paymentStatus === 'pending' && (
          <div className="text-center">
            <div className="mb-3">
              <Spinner animation="border" role="status" className="me-2" />
              <span>Waiting for payment confirmation...</span>
            </div>
            <Alert variant="info">
              <strong>Please check your phone!</strong><br />
              You should receive an M-Pesa prompt. Enter your PIN to complete the payment.
            </Alert>
            <p className="text-muted small">
              This may take a few moments. Please don't close this window.
            </p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="text-center">
            <Alert variant="danger">
              Payment failed. Please try again.
            </Alert>
            <Button
              onClick={() => {
                setPaymentStatus('pending');
                setCheckoutRequestID('');
                setError('');
                setSuccessMessage('');
              }}
              variant="outline-primary"
            >
              Try Again
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default MpesaPayment; 