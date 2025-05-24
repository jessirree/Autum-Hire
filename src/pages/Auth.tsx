import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signUp, db } from '../firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import './Auth.css';

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

const isValidImageUrl = (url: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return imageExtensions.some(ext => lower.endsWith(ext));
};

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUrlError, setLogoUrlError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for intended plan on component mount
  useEffect(() => {
    const intendedPlan = sessionStorage.getItem('intendedPlan');
    if (intendedPlan) {
      setIsLogin(true); // Force login view if there's an intended plan
    }
  }, []);

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLogoUrl(value);
    if (value && !isValidImageUrl(value)) {
      setLogoUrlError('Please enter a valid image URL ending with .jpg, .png, .gif, etc.');
    } else {
      setLogoUrlError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!isLogin && logoUrl && !isValidImageUrl(logoUrl)) {
        throw new Error('Logo URL must end with a valid image extension.');
      }

      if (isLogin) {
        await signIn(email, password);
        // Check for intended plan after successful login
        const intendedPlan = sessionStorage.getItem('intendedPlan');
        if (intendedPlan) {
          sessionStorage.removeItem('intendedPlan'); // Clear the stored plan
          navigate('/post-job'); // Redirect back to pricing page
        } else {
          navigate('/employer-dashboard');
        }
      } else {
        // Sign up user
        const userCredential = await signUp(email, password);
        const user = userCredential.user;
        // Create company doc (companyId = user.uid)
        await setDoc(doc(db, 'companies', user.uid), {
          name: companyName,
          location,
          website,
          industry,
          logoUrl,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
        // Create user doc
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          companyId: user.uid,
          createdAt: serverTimestamp(),
          subscriptionType: 'free',
          subscriptionDate: new Date().toISOString(),
        });
        navigate('/employer-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="auth-container py-5">
      <Row className="justify-content-center">
        <Col xs={12}>
          <Card className="auth-card">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">
                {isLogin ? 'Employer Login' : 'Employer Sign Up'}
              </h2>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <h5 className="mb-3 mt-2">Company Details</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name</Form.Label>
                          <Form.Control type="text" placeholder="Enter your company name" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Industry</Form.Label>
                          <Form.Control type="text" placeholder="Industry" value={industry} onChange={e => setIndustry(e.target.value)} required />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Location</Form.Label>
                          <Form.Control type="text" placeholder="city, country" value={location} onChange={e => setLocation(e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Website</Form.Label>
                          <Form.Control type="text" placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Logo URL</Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={handleLogoUrlChange}
                        isInvalid={!!logoUrlError}
                      />
                      <Form.Control.Feedback type="invalid">
                        {logoUrlError}
                      </Form.Control.Feedback>
                      {logoUrl && !logoUrlError && (
                        <div className="mt-2">
                          <img src={logoUrl} alt="Logo Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 8 }} />
                        </div>
                      )}
                    </Form.Group>
                  </>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Form.Group>
                {!isLogin && (
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </Form.Group>
                )}
                <Button type="submit" className="w-100 mb-3 auth-button" disabled={loading || !!logoUrlError}>
                  {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
                </Button>
                <div className="text-center">
                  <p className="mb-0">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <Link to="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(''); }} className="auth-link">
                      {isLogin ? 'Sign Up' : 'Login'}
                    </Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Auth; 