import React, { useState, useRef, useEffect } from 'react';
import { Container, Form, Button, Alert, Row, Col, Modal, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, doc, serverTimestamp, getDoc, query, where, getDocs } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import RichTextEditor from '../components/RichTextEditor';
import { API_ENDPOINTS } from '../config/api';

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Hybrid', 'Graduate Trainee'];
const currencies = ['KES', 'USD', 'EUR', 'GBP', 'NGN', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];
const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

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
  const [applicationLink, setApplicationLink] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState(currencies[0]);
  const [jobType, setJobType] = useState(jobTypes[0]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [experienceLevel, setExperienceLevel] = useState(experienceLevels[0]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium'>('free');
  const [locationSuggestions, setLocationSuggestions] = useState<{ place_id: string; display_name: string }[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };
    fetchUserData();
  }, [user]);

  if (!user) {
    return <Container className="py-5"><Alert variant="danger">You must be logged in to post a job.</Alert></Container>;
  }

  // Prevent job posting if account is deactivated by admin
  if (userData && userData.isActive === false) {
    const createdAt = userData.createdAt;
    if (createdAt) {
      const createdDate = new Date(createdAt.seconds * 1000);
      const today = new Date();
      const isToday =
        createdDate.getFullYear() === today.getFullYear() &&
        createdDate.getMonth() === today.getMonth() &&
        createdDate.getDate() === today.getDate();
      if (!isToday) {
        return (
          <Container className="py-5">
            <Alert variant="danger">
              Your account has been deactivated by an admin. You cannot post new jobs. Please contact support for more information.
            </Alert>
          </Container>
        );
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form fields
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Show plan selection modal
    setShowPlanModal(true);
  };

  const handlePlanSelection = async () => {
    setShowPlanModal(false);
    setLoading(true);

    try {
      // Handle payment flow first if not free
      if (selectedPlan !== 'free') {
        // Store form data temporarily
        sessionStorage.setItem('tempJobData', JSON.stringify({
          title,
          description,
          applicationLink,
          location,
          salary,
          salaryCurrency,
          jobType,
          experienceLevel,
          deadline: deadline?.toISOString(),
          plan: selectedPlan,
          industry
        }));
        
        // Navigate to payment simulation
        navigate('/payment-sim');
        return;
      }

      // For free plan, submit directly
      await submitJob();
    } catch (err: any) {
      setError(err.message || 'Failed to process job posting');
      setLoading(false);
    }
  };

  const submitJob = async () => {
    if (!user) {
      throw new Error('You must be logged in to post a job');
    }

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
        applicationLink,
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
        industry,
      });

      const jobId = jobRef.id;

      // Ensure industry exists in industries collection
      if (industry && industry.trim()) {
        const industriesRef = collection(db, 'industries');
        const q = query(industriesRef, where('name', '==', industry.trim()));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(industriesRef, { name: industry.trim(), createdAt: new Date() });
        }
      }

      // Notify subscribers if plan is standard or premium
      if (selectedPlan === 'standard' || selectedPlan === 'premium') {
      try {
        const notifyUrl = `${window.location.origin}`;
        await fetch(API_ENDPOINTS.NOTIFY_JOB_POSTED, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            industry,
            url: notifyUrl,
            plan: selectedPlan,
            jobId
          })
        });
        console.log('Job notification sent successfully');
      } catch (notifyError) {
        console.warn('Failed to send job notifications (backend not available):', notifyError);
        // Don't throw the error - job posting should still succeed
      }
      }

      setSuccess('Job posted successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/employer-dashboard', { 
          state: { 
            message: 'Your job has been posted successfully!' 
          }
        });
      }, 1500);

      setLoading(false);
  };

  const handleLocationAutocomplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    if (value.length > 2) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { 'User-Agent': 'autumhire-job-platform/1.0' } }
        );
        const data = await res.json();
        setLocationSuggestions(data);
        setShowLocationDropdown(true);
      } catch (err) {
        setLocationSuggestions([]);
        setShowLocationDropdown(false);
      }
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  const handleLocationSuggestionClick = (city: { place_id: string; display_name: string }) => {
    setLocation(city.display_name);
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Body>
          <h2 className="text-center mb-4">Post a New Job</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <h5 className="mb-3 mt-2">Company Details</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control value={industry} onChange={e => setIndustry(e.target.value)} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      value={location}
                      required
                      placeholder="city, country"
                      onChange={handleLocationAutocomplete}
                      autoComplete="off"
                    />
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <ul style={{ position: 'absolute', zIndex: 10, background: 'white', width: '100%', border: '1px solid #ccc', maxHeight: 180, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
                        {locationSuggestions.map(city => (
                          <li key={city.place_id} onClick={() => handleLocationSuggestionClick(city)} style={{ padding: '8px', cursor: 'pointer' }}>
                            {city.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control value={website} onChange={e => setWebsite(e.target.value)} />
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
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Enter detailed job description, requirements, and responsibilities..."
                height="250px"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Application Link</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://example.com/apply or your company careers page"
                value={applicationLink}
                onChange={e => setApplicationLink(e.target.value)}
              />
              <Form.Text className="text-muted">
                Optional: Provide a direct link where candidates can apply for this position.
              </Form.Text>
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
                    dateFormat="dd/MM/yy"
                    minDate={new Date()}
                    className="form-control"
                    placeholderText="Select a deadline (DD/MM/YY)"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-center mt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="px-5"
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
                {loading ? 'Posting...' : 'Post Job'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Plan Selection Modal */}
      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Choose Your Job Posting Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="plan-options">
            <div className="mb-3">
              <Form.Check
                type="radio"
                name="plan"
                id="free-plan"
                label={
                  <div>
                    <strong>Free Plan</strong>
                    <div className="text-muted small">
                      • Basic listing for 15 days<br/>
                      • Standard visibility<br/>
                      • No cost
                    </div>
                  </div>
                }
                value="free"
                checked={selectedPlan === 'free'}
                onChange={(e) => setSelectedPlan(e.target.value as 'free')}
              />
            </div>
            
            <div className="mb-3">
              <Form.Check
                type="radio"
                name="plan"
                id="standard-plan"
                label={
                  <div>
                    <strong>Standard Plan - $75</strong>
                    <div className="text-muted small">
                      • Enhanced visibility for 30 days<br/>
                      • Email notifications to subscribers<br/>
                      • Better search ranking
                    </div>
                  </div>
                }
                value="standard"
                checked={selectedPlan === 'standard'}
                onChange={(e) => setSelectedPlan(e.target.value as 'standard')}
              />
            </div>
            
            <div className="mb-3">
              <Form.Check
                type="radio"
                name="plan"
                id="premium-plan"
                label={
                  <div>
                    <strong>Premium Plan - $120</strong>
                    <div className="text-muted small">
                      • Featured listing for 30 days<br/>
                      • Top of search results<br/>
                      • Priority email notifications<br/>
                      • Company logo highlighting
                    </div>
                  </div>
                }
                value="premium"
                checked={selectedPlan === 'premium'}
                onChange={(e) => setSelectedPlan(e.target.value as 'premium')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlanModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePlanSelection} 
            disabled={loading}
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
            {selectedPlan === 'free' ? 'Post Job (Free)' : `Continue to Payment ($${selectedPlan === 'standard' ? '75' : '120'})`}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default JobForm; 