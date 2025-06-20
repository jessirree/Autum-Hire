import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './PostJob.css';

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handlePlanSelect = (plan: 'free' | 'standard' | 'premium') => {
    // Store selected plan in sessionStorage
    sessionStorage.setItem('selectedPlan', plan);
    navigate('/job-form');
  };

  return (
    <Container className="pricing-container py-5">
      <h2 className="text-center mb-5">Choose Your Job Posting Plan</h2>
      <Row className="justify-content-center g-4">
        {/* Free Tier */}
        <Col md={4}>
          <Card className="pricing-card h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="text-center mb-4">Free</Card.Title>
              <div className="price text-center mb-4">
                <span className="currency">USD</span>
                <span className="amount">0</span>
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
                className="mt-auto"
                onClick={() => handlePlanSelect('free')}
                style={{ 
                  backgroundColor: 'var(--pumpkin-orange)',
                  borderColor: 'var(--pumpkin-orange)'
                }}
              >
                Use Free Plan
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Standard Tier */}
        <Col md={4}>
          <Card className="pricing-card featured h-100">
            <Card.Body className="d-flex flex-column">
              <div className="popular-badge">Most Popular</div>
              <Card.Title className="text-center mb-4">Standard</Card.Title>
              <div className="price text-center mb-4">
                <span className="currency">USD</span>
                <span className="amount">75</span>
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
                className="mt-auto"
                onClick={() => handlePlanSelect('standard')}
                style={{ 
                  backgroundColor: 'var(--pumpkin-orange)',
                  borderColor: 'var(--pumpkin-orange)'
                }}
              >
                Use Standard Plan
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Premium Tier */}
        <Col md={4}>
          <Card className="pricing-card h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="text-center mb-4">Premium</Card.Title>
              <div className="price text-center mb-4">
                <span className="currency">USD</span>
                <span className="amount">120</span>
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
                className="mt-auto"
                onClick={() => handlePlanSelect('premium')}
                style={{ 
                  backgroundColor: 'var(--pumpkin-orange)',
                  borderColor: 'var(--pumpkin-orange)'
                }}
              >
                Use Premium Plan
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PostJob; 