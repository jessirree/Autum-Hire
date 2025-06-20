import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
const currencies = ['KES', 'USD', 'EUR', 'GBP', 'NGN', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];
const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level'];

const JobForm: React.FC = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Job fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState(currencies[0]);
  const [jobType, setJobType] = useState(jobTypes[0]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [experienceLevel, setExperienceLevel] = useState(experienceLevels[0]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium' | null>(null);

  useEffect(() => {
    // Auto-fill company details from Firestore
    const fetchCompany = async () => {
      if (!user) return;
      const companyDoc = await getDoc(doc(db, 'companies', user.uid));
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        setCompanyName(data.name || '');
        setLocation(data.location || '');
        setWebsite(data.website || '');
        setIndustry(data.industry || '');
        setLogoUrl(data.logoUrl || '');
      }
    };
    fetchCompany();

    const plan = sessionStorage.getItem('selectedPlan') as 'free' | 'standard' | 'premium' | null;
    if (!plan) {
      navigate('/post-job');
    } else {
      setSelectedPlan(plan);
    }
  }, [user, navigate]);

  if (!user) {
    return <Container className="py-5"><Alert variant="danger">You must be logged in to post a job.</Alert></Container>;
  }

  if (!selectedPlan) {
    return null; // Or a loading spinner
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!user) {
      setError('You must be logged in to post a job');
      setLoading(false);
      return;
    }

    try {
      // Get company data
      const companyRef = doc(db, 'companies', user.uid);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        throw new Error('Company profile not found');
      }

      const companyData = companyDoc.data();

      // Set deadline based on plan
      let jobDeadline = deadline;
      if (selectedPlan === 'free') {
        jobDeadline = dayjs().add(15, 'day').toDate();
      }

      // Create job document with plan info
      const jobRef = await addDoc(collection(db, 'jobs'), {
        title,
        description,
        location,
        salary: `${salaryCurrency} ${salary}`,
        jobType,
        experienceLevel,
        deadline: jobDeadline ? { seconds: Math.floor(jobDeadline.getTime() / 1000) } : null,
        postedBy: user.uid,
        companyName: companyData.name,
        companyLogo: companyData.logoUrl || '/default_logo.png',
        createdAt: serverTimestamp(),
        status: 'active',
        plan: selectedPlan,
        paymentStatus: selectedPlan === 'free' ? 'not_required' : 'simulated_paid',
      });

      setSuccess('Job posted successfully!');
      sessionStorage.removeItem('selectedPlan');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/employer-dashboard', { 
          state: { 
            message: 'Your job has been posted successfully!' 
          }
        });
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Body>
          <h2 className="text-center mb-4">Post a New Job</h2>
          <Alert variant="info" className="mb-4 text-center">
            <strong>Selected Plan:</strong> {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
          </Alert>
          {selectedPlan !== 'free' && (
            <Alert variant="warning" className="mb-4 text-center">
              <strong>Payment Simulation:</strong> This is a simulated payment for the {selectedPlan} plan. (No real payment required.)
            </Alert>
          )}
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <h5 className="mb-3 mt-2">Company Details</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control value={companyName} readOnly required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control value={industry} readOnly required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control value={location}  required placeholder="city, country" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control value={website} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Logo URL</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
              />
              {logoUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(logoUrl) && (
                <div className="mt-2">
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    style={{ maxWidth: 100, maxHeight: 100, borderRadius: 8 }}
                  />
                </div>
              )}
            </Form.Group>
            <hr />
            <h5 className="mb-3 mt-2">Job Details</h5>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control value={title} onChange={e => setTitle(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)} required />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary</Form.Label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Form.Select
                      value={salaryCurrency}
                      onChange={e => setSalaryCurrency(e.target.value)}
                      required
                      style={{ maxWidth: '100px' }}
                    >
                      {currencies.map(cur => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </Form.Select>
                    <Form.Control
                      type="number"
                      min="0"
                      value={salary}
                      onChange={e => setSalary(e.target.value)}
                      placeholder="Amount"
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Type</Form.Label>
                  <Form.Select value={jobType} onChange={e => setJobType(e.target.value)} required>
                    {jobTypes.map(type => <option key={type}>{type}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Experience Level</Form.Label>
                  <Form.Select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deadline</Form.Label>
                  <DatePicker
                    selected={deadline}
                    onChange={date => setDeadline(date)}
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    className="form-control"
                    placeholderText="Select a deadline"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-center mt-4">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="px-5"
              >
                {loading ? 'Posting...' : 'Post Job'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default JobForm; 