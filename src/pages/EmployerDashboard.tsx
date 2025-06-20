import React, { useEffect, useState } from 'react';
import { Container, Button, Card, Alert, Spinner, Collapse, Row, Col, Badge, Modal, Form, Table } from 'react-bootstrap';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmployerDashboard.css';

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
  postedBy: string;
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
    } catch (error) {
      setUserManagementError("Failed to send invitation.");
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

  if (!user) {
    return <Container className="py-5"><Alert variant="danger">You must be logged in to view the dashboard.</Alert></Container>;
  }

  return (
    <Container className="py-5">
      <div className="mb-4 align-items-center">
        <h2>Employer Dashboard</h2>
        <div className="text-end">
          <Button 
            variant="secondary" 
            className="me-2" 
            onClick={() => setShowPlanModal(true)}
            disabled={!!userData && (userData as any).isActive === false}
          >
            Post a New Job
          </Button>
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      
      {/* Inactive account message */}
      {userData && (userData as any).isActive === false && (
        <Alert variant="warning" className="mb-4">
          Account is inactive. Waiting for admin to activate. This may take up to 24 hours.
        </Alert>
      )}
      
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
                  {companyData?.phoneNumber && (
                    <p className="mb-2">
                      <strong>Phone:</strong> {companyData.phoneNumber}
                    </p>
                  )}
                </div>
                {isSuperUser && (
                  <div>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={handleCompanyEdit}
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
                  <h5 className="mb-1">
                    {job.title}
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
                    <div style={{ whiteSpace: 'pre-line' }}>{job.description}</div>
                  </Card.Body>
                </div>
              </Collapse>
            </Card>
          ))}
        </div>
      )}

      {/* User Management Section */}
      {isSuperUser && (
        <Card className="mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">User Management</h5>
              <Button
                variant="primary"
                onClick={() => setShowAddUserModal(true)}
                disabled={normalUsersCount >= 5}
              >
                Add User
              </Button>
            </div>
            <hr />
            {normalUsersCount >= 5 && <Alert variant="warning">You have reached the maximum of 5 normal users.</Alert>}
            <Table striped bordered hover size="sm" className="mt-3">
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
          </Card.Body>
        </Card>
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
    </Container>
  );
};

export default EmployerDashboard; 