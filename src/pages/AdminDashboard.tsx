import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Alert, Spinner, Modal, Form, Card, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { formatFirestoreTimestamp, formatDateTimeToDDMMYY } from '../utils/dateFormatter';
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
  const [jobAction, setJobAction] = useState<'deactivate' | 'reactivate' | 'close' | null>(null);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [jobDetail, setJobDetail] = useState<any | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<'employers' | 'jobs' | 'industries'>('employers');
  const [industries, setIndustries] = useState<any[]>([]);
  const [newIndustryName, setNewIndustryName] = useState('');
  const [showAddIndustryModal, setShowAddIndustryModal] = useState(false);
  const [showDeleteIndustryModal, setShowDeleteIndustryModal] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<any | null>(null);
  const [industryLoading, setIndustryLoading] = useState(false);
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
        fetchIndustries();
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
      // Query for users with 'super' or 'normal' roles (not 'employer')
      const superUsersQuery = query(collection(db, 'users'), where('role', '==', 'super'));
      const normalUsersQuery = query(collection(db, 'users'), where('role', '==', 'normal'));
      
      const [superUsersSnapshot, normalUsersSnapshot] = await Promise.all([
        getDocs(superUsersQuery),
        getDocs(normalUsersQuery)
      ]);
      
      const employersList: Employer[] = [];

      // Process super users
      for (const docSnap of superUsersSnapshot.docs) {
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

      // Process normal users
      for (const docSnap of normalUsersSnapshot.docs) {
        const userData = docSnap.data();
        // For normal users, get company data using their companyId
        const companyRef = doc(db, 'companies', userData.companyId);
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

  const fetchIndustries = async () => {
    try {
      console.log('Admin: Fetching industries from Firestore...');
      const industriesSnapshot = await getDocs(collection(db, 'industries'));
      console.log('Admin: Industries snapshot:', industriesSnapshot);
      console.log('Admin: Number of documents:', industriesSnapshot.docs.length);
      
      const industriesData = industriesSnapshot.docs.map(doc => {
        console.log('Admin: Document data:', doc.id, doc.data());
        return { id: doc.id, ...doc.data() };
      });
      
      console.log('Admin: Industries data:', industriesData);
      setIndustries(industriesData);
    } catch (err) {
      console.error('Admin: Error fetching industries:', err);
      setError('Failed to fetch industries');
    }
  };

  const handleAddIndustry = async () => {
    if (!newIndustryName.trim()) {
      setError('Industry name cannot be empty');
      return;
    }

    setIndustryLoading(true);
    try {
      // Debug current user
      console.log('Admin: Current user:', currentUser);
      console.log('Admin: User UID:', currentUser?.uid);
      console.log('Admin: User email:', currentUser?.email);
      
      // Check if user exists in users collection
      if (currentUser) {
        const userQuery = query(collection(db, 'users'), where('email', '==', currentUser.email));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          console.log('Admin: User document ID:', userDoc.id);
          console.log('Admin: User UID from auth:', currentUser.uid);
          console.log('Admin: Document ID matches UID?', userDoc.id === currentUser.uid);
          console.log('Admin: User data from Firestore:', userData);
          console.log('Admin: User role:', userData.role);
          
          // Also try to get user by UID directly (what Firestore rules expect)
          try {
            const userByUidRef = doc(db, 'users', currentUser.uid);
            const userByUidSnap = await getDoc(userByUidRef);
            if (userByUidSnap.exists()) {
              console.log('Admin: User found by UID:', userByUidSnap.data());
            } else {
              console.log('Admin: User NOT found by UID - this is the problem!');
            }
          } catch (err) {
            console.log('Admin: Error getting user by UID:', err);
          }
        } else {
          console.log('Admin: User not found in users collection');
        }
      }
      
      console.log('Admin: Adding industry:', newIndustryName.trim());
      const docRef = await addDoc(collection(db, 'industries'), {
        name: newIndustryName.trim(),
        createdAt: new Date()
      });
      console.log('Admin: Industry added with ID:', docRef.id);
      
      setIndustries([...industries, { id: docRef.id, name: newIndustryName.trim(), createdAt: new Date() }]);
      setNewIndustryName('');
      setShowAddIndustryModal(false);
      setSuccess('Industry added successfully');
    } catch (err) {
      console.error('Admin: Error adding industry:', err);
      setError('Failed to add industry');
    } finally {
      setIndustryLoading(false);
    }
  };

  const handleDeleteIndustry = (industry: any) => {
    setSelectedIndustry(industry);
    setShowDeleteIndustryModal(true);
  };

  const confirmDeleteIndustry = async () => {
    if (!selectedIndustry) return;

    setIndustryLoading(true);
    try {
      console.log('Admin: Deleting industry:', selectedIndustry.id, selectedIndustry.name);
      await deleteDoc(doc(db, 'industries', selectedIndustry.id));
      console.log('Admin: Industry deleted successfully');
      
      setIndustries(industries.filter(ind => ind.id !== selectedIndustry.id));
      setSuccess('Industry deleted successfully');
    } catch (err) {
      console.error('Admin: Error deleting industry:', err);
      setError('Failed to delete industry');
    } finally {
      setIndustryLoading(false);
      setShowDeleteIndustryModal(false);
      setSelectedIndustry(null);
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
          batch.update(jobDoc.ref, { status: 'deactivated_by_admin' });
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


  const handleJobStatusChange = (job: any, action: 'deactivate' | 'reactivate' | 'close') => {
      setSelectedJob(job);
      setJobAction(action);
      setShowJobModal(true);
  };

  const confirmJobAction = async () => {
    if (!selectedJob || !jobAction) return;
    try {
      if (jobAction === 'deactivate') {
        await updateDoc(doc(db, 'jobs', selectedJob.id), { status: 'deactivated_by_admin' });
        setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, status: 'deactivated_by_admin' } : j));
        setSuccess('Job deactivated by admin successfully');
      } else if (jobAction === 'reactivate') {
        await updateDoc(doc(db, 'jobs', selectedJob.id), { status: 'active' });
        setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, status: 'active' } : j));
        setSuccess('Job reactivated successfully');
      } else if (jobAction === 'close') {
          await updateDoc(doc(db, 'jobs', selectedJob.id), { status: 'closed' });
          setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, status: 'closed' } : j));
          setSuccess('Job closed successfully');
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
      // Query for inactive users with 'super' or 'normal' roles (not 'employer')
      const newSuperUsersQuery = query(collection(db, 'users'), where('role', '==', 'super'), where('isActive', '==', false));
      const newNormalUsersQuery = query(collection(db, 'users'), where('role', '==', 'normal'), where('isActive', '==', false));
      
      const [newSuperUsersSnapshot, newNormalUsersSnapshot] = await Promise.all([
        getDocs(newSuperUsersQuery),
        getDocs(newNormalUsersQuery)
      ]);
      
      const newUsersList: Employer[] = [];
      
      // Process new super users
      for (const docSnap of newSuperUsersSnapshot.docs) {
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
      
      // Process new normal users
      for (const docSnap of newNormalUsersSnapshot.docs) {
        const userData = docSnap.data();
        // For normal users, get company data using their companyId
        const companyRef = doc(db, 'companies', userData.companyId);
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
          <Button
            className={`admin-tab-btn wide-btn ${selectedPanel === 'industries' ? 'active-glow' : ''}`}
            onClick={() => setSelectedPanel('industries')}
          >
            Industries ({industries.length})
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
            ) : selectedPanel === 'jobs' ? (
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
                          <span className={`badge bg-${job.status === 'active' ? 'success' : job.status === 'closed' ? 'secondary' : 'danger'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>{userEmailMap[job.postedBy] || job.postedBy}</td>
                        <td>
                          {formatFirestoreTimestamp(job.deadline)}
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
                            className="me-2"
                            onClick={() => handleJobStatusChange(job, job.status === 'active' ? 'deactivate' : 'reactivate')}
                          >
                            {job.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </Button>
                          {job.status === 'active' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleJobStatusChange(job, 'close')}
                            >
                                Close
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Manage Industries</h5>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowAddIndustryModal(true)}
                    disabled={industryLoading}
                  >
                    Add Industry
                  </Button>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Industry Name</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {industries.map(industry => (
                        <tr key={industry.id}>
                          <td>{industry.name}</td>
                          <td>
                            {industry.createdAt && industry.createdAt.seconds 
                              ? formatFirestoreTimestamp(industry.createdAt)
                              : formatDateTimeToDDMMYY(industry.createdAt)}
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteIndustry(industry)}
                              disabled={industryLoading}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
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
            {jobAction === 'close' && (
              <>Are you sure you want to CLOSE this job? This will stop new applications but keep the job visible.</>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowJobModal(false)}>
              Cancel
            </Button>
            <Button variant={jobAction === 'reactivate' ? 'success' : 'danger'} onClick={confirmJobAction}>
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
                <div><strong>Description:</strong></div>
                <div 
                  style={{ whiteSpace: 'pre-line', marginTop: '8px', marginBottom: '16px' }}
                  dangerouslySetInnerHTML={{ __html: jobDetail.description }}
                />
                {jobDetail.applicationLink && (
                  <p><strong>Application Link:</strong> <a href={jobDetail.applicationLink} target="_blank" rel="noopener noreferrer">{jobDetail.applicationLink}</a></p>
                )}
                <p><strong>Salary:</strong> {jobDetail.salary}</p>
                <p><strong>Job Type:</strong> {jobDetail.jobType}</p>
                <p><strong>Experience Level:</strong> {jobDetail.experienceLevel}</p>
                <p><strong>Location:</strong> {jobDetail.location}</p>
                <p><strong>Industry:</strong> {jobDetail.industry}</p>
                <p><strong>Status:</strong> {jobDetail.status}</p>
                <p><strong>Posted By (UID):</strong> {jobDetail.postedBy}</p>
                <p><strong>Deadline:</strong> {formatFirestoreTimestamp(jobDetail.deadline)}</p>
                <p><strong>Created At:</strong> {formatFirestoreTimestamp(jobDetail.createdAt)}</p>
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

        {/* Add Industry Modal */}
        <Modal show={showAddIndustryModal} onHide={() => setShowAddIndustryModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Industry</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Industry Name</Form.Label>
              <Form.Control
                type="text"
                value={newIndustryName}
                onChange={(e) => setNewIndustryName(e.target.value)}
                placeholder="Enter industry name"
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddIndustryModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddIndustry}
              disabled={industryLoading || !newIndustryName.trim()}
            >
              {industryLoading ? 'Adding...' : 'Add Industry'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Industry Modal */}
        <Modal show={showDeleteIndustryModal} onHide={() => setShowDeleteIndustryModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete the industry "{selectedIndustry?.name}"? This action cannot be undone.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteIndustryModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDeleteIndustry}
              disabled={industryLoading}
            >
              {industryLoading ? 'Deleting...' : 'Delete'}
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