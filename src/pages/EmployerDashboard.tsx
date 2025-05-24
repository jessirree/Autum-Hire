import React, { useEffect, useState } from 'react';
import { Container, Button, Card, Alert, Spinner, Collapse, Row, Col, Badge, Modal, Form } from 'react-bootstrap';
import { getAuth, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  jobType: string;
  deadline?: { seconds: number } | null;
  logoUrl?: string;
  companyLogo?: string;
  experienceLevel?: string;
}

interface UserData {
  subscriptionType: 'free' | 'standard' | 'premium';
  subscriptionDate: string;
  subscriptionEndDate?: string;
  email: string;
}

interface CompanyData {
  name: string;
  industry: string;
  location: string;
  website: string;
  logoUrl: string;
}

const EmployerDashboard: React.FC = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  );
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium'>('free');

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    const fetchCompanyData = async () => {
      try {
        const companyRef = doc(db, 'companies', user.uid);
        const companyDoc = await getDoc(companyRef);
        if (companyDoc.exists()) {
          setCompanyData(companyDoc.data() as CompanyData);
        }
      } catch (err) {
        console.error('Error fetching company data:', err);
      }
    };

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, where('postedBy', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const jobsList: Job[] = [];
        querySnapshot.forEach(docSnap => {
          jobsList.push({ id: docSnap.id, ...docSnap.data() } as Job);
        });
        setJobs(jobsList);
      } catch (err: any) {
        setError('Failed to fetch jobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchCompanyData();
    fetchJobs();
  }, [user]);

  const handleDelete = async (jobId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this job?');
    if (!confirmed) return;

    setDeleting(jobId);
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      setError('Failed to delete job.');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const canSendNotifications = userData?.subscriptionType === 'standard' || userData?.subscriptionType === 'premium';
  const isFeatured = userData?.subscriptionType === 'premium';

  const handleCompanyEdit = () => {
    setEditingCompany(companyData);
    setShowCompanyModal(true);
  };

  const handlePlanEdit = () => {
    setSelectedPlan(userData?.subscriptionType || 'free');
    setShowPlanModal(true);
  };

  const handleCompanySave = async () => {
    if (!user || !editingCompany) return;

    try {
      const companyRef = doc(db, 'companies', user.uid);
      await updateDoc(companyRef, {
        name: editingCompany.name,
        industry: editingCompany.industry,
        location: editingCompany.location,
        website: editingCompany.website,
        logoUrl: editingCompany.logoUrl
      });
      setCompanyData(editingCompany);
      setShowCompanyModal(false);
    } catch (err) {
      setError('Failed to update company details.');
    }
  };

  const handlePlanSave = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const subscriptionEndDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();
      
      await updateDoc(userRef, {
        subscriptionType: selectedPlan,
        subscriptionDate: new Date().toISOString(),
        subscriptionEndDate
      });

      setUserData((prev: UserData | null) => prev ? { 
        ...prev, 
        subscriptionType: selectedPlan, 
        subscriptionDate: new Date().toISOString(),
        subscriptionEndDate
      } : null);

      setShowPlanModal(false);
      setSuccessMessage(`Successfully updated to ${selectedPlan.toUpperCase()} plan!`);
    } catch (err) {
      setError('Failed to update subscription plan.');
    }
  };

  if (!user) {
    return <Container className="py-5"><Alert variant="danger">You must be logged in to view the dashboard.</Alert></Container>;
  }

  return (
    <Container className="py-5">
      <div className="mb-4 align-items-center">
        <h2>Employer Dashboard</h2>
        <div className="text-end">
          <Button variant="secondary" className="me-2" onClick={() => navigate('/job-form')}>Post a New Job</Button>
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}
      
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Company Profile Section */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3} className="text-center">
              <img
                src={companyData?.logoUrl || "/default_logo.png"}
                alt="Company Logo"
                style={{ 
                  width: '150px', 
                  height: '150px', 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}
              />
            </Col>
            <Col md={9}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h3>{companyData?.name || 'Company Name'}</h3>
                  <p className="text-muted mb-2">{companyData?.industry || 'Industry'}</p>
                  <p className="mb-2">
                    <strong>Email:</strong> {userData?.email}
                  </p>
                  {companyData?.location && (
                    <p className="mb-2">
                      <strong>Location:</strong> {companyData.location}
                    </p>
                  )}
                  {companyData?.website && (
                    <p className="mb-2">
                      <strong>Website:</strong> <a href={companyData.website} target="_blank" rel="noopener noreferrer">{companyData.website}</a>
                    </p>
                  )}
                </div>
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                    onClick={handleCompanyEdit}
                  >
                    Edit Company
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={handlePlanEdit}
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <Badge 
                  bg={
                    userData?.subscriptionType === 'premium' ? 'warning' :
                    userData?.subscriptionType === 'standard' ? 'success' : 'secondary'
                  }
                  className="p-2"
                  style={{
                    backgroundColor: userData?.subscriptionType === 'standard' ? 'forestgreen' : undefined
                  }}
                >
                  {userData?.subscriptionType?.toUpperCase() || 'FREE'} PLAN
                </Badge>
                {userData?.subscriptionDate && (
                  <span className="ms-2 text-muted">
                    (Subscribed until: {new Date(userData.subscriptionEndDate || userData.subscriptionDate).toLocaleDateString()})
                  </span>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Company Edit Modal */}
      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Company Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                type="text"
                value={editingCompany?.name || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Industry</Form.Label>
              <Form.Control
                type="text"
                value={editingCompany?.industry || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, industry: e.target.value } : null)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={editingCompany?.location || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, location: e.target.value } : null)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Website</Form.Label>
              <Form.Control
                type="url"
                value={editingCompany?.website || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, website: e.target.value } : null)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Logo URL</Form.Label>
              <Form.Control
                type="url"
                value={editingCompany?.logoUrl || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, logoUrl: e.target.value } : null)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompanyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCompanySave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Plan Change Modal */}
      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Subscription Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Select Monthly Plan</Form.Label>
              <div className="d-flex flex-column gap-2">
                <Form.Check
                  type="radio"
                  id="free"
                  label="Free Plan - Limited to 1 job posting per month"
                  checked={selectedPlan === 'free'}
                  onChange={() => setSelectedPlan('free')}
                />
                <Form.Check
                  type="radio"
                  id="standard"
                  label="Standard Plan - KES 500/month (Up to 5 job postings)"
                  checked={selectedPlan === 'standard'}
                  onChange={() => setSelectedPlan('standard')}
                />
                <Form.Check
                  type="radio"
                  id="premium"
                  label="Premium Plan - KES 999/month (Unlimited job postings)"
                  checked={selectedPlan === 'premium'}
                  onChange={() => setSelectedPlan('premium')}
                />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlanModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePlanSave}>
            Update Plan
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Jobs Section */}
      <h4 className="mb-3">Your Job Listings</h4>
      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : jobs.length === 0 ? (
        <Alert variant="info">You have not posted any jobs yet.</Alert>
      ) : (
        <div>
          {jobs.map(job => (
            <Card className="mb-3 job-listing-card" key={job.id}>
              <div className="d-flex align-items-center p-3">
                <img
                  src={job.companyLogo || "/default_logo.png"}
                  alt="Company Logo"
                  style={{ width: 60, height: 60, objectFit: 'contain', marginRight: 20, borderRadius: 8 }}
                />
                <div style={{ flex: 1 }}>
                  <h5 className="mb-1">
                    {job.title}
                    {isFeatured && <span className="badge bg-warning ms-2">Featured</span>}
                  </h5>
                  <div className="text-muted mb-1">
                    <strong>Type:</strong> {job.jobType} &nbsp;|&nbsp;
                    <strong>Experience:</strong> {job.experienceLevel || 'N/A'} &nbsp;|&nbsp;
                    <strong>Location:</strong> {job.location} &nbsp;|&nbsp;
                    <strong>Salary:</strong> {job.salary}
                  </div>
                  {job.deadline && job.deadline.seconds && (
                    <div className="text-muted mb-1">
                      <strong>Deadline:</strong> {new Date(job.deadline.seconds * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2">
                  {canSendNotifications && (
                    <Button
                      variant="success"
                      size="sm"
                      style={{ backgroundColor: 'forestgreen', borderColor: 'forestgreen' }}
                      onClick={() => {/* Implement notification sending logic */}}
                    >
                      Notify Subscribers
                    </Button>
                  )}
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                  >
                    {expandedJobId === job.id ? 'Hide' : 'View More'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    disabled={deleting === job.id}
                  >
                    {deleting === job.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
              <Collapse in={expandedJobId === job.id}>
                <div>
                  <Card.Body>
                    <strong>Description:</strong>
                    <div style={{ whiteSpace: 'pre-line' }}>{job.description}</div>
                  </Card.Body>
                </div>
              </Collapse>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default EmployerDashboard; 