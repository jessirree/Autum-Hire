import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert } from 'react-bootstrap';

const PaymentSim: React.FC = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<'free' | 'standard' | 'premium' | null>(null);

  useEffect(() => {
    const selected = sessionStorage.getItem('selectedPlan') as 'free' | 'standard' | 'premium' | null;
    if (!selected || selected === 'free') {
      navigate('/employer-dashboard');
    } else {
      setPlan(selected);
    }
  }, [navigate]);

  const handleSimulatePayment = () => {
    navigate('/job-form');
  };

  if (!plan) return null;

  return (
    <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm p-4" style={{ maxWidth: 400, width: '100%' }}>
        <h3 className="mb-3 text-center">Payment Simulation</h3>
        <Alert variant="info" className="text-center mb-4">
          <strong>Selected Plan:</strong> {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </Alert>
        <ul>
          {plan === 'standard' && (
            <>
              <li>Price: <strong>$75</strong></li>
              <li>Enhanced visibility</li>
              <li>Email notifications to subscribers</li>
              <li>Priority support</li>
            </>
          )}
          {plan === 'premium' && (
            <>
              <li>Price: <strong>$120</strong></li>
              <li>Featured section placement</li>
              <li>Top of search results</li>
              <li>Dedicated support</li>
            </>
          )}
        </ul>
        <Button variant="success" className="w-100 mt-3" onClick={handleSimulatePayment}>
          Simulate Payment
        </Button>
        <Button variant="link" className="w-100 mt-2" onClick={() => navigate('/employer-dashboard')}>
          Cancel
        </Button>
      </Card>
    </Container>
  );
};

export default PaymentSim; 