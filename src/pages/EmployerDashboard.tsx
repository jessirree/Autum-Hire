import React, { useEffect, useState } from 'react';
import { Container, Button, Card, Alert, Spinner, Collapse, Row, Col, Badge, Modal, Form, Table } from 'react-bootstrap';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatFirestoreTimestamp } from '../utils/dateFormatter';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import RichTextEditor from '../components/RichTextEditor';
import './EmployerDashboard.css';
import { useNotification } from '../contexts/NotificationContext';

interface Job {
  id: string;
  title: string;
  description: string;
  applicationLink?: string;
  location: string;
  salary: string;
  jobType: string;
  deadline?: { seconds: number } | null;
  logoUrl?: string;
  companyLogo?: string;
  experienceLevel?: string;
  postedBy: string;
  industry?: string;
  status?: string; // Added status field
  plan?: 'free' | 'standard' | 'premium';
  features?: {
    isFeatured: boolean;
    isEnhanced: boolean;
    hasEmailNotifications: boolean;
    hasPrioritySupport: boolean;
    hasTopSearchResults: boolean;
    listingDuration: number;
  };
}

interface UserData {
  email: string;
}

interface CompanyData {
  name: string;
  industry: string;
  location: string;
  website: string;
  logoUrl: string;
  phoneNumber?: string;
}

