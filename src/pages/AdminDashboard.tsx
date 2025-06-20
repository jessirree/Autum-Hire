import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Alert, Spinner, Modal, Form, Card, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

interface Employer {
  id: string;
  email: string;
  companyName: string;
  industry: string;
  location: string;
  subscriptionType: string;
  isActive: boolean;
  createdAt: any;
  phoneNumber?: string;
}

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [jobAction, setJobAction] = useState<'deactivate' | 'reactivate' | null>(null);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [jobDetail, setJobDetail] = useState<any | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<'employers' | 'jobs'>('employers');
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({});
  const [showNewUsersModal, setShowNewUsersModal] = useState(false);
  const [newUsers, setNewUsers] = useState<Employer[]>([]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!currentUser) {
        navigate('/auth');
        return;
      }

      try {
        const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', currentUser.email)));
        const userData = userDoc.docs[0]?.data();
        
        if (!userData || userData.role !== 'admin') {
          navigate('/');
          return;
        }

        fetchEmployers();
        fetchJobs();
      } catch (err) {
        setError('Error checking admin access');
      }
    };

    checkAdminAccess();
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchUserEmails = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const map: Record<string, string> = {};
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        map[doc.id] = data.email;
      });
      setUserEmailMap(map);
    };
    fetchUserEmails();
  }, []);

  const fetchEmployers = async () => {
    try {
      const employersQuery = query(collection(db, 'users'), where('role', '==', 'employer'));
      const employersSnapshot = await getDocs(employersQuery);
      const employersList: Employer[] = [];

      for (const docSnap of employersSnapshot.docs) {
        const userData = docSnap.data();
        // Fetch company by employer UID (docSnap.id)
        const companyRef = doc(db, 'companies', docSnap.id);
        const companySnap = await getDoc(companyRef);
        const companyData = companySnap.exists() ? companySnap.data() : {};
        employersList.push({
          id: docSnap.id,
          email: userData.email,
          companyName: companyData?.name || 'N/A',
          industry: companyData?.industry || 'N/A',
          location: companyData?.location || 'N/A',
          subscriptionType: userData.subscriptionType,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          phoneNumber: companyData?.phoneNumber || '',
        });
      }

      setEmployers(employersList);
    } catch (err) {
      setError('Failed to fetch employers');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      setJobs(jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError('Failed to fetch jobs');
    }
  };

  const handleToggleStatus = async (employer: Employer) => {
    setSelectedEmployer(employer);
    setShowConfirmModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedEmployer) return;

    try {
      const userRef = doc(db, 'users', selectedEmployer.id);
      await updateDoc(userRef, {
        isActive: !selectedEmployer.isActive
      });

      // If deactivating employer, also deactivate all their jobs
      if (selectedEmployer.isActive) { // isActive BEFORE toggle means we are deactivating
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, where('postedBy', '==', selectedEmployer.id));
        const jobsSnapshot = await getDocs(jobsQuery);
        const batch = (await import('firebase/firestore')).writeBatch(db);
        jobsSnapshot.forEach(jobDoc => {
          batch.update(jobDoc.ref, { status: 'inactive' });
        });
        await batch.commit();
      }

      setEmployers(employers.map(emp => 
        emp.id === selectedEmployer.id 
          ? { ...emp, isActive: !emp.isActive }
          : emp
      ));

      setSuccess(`Employer ${selectedEmployer.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      setError('Failed to update employer status');
    } finally {
      setShowConfirmModal(false);
      setSelectedEmployer(null);
    }
  };

  const handleJobAction = (job: any) => {
    setSelectedJob(job);
    setJobAction(job.status === 'active' ? 'deactivate' : 'reactivate');
    setShowJobModal(true);
  };

  const confirmJobAction = async () => {
    if (!selectedJob || !jobAction) return;
    try {
      if (jobAction === 'deactivate') {
        await updateDoc(doc(db, 'jobs', selectedJob.id), { status: 'inactive' });
        setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, status: 'inactive' } : j));
        setSuccess('Job deactivated successfully');
      } else if (jobAction === 'reactivate') {
        await updateDoc(doc(db, 'jobs', selectedJob.id), { status: 'active' });
        setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, status: 'active' } : j));
        setSuccess('Job reactivated successfully');
      }
    } catch (err) {
      setError('Failed to update job');
    } finally {
      setShowJobModal(false);
      setSelectedJob(null);
      setJobAction(null);
    }
  };

  const handleViewJob = (job: any) => {
    setJobDetail(job);
    setShowJobDetailModal(true);
  };

  const filteredEmployers = employers.filter(employer => 
    employer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch new (inactive) users
  const fetchNewUsers = async () => {
    try {
      const newUsersQuery = query(collection(db, 'users'), where('role', '==', 'employer'), where('isActive', '==', false));
      const newUsersSnapshot = await getDocs(newUsersQuery);
      const newUsersList: Employer[] = [];
      for (const docSnap of newUsersSnapshot.docs) {
        const userData = docSnap.data();
        const companyRef = doc(db, 'companies', docSnap.id);
        const companySnap = await getDoc(companyRef);
        const companyData = companySnap.exists() ? companySnap.data() : {};
        newUsersList.push({
          id: docSnap.id,
          email: userData.email,
          companyName: companyData?.name || 'N/A',
          industry: companyData?.industry || 'N/A',
          location: companyData?.location || 'N/A',
          subscriptionType: userData.subscriptionType,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          phoneNumber: companyData?.phoneNumber || '',
        });
      }
      setNewUsers(newUsersList);
    } catch (err) {
      setError('Failed to fetch new users');
    }
  };

  useEffect(() => {
    fetchNewUsers();
  }, []);

  // Activate new user
  const handleActivateUser = async (user: Employer) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { isActive: true });
      setNewUsers(newUsers.filter(u => u.id !== user.id));
      // Optionally, refresh employers list
      fetchEmployers();
      setSuccess(`${user.companyName} activated successfully!`);
    } catch (err) {
      setError('Failed to activate user');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <div className="admin-bg-gradient min-vh-100 py-5">
      <Container className="admin-centered-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="admin-title mb-0">Admin Dashboard</h1>
          <Button variant="outline-primary" onClick={() => setShowNewUsersModal(true)}>
            New Users{' '}
            {newUsers.length > 0 && (
              <Badge bg="danger" pill style={{ fontSize: '0.8em', marginLeft: 4 }}>{newUsers.length}</Badge>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}

        <div className="admin-tab-buttons mb-4 d-flex justify-content-center">
          <Button
            className={`admin-tab-btn wide-btn ${selectedPanel === 'employers' ? 'active-glow' : ''}`}
            onClick={() => setSelectedPanel('employers')}
          >
            Employers ({employers.length})
          </Button>
          <Button
            className={`admin-tab-btn wide-btn ${selectedPanel === 'jobs' ? 'active-glow' : ''}`}
            onClick={() => setSelectedPanel('jobs')}
          >
            Job Listings ({jobs.length})
          </Button>
        </div>

        <Form.Control
          type="text"
          placeholder="Search by email, company name, or industry..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input mb-4"
        />

        <Card className="admin-content-card">
          <Card.Body>
            {selectedPanel === 'employers' ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Industry</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployers.map(employer => (
                      <tr key={employer.id}>
                        <td>{employer.companyName}</td>
                        <td>{employer.email}</td>
                        <td>{employer.phoneNumber || 'N/A'}</td>
                        <td>{employer.industry}</td>
                        <td>{employer.location}</td>
                        <td>
                          <span className={`badge bg-${employer.isActive ? 'success' : 'danger'}`}>
                            {employer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant={employer.isActive ? 'danger' : 'success'}
                            size="sm"
                            onClick={() => handleToggleStatus(employer)}
                          >
                            {employer.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Posted By</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id}>
                        <td>{job.title}</td>
                        <td>{job.companyName}</td>
                        <td>
                          <span className={`badge bg-${job.status === 'active' ? 'success' : 'danger'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>{userEmailMap[job.postedBy] || job.postedBy}</td>
                        <td>
                          {job.deadline && job.deadline.seconds 
                            ? new Date(job.deadline.seconds * 1000).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            className="me-2"
                            onClick={() => handleViewJob(job)}
                          >
                            View
                          </Button>
                          <Button
                            variant={job.status === 'active' ? 'warning' : 'success'}
                            size="sm"
                            onClick={() => handleJobAction(job)}
                          >
                            {job.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Confirmation Modal */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Action</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to {selectedEmployer?.isActive ? 'deactivate' : 'activate'} this employer account?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedEmployer?.isActive ? 'danger' : 'success'} 
              onClick={confirmToggleStatus}
            >
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Job Action Modal */}
        <Modal show={showJobModal} onHide={() => setShowJobModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Action</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {jobAction === 'deactivate' && (
              <>Are you sure you want to deactivate this job?</>
            )}
            {jobAction === 'reactivate' && (
              <>Are you sure you want to reactivate this job?</>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowJobModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmJobAction}>
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Job Detail Modal */}
        <Modal show={showJobDetailModal} onHide={() => setShowJobDetailModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Job Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {jobDetail && (
              <div>
                <h5>{jobDetail.title}</h5>
                <p><strong>Company:</strong> {jobDetail.companyName}</p>
                <p><strong>Description:</strong> {jobDetail.description}</p>
                <p><strong>Salary:</strong> {jobDetail.salary}</p>
                <p><strong>Job Type:</strong> {jobDetail.jobType}</p>
                <p><strong>Experience Level:</strong> {jobDetail.experienceLevel}</p>
                <p><strong>Location:</strong> {jobDetail.location}</p>
                <p><strong>Status:</strong> {jobDetail.status}</p>
                <p><strong>Posted By (UID):</strong> {jobDetail.postedBy}</p>
                <p><strong>Deadline:</strong> {jobDetail.deadline && jobDetail.deadline.seconds ? new Date(jobDetail.deadline.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Created At:</strong> {jobDetail.createdAt && jobDetail.createdAt.seconds ? new Date(jobDetail.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                {jobDetail.companyLogo && (
                  <div className="text-center mt-3">
                    <img src={jobDetail.companyLogo} alt="Company Logo" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowJobDetailModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* New Users Modal */}
        <Modal show={showNewUsersModal} onHide={() => setShowNewUsersModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>New Users Awaiting Activation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {newUsers.length === 0 ? (
              <div>No new users to activate.</div>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Industry</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.companyName}</td>
                      <td>{user.email}</td>
                      <td>{user.phoneNumber || 'N/A'}</td>
                      <td>{user.industry}</td>
                      <td>{user.location}</td>
                      <td>
                        <Button size="sm" variant="success" onClick={() => handleActivateUser(user)}>
                          Activate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNewUsersModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminDashboard; 