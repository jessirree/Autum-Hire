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

  const handleSubscription = async (plan: 'free' | 'standard' | 'premium') => {
    const user = auth.currentUser;
    
    if (!user) {
      // Store the intended plan in sessionStorage
      sessionStorage.setItem('intendedPlan', plan);
      // Redirect to login
      navigate('/auth');
      return;
    }

    try {
      // Update user's subscription in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: user.email,
          subscriptionType: plan,
          subscriptionDate: new Date().toISOString()
        });
      } else {
        // Update existing user document
        await setDoc(userRef, {
          ...userDoc.data(),
          subscriptionType: plan,
          subscriptionDate: new Date().toISOString()
        }, { merge: true });
      }

      // Redirect to dashboard with success message
      navigate('/employer-dashboard', { 
        state: { 
          message: `You're now subscribed to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan!` 
        }
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      // Handle error appropriately
    }
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
                <span className="period">/month</span>
              </div>
              <ul className="features-list mb-4">
                <li>Post a job (listed normally)</li>
                <li>Basic job listing</li>
                <li>Standard visibility</li>
                <li>30-day listing duration</li>
              </ul>
              <Button 
                variant="primary" 
                className="mt-auto"
                onClick={() => handleSubscription('free')}
                style={{ 
                  backgroundColor: 'var(--pumpkin-orange)',
                  borderColor: 'var(--pumpkin-orange)'
                }}
              >
                Get Started
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
                <span className="period">/month</span>
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
                onClick={() => handleSubscription('standard')}
                style={{ 
                  backgroundColor: 'var(--pumpkin-orange)',
                  borderColor: 'var(--pumpkin-orange)'
                }}
              >
                Get Started
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
                <span className="period">/month</span>
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
                onClick={() => handleSubscription('premium')}
                style={{ 
                  backgroundColor: 'var(--pumpkin-orange)',
                  borderColor: 'var(--pumpkin-orange)'
                }}
              >
                Get Started
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PostJob; 