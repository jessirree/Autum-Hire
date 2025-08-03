import React, { useState } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import './PostJob.css';

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium'>('free');

  // If user is already logged in, redirect to job form
  React.useEffect(() => {
    if (user) {
    navigate('/job-form');
    }
  }, [user, navigate]);

  const handlePlanSelection = (plan: 'free' | 'standard' | 'premium') => {
    setSelectedPlan(plan);
    
    // Store selected plan for after login
    if (plan !== 'free') {
      sessionStorage.setItem('intendedPlan', plan);
    }
    
    // Redirect to auth page
    navigate('/auth', { 
      state: { 
        message: plan === 'free' 
          ? 'Please log in to post your free job listing.' 
          : `Please log in to continue with the ${plan} plan.` 
      }
    });
  };

  return (
    <div className="pricing-container">
      <Container className="py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3">Choose Your Job Posting Plan</h1>
          <p className="lead text-muted">
            Get your job in front of the right candidates with our flexible pricing options
          </p>
        </div>

        <Row className="justify-content-center">
          {/* Free Plan */}
          <Col lg={4} md={6} className="mb-4">
          <Card className="pricing-card h-100">
              <Card.Body className="text-center p-4">
                <h3 className="mb-3">Free</h3>
                <div className="mb-4">
                  <span className="price">
                    <span className="currency">USD</span>0
                  </span>
                  <span className="period">/job</span>
              </div>
              <ul className="features-list mb-4">
                <li>Post a job (listed normally)</li>
                <li>Basic job listing</li>
                <li>Standard visibility</li>
                <li>15-day listing duration</li>
              </ul>
              <Button 
                variant="primary" 
                  className="w-100"
                  onClick={() => handlePlanSelection('free')}
              >
                Use Free Plan
              </Button>
            </Card.Body>
          </Card>
        </Col>

          {/* Standard Plan */}
          <Col lg={4} md={6} className="mb-4">
          <Card className="pricing-card featured h-100">
              <div className="popular-badge">Most Popular</div>
              <Card.Body className="text-center p-4">
                <h3 className="mb-3">Standard</h3>
                <div className="mb-4">
                  <span className="price">
                    <span className="currency">USD</span>75
                  </span>
                  <span className="period">/job</span>
              </div>
              <ul className="features-list mb-4">
                <li>All Free features</li>
                <li>Email notifications to subscribers</li>
                <li>Enhanced visibility</li>
                <li>30-day listing duration</li>
                <li>Priority support</li>
              </ul>
              <Button 
                variant="primary" 
                  className="w-100"
                  onClick={() => handlePlanSelection('standard')}
              >
                Use Standard Plan
              </Button>
            </Card.Body>
          </Card>
        </Col>

          {/* Premium Plan */}
          <Col lg={4} md={6} className="mb-4">
          <Card className="pricing-card h-100">
              <Card.Body className="text-center p-4">
                <h3 className="mb-3">Premium</h3>
                <div className="mb-4">
                  <span className="price">
                    <span className="currency">USD</span>120
                  </span>
                  <span className="period">/job</span>
              </div>
              <ul className="features-list mb-4">
                <li>All Standard features</li>
                <li>Featured section placement</li>
                <li>Top of search results</li>
                <li>30-day listing duration</li>
                <li>Dedicated support</li>
              </ul>
              <Button 
                variant="primary" 
                  className="w-100"
                  onClick={() => handlePlanSelection('premium')}
              >
                Use Premium Plan
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

        <div className="text-center mt-5">
          <p className="text-muted">
            Already have an account? <Button variant="link" onClick={() => navigate('/auth')}>Log in here</Button>
          </p>
        </div>
    </Container>
    </div>
  );
};

export default PostJob; 