interface CompanyUser {
  id: string;
  email: string;
  role: "super" | "normal";
}

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Hybrid'];
const currencies = ['KES', 'USD', 'EUR', 'GBP', 'NGN', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];
const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

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
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'premium'>('free');
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [userManagementError, setUserManagementError] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<{ place_id: string; display_name: string }[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Job editing state
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editJobData, setEditJobData] = useState({
    title: '',
    description: '',
    applicationLink: '',
    location: '',
    salary: '',
    salaryCurrency: currencies[0],
    jobType: jobTypes[0],
    experienceLevel: experienceLevels[0],
    deadline: null as Date | null,
    industry: ''
  });
  const [editJobError, setEditJobError] = useState('');
  const [editJobLoading, setEditJobLoading] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Show toast when arriving with a success message (e.g., after posting a job)
  useEffect(() => {
    if (successMessage) {
      try { showSuccess(successMessage, 'Success'); } catch {}
      // Clear the navigation state so the message doesn't re-trigger on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
      setSuccessMessage(null);
    }
  }, [successMessage]);

  const fetchCompanyUsers = async (companyId: string) => {
    const usersQuery = query(collection(db, "users"), where("companyId", "==", companyId));
    const usersSnapshot = await getDocs(usersQuery);
    const usersList = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CompanyUser[];
    setCompanyUsers(usersList);
  };

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          setUserData(userData);
          if ((userData as any).role === "super") {
            setIsSuperUser(true);
            fetchCompanyUsers(user.uid);
          }
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
        try { showError('Failed to fetch jobs', 'Error'); } catch {}
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
      try { showSuccess('Job deleted successfully', 'Job Deleted'); } catch {}
    } catch (err) {
      setError('Failed to delete job.');
      try { showError('Failed to delete job', 'Error'); } catch {}
    } finally {
      setDeleting(null);
    }
  };

  const handleCloseJob = async (jobId: string) => {
    const confirmed = window.confirm('Are you sure you want to close this job? It will remain in your list but will be marked as closed.');
    if (!confirmed) return;

    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, { status: 'closed' });
      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, status: 'closed' }
          : job
      ));
      try { showSuccess('Job closed successfully', 'Job Closed'); } catch {}
    } catch (err) {
      console.error('Error closing job:', err);
      try { showError('Failed to close job', 'Error'); } catch {}
    }
  };



  const handleCompanyEdit = () => {
    if (!isSuperUser) return;
    setEditingCompany(companyData);
    setShowCompanyModal(true);
  };

  const handlePlanConfirm = () => {
    sessionStorage.setItem('selectedPlan', selectedPlan);
    setShowPlanModal(false);
    if (selectedPlan === 'free') {
      navigate('/job-form');
    } else {
      navigate('/payment-sim');
    }
  };

  const handlePostNewJob = () => {
    navigate('/job-form');
  };

  const handleAddUser = async () => {
    setUserManagementError("");
    if (companyUsers.filter(u => u.role === "normal").length >= 5) {
      setUserManagementError("You can only add up to 5 normal users.");
      return;
    }

    try {
      const inviteRef = doc(collection(db, "invitations"));
      await setDoc(inviteRef, {
        email: newUserEmail.toLowerCase(),
        companyId: user?.uid,
        createdAt: new Date(),
      });
      setShowAddUserModal(false);
      setNewUserEmail("");
      setSuccessMessage(`Invitation sent to ${newUserEmail}. They need to sign up with this email.`);
      try { showSuccess(`Invitation sent to ${newUserEmail}`, 'Invitation Sent'); } catch {}
    } catch (error) {
      setUserManagementError("Failed to send invitation.");
      try { showError('Failed to send invitation', 'Error'); } catch {}
    }
  };

  const handleRemoveUser = async (userIdToRemove: string) => {
    try {
      await deleteDoc(doc(db, "users", userIdToRemove));
      if (user) {
        await fetchCompanyUsers(user.uid);
      }
    } catch (error) {
      setUserManagementError("Failed to remove user.");
    }
  };

  const normalUsersCount = companyUsers.filter(u => u.role === 'normal').length;

  const handleLocationAutocomplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditingCompany(prev => prev ? { ...prev, location: value } : null);
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
    setEditingCompany(prev => prev ? { ...prev, location: city.display_name } : null);
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    
    // Parse salary to extract currency and amount
    const salaryParts = job.salary.split(' ');
    const currency = salaryParts[0] || currencies[0];
    const amount = salaryParts.slice(1).join(' ') || '';
    
    // Parse deadline
    let deadline = null;
    if (job.deadline && job.deadline.seconds) {
      deadline = new Date(job.deadline.seconds * 1000);
    }
    
    setEditJobData({
      title: job.title,
      description: job.description,
      applicationLink: job.applicationLink || '',
      location: job.location,
      salary: amount,
      salaryCurrency: currency,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel || experienceLevels[0],
      deadline: deadline,
      industry: job.industry || ''
    });
    
    setEditJobError('');
    setShowEditJobModal(true);
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    
    setEditJobLoading(true);
    setEditJobError('');
    
    try {
      const jobRef = doc(db, 'jobs', editingJob.id);
      
      const updateData: any = {
        title: editJobData.title,
        description: editJobData.description,
        applicationLink: editJobData.applicationLink,
        location: editJobData.location,
        salary: `${editJobData.salaryCurrency} ${editJobData.salary}`,
        jobType: editJobData.jobType,
        experienceLevel: editJobData.experienceLevel,
        industry: editJobData.industry
      };
      
      // Handle deadline
      if (editJobData.deadline) {
        updateData.deadline = { seconds: Math.floor(editJobData.deadline.getTime() / 1000) };
      }
      
      await updateDoc(jobRef, updateData);
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === editingJob.id 
          ? { ...job, ...updateData }
          : job
      ));
      
      setShowEditJobModal(false);
      setEditingJob(null);
      setSuccessMessage('Job updated successfully!');
      
    } catch (err) {
      console.error('Error updating job:', err);
      setEditJobError('Failed to update job. Please try again.');
    } finally {
      setEditJobLoading(false);
    }
  };

  if (!user) {
    return <Container className="py-5"><Alert variant="danger">You must be logged in to view the dashboard.</Alert></Container>;
  }

  return (
    <Container className="py-5">
      <div className="mb-4 align-items-center d-flex justify-content-between">
        <h2>Employer Dashboard</h2>
        <div className="d-flex flex-column align-items-end">
          <div className="mb-2">
            <span>Need help? Send an email to{' '}
              <a href="mailto:support@autumhire.com" style={{ color: 'var(--pumpkin-orange)', fontWeight: 600 }}>
                 support@autumhire.com
              </a>
            </span>
          </div>
          <div className="text-end">
            <Button 
              variant="secondary" 
              className="me-2" 
              onClick={handlePostNewJob}
              disabled={!!userData && (userData as any).isActive === false}
            >
              Post a New Job
            </Button>
            {isSuperUser && (
              <Button 
                variant="success" 
                onClick={() => setShowUserManagementModal(true)}
              >
                User Management
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Inactive account message */}
      {userData && (userData as any).isActive === false && (
        <Alert variant="warning" className="mb-4">
          {(() => {
            const createdAt = (userData as any).createdAt;
            if (!createdAt) return "Account is inactive.";
            const createdDate = new Date(createdAt.seconds * 1000);
            const today = new Date();
            const isToday =
              createdDate.getFullYear() === today.getFullYear() &&
              createdDate.getMonth() === today.getMonth() &&
              createdDate.getDate() === today.getDate();
            return isToday
              ? "Account is inactive. Waiting for admin to activate. This may take up to 24 hours."
              : "Your account has been deactivated by an admin. Please contact support for more information.";
          })()}
        </Alert>
      )}
      
      {/* Success banner replaced by bottom-right notifications; keep as fallback if needed */}
      {/* {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )} */}
      
      {/* {error && <Alert variant="danger">{error}</Alert>} */}

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
                  {companyData?.phoneNumber && (
                    <p className="mb-2">
                      <strong>Phone:</strong> {companyData.phoneNumber}
                    </p>
                  )}
                </div>
                {isSuperUser && (
                <div>
                  <Button 
                    size="sm" 
                    className="me-2"
                    onClick={handleCompanyEdit}
                    style={{
                      backgroundColor: 'var(--pumpkin-orange)',
                      borderColor: 'var(--pumpkin-orange)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--golden-yellow)';
                      e.currentTarget.style.borderColor = 'var(--golden-yellow)';
                      e.currentTarget.style.color = 'var(--charcoal-gray)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--pumpkin-orange)';
                      e.currentTarget.style.borderColor = 'var(--pumpkin-orange)';
                      e.currentTarget.style.color = 'white';
                    }}
                  >
                    Edit Company
                  </Button>
              </div>
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
              <div style={{ position: 'relative' }}>
              <Form.Control
                type="text"
                value={editingCompany?.location || ''}
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
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="+254 XXX XXX XXX"
                value={editingCompany?.phoneNumber || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompanyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {/* Implement company save logic */}}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Plan Selection Modal */}
      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select a Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="planSelect">
              <Form.Label>Choose a job posting plan:</Form.Label>
              <Form.Select
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value as 'free' | 'standard' | 'premium')}
              >
                <option value="free">Free - Basic listing, 15 days</option>
                <option value="standard">Standard - $75, Enhanced visibility, 30 days</option>
                <option value="premium">Premium - $120, Featured, Top of search, 30 days</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlanModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handlePlanConfirm}>Continue</Button>
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
                  <h5 className="mb-1 d-flex align-items-center">
                    {job.title}
                    {job.status === 'deactivated_by_admin' ? (
                      <span className="badge bg-danger ms-2">Deactivated by admin</span>
                    ) : job.status === 'closed' ? (
                      <span className="badge bg-secondary ms-2">Closed</span>
                    ) : (
                      <span className="badge bg-success ms-2">Active</span>
                    )}
                  </h5>
                  <div className="text-muted mb-1">
                    <strong>Type:</strong> {job.jobType} &nbsp;|&nbsp;
                    <strong>Experience:</strong> {job.experienceLevel || 'N/A'} &nbsp;|&nbsp;
                    <strong>Location:</strong> {job.location}
                    {job.salary && job.salary.trim() !== '' && /[0-9]/.test(job.salary) && (
                      <> &nbsp;|&nbsp; <strong>Salary:</strong> {job.salary}</>
                    )}
                  </div>
                  {job.deadline && job.deadline.seconds && (
                    <div className="text-muted mb-1">
                      <strong>Deadline:</strong> {formatFirestoreTimestamp(job.deadline)}
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                  >
                    {expandedJobId === job.id ? 'Hide' : 'View More'}
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={() => handleEditJob(job)}
                    disabled={!isSuperUser && job.postedBy !== user?.uid}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleCloseJob(job.id)}
                    disabled={job.status === 'closed' || job.status === 'deactivated_by_admin' || (!isSuperUser && job.postedBy !== user?.uid)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    disabled={deleting === job.id || (!isSuperUser && job.postedBy !== user?.uid)}
                  >
                    {deleting === job.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
              <Collapse in={expandedJobId === job.id}>
                <div>
                  <Card.Body>
                    <strong>Description:</strong>
                    <div 
                      style={{ whiteSpace: 'pre-line' }}
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                    {(job as any).applicationLink && (
                      <div className="mt-3">
                        <strong>Application Link:</strong>{' '}
                        <a href={(job as any).applicationLink} target="_blank" rel="noopener noreferrer">
                          {(job as any).applicationLink}
                        </a>
                      </div>
                    )}
                    {(job as any).industry && (
                      <div className="mt-2">
                        <strong>Industry:</strong> {(job as any).industry}
                      </div>
                    )}
                  </Card.Body>
                </div>
              </Collapse>
            </Card>
          ))}
        </div>
      )}



      {/* Add User Modal */}
      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add a New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>An invitation will be sent. The user must sign up with this exact email to join your company.</p>
          <Form.Control
            type="email"
            placeholder="Enter user's email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
          />
          {userManagementError && <Alert variant="danger" className="mt-3">{userManagementError}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddUser}>Send Invitation</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Job Modal */}
      <Modal show={showEditJobModal} onHide={() => setShowEditJobModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editJobError && <Alert variant="danger">{editJobError}</Alert>}
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editJobData.title}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter job title"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control
                    type="text"
                    value={editJobData.industry}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="Enter industry"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Plan upgrade controls */}
            {editingJob && (
              <div className="mb-3">
                <Form.Label>Upgrade Plan</Form.Label>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    disabled={editingJob.plan === 'standard' || editingJob.plan === 'premium'}
                    onClick={async () => {
                      if (!editingJob) return;
                      try {
                        const jobRef = doc(db, 'jobs', editingJob.id);
                        await updateDoc(jobRef, {
                          plan: 'standard',
                          features: {
                            isFeatured: false,
                            isEnhanced: true,
                            hasEmailNotifications: true,
                            hasPrioritySupport: true,
                            hasTopSearchResults: false,
                            listingDuration: 30
                          }
                        });
                        setJobs(jobs.map(j => j.id === editingJob.id ? { ...j, plan: 'standard', features: { isFeatured: false, isEnhanced: true, hasEmailNotifications: true, hasPrioritySupport: true, hasTopSearchResults: false, listingDuration: 30 } } : j));
                        try { showSuccess('Job upgraded to Standard', 'Plan Updated'); } catch {}
                      } catch (e) {
                        try { showError('Failed to upgrade to Standard', 'Error'); } catch {}
                      }
                    }}
                  >
                    Upgrade to Standard
                  </Button>
                  <Button
                    variant="outline-primary"
                    disabled={editingJob.plan === 'premium'}
                    onClick={async () => {
                      if (!editingJob) return;
                      try {
                        const jobRef = doc(db, 'jobs', editingJob.id);
                        await updateDoc(jobRef, {
                          plan: 'premium',
                          features: {
                            isFeatured: true,
                            isEnhanced: true,
                            hasEmailNotifications: true,
                            hasPrioritySupport: true,
                            hasTopSearchResults: true,
                            listingDuration: 30
                          }
                        });
                        setJobs(jobs.map(j => j.id === editingJob.id ? { ...j, plan: 'premium', features: { isFeatured: true, isEnhanced: true, hasEmailNotifications: true, hasPrioritySupport: true, hasTopSearchResults: true, listingDuration: 30 } } : j));
                        try { showSuccess('Job upgraded to Premium', 'Plan Updated'); } catch {}
                      } catch (e) {
                        try { showError('Failed to upgrade to Premium', 'Error'); } catch {}
                      }
                    }}
                  >
                    Upgrade to Premium
                  </Button>
                </div>
                <div className="small text-muted mt-1">You can only upgrade plans. Downgrading is not allowed.</div>
              </div>
            )}

                         <Form.Group className="mb-3">
               <Form.Label>Job Description *</Form.Label>
               <RichTextEditor
                 value={editJobData.description}
                 onChange={(value) => setEditJobData(prev => ({ ...prev, description: value }))}
                 placeholder="Enter detailed job description, requirements, and responsibilities..."
                 height="250px"
               />
             </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Application Link</Form.Label>
              <Form.Control
                type="url"
                value={editJobData.applicationLink}
                onChange={(e) => setEditJobData(prev => ({ ...prev, applicationLink: e.target.value }))}
                placeholder="https://example.com/apply"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editJobData.location}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter job location"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Type *</Form.Label>
                  <Form.Select 
                    value={editJobData.jobType} 
                    onChange={(e) => setEditJobData(prev => ({ ...prev, jobType: e.target.value }))}
                  >
                    {jobTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select 
                    value={editJobData.salaryCurrency} 
                    onChange={(e) => setEditJobData(prev => ({ ...prev, salaryCurrency: e.target.value }))}
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="text"
                    value={editJobData.salary}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g., 50,000 - 70,000 per year"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Experience Level</Form.Label>
                  <Form.Select 
                    value={editJobData.experienceLevel} 
                    onChange={(e) => setEditJobData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  >
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
                    selected={editJobData.deadline}
                    onChange={(date) => setEditJobData(prev => ({ ...prev, deadline: date }))}
                    dateFormat="dd/MM/yy"
                    minDate={new Date()}
                    className="form-control"
                    placeholderText="Select a deadline (DD/MM/YY)"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowEditJobModal(false)}
            disabled={editJobLoading}
          >
            Cancel
          </Button>
              <Button
                variant="primary"
            onClick={handleUpdateJob}
            disabled={editJobLoading || !editJobData.title || !editJobData.description || !editJobData.location}
          >
            {editJobLoading ? 'Updating...' : 'Update Job'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Management Modal */}
      <Modal 
        show={showUserManagementModal} 
        onHide={() => setShowUserManagementModal(false)} 
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>User Management</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Manage Company Users</h6>
            <Button
              onClick={() => {
                setShowAddUserModal(true);
                setShowUserManagementModal(false);
              }}
                disabled={normalUsersCount >= 5}
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
                Add User
              </Button>
            </div>
            {normalUsersCount >= 5 && <Alert variant="warning">You have reached the maximum of 5 normal users.</Alert>}
          <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>
                      <Badge bg={u.role === 'super' ? 'success' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      {u.role === 'normal' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveUser(u.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserManagementModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EmployerDashboard; 