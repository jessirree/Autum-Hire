import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signUp, db } from '../firebase';
import {
  setDoc,
  doc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import './Auth.css';
import TermsandConditions from './TermsandConditions';

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

const isValidImageUrl = (url: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return imageExtensions.some(ext => lower.endsWith(ext));
};

// List of common free email providers
const freeEmailProviders = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com',
  'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com', 'gmx.com', 'ymail.com',
  'msn.com', 'live.com', 'me.com', 'inbox.com', 'fastmail.com', 'hushmail.com',
  'rocketmail.com', 'rediffmail.com', 'tutanota.com', 'mail.ru', 'qq.com', 'naver.com',
  '163.com', '126.com', 'sina.com', 'yeah.net', 'googlemail.com', 'aim.com', 'lycos.com',
  'seznam.cz', 'zoznam.sk', 'mailinator.com', 'dispostable.com', 'trashmail.com', 'tempmail.com'
];

function isFreeEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase();
  return freeEmailProviders.includes(domain);
}

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [logoUrlError, setLogoUrlError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
      // Block free email providers for both login and signup
      if (isFreeEmail(email)) {
        throw new Error('Please use your organization email address. Free email providers are not allowed.');
      }
      if (!isLogin && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!isLogin && logoUrl && !isValidImageUrl(logoUrl)) {
        throw new Error('Logo URL must end with a valid image extension.');
      }
      if (!isLogin && !acceptedTerms) {
        throw new Error('You must accept the terms and conditions to sign up.');
      }

      if (isLogin) {
        // LOGIN LOGIC (without email verification check)
        await signIn(email, password);
        const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
        const userData = userDoc.docs[0]?.data();
        if (userData?.role === 'admin') {
          navigate('/admin');
        } else {
          const intendedPlan = sessionStorage.getItem('intendedPlan');
          if (intendedPlan) {
            sessionStorage.removeItem('intendedPlan');
            navigate('/post-job');
          } else {
            navigate('/employer-dashboard');
          }
        }
      } else {
        // Check for duplicate email
        const emailQuery = query(collection(db, 'users'), where('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          throw new Error('Email already exists');
        }
        // Check for duplicate company name
        const companyNameQuery = query(collection(db, 'companies'), where('name', '==', companyName));
        const companyNameSnapshot = await getDocs(companyNameQuery);
        if (!companyNameSnapshot.empty) {
          throw new Error('Company already exists');
        }
        // Check for duplicate phone number (if provided)
        if (phoneNumber) {
          const phoneQuery = query(collection(db, 'companies'), where('phoneNumber', '==', phoneNumber));
          const phoneSnapshot = await getDocs(phoneQuery);
          if (!phoneSnapshot.empty) {
            throw new Error('Phone number already exists');
          }
        }

        // SIGNUP LOGIC (without email verification)
        const userCredential = await signUp(email, password);
        const user = userCredential.user;

        const invitesRef = collection(db, "invitations");
        const q = query(invitesRef, where("email", "==", user.email!.toLowerCase()));
        const inviteSnapshot = await getDocs(q);

        if (!inviteSnapshot.empty) {
          const invite = inviteSnapshot.docs[0];
          const companyId = invite.data().companyId;
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            companyId: companyId,
            role: "normal",
            isActive: false,
            createdAt: serverTimestamp(),
          });
          await deleteDoc(invite.ref);
        } else {
          await setDoc(doc(db, "companies", user.uid), {
            name: companyName,
            location,
            website,
            industry,
            logoUrl,
            phoneNumber,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
          });
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            companyId: user.uid,
            role: "super",
            isActive: false,
            createdAt: serverTimestamp(),
          });
        }
        
        // Navigate directly to the dashboard
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
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control type="tel" placeholder="+254 XXX XXX XXX" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
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
                    <Form.Group className="mb-3">
                      <Form.Label>Website</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Website"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                      />
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
                {!isLogin && (
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="terms-checkbox"
                      label={
                        <span>
                          I agree to the{' '}
                          <span
                            className="auth-link"
                            style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={e => { e.preventDefault(); setShowTermsModal(true); }}
                          >
                            terms and conditions
                          </span>
                        </span>
                      }
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      isInvalid={!isLogin && !acceptedTerms}
                    />
                    <Form.Control.Feedback type="invalid">
                      You must accept the terms and conditions to sign up
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
                <Button 
                  type="submit" 
                  className="w-100 mb-3 auth-button" 
                  disabled={loading || !!logoUrlError || (!isLogin && !acceptedTerms)}
                >
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
      {/* Terms and Conditions Modal */}
      <Modal show={showTermsModal} onHide={() => setShowTermsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Terms and Conditions</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <TermsandConditions />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Auth; 