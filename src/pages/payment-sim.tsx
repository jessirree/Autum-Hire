import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, doc, serverTimestamp, getDoc, query, where, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import { API_ENDPOINTS } from '../config/api';

const PaymentSim: React.FC = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [plan, setPlan] = useState<'free' | 'standard' | 'premium' | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tempJobData = sessionStorage.getItem('tempJobData');
    if (!tempJobData) {
      navigate('/job-form');
      return;
    }

    const data = JSON.parse(tempJobData);
    setJobData(data);
    setPlan(data.plan);
  }, [navigate]);

  const handleSimulatePayment = async () => {
    if (!user || !jobData) {
      setError('Missing user or job data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get company data
      const companyRef = doc(db, 'companies', user.uid);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        throw new Error('Company profile not found');
      }

      const companyData = companyDoc.data();

      // Parse deadline from stored string
      let deadline = null;
      if (jobData.deadline) {
        deadline = new Date(jobData.deadline);
      }

      // Set deadline based on plan
      let jobDeadline = deadline;
      if (plan === 'free') {
        jobDeadline = dayjs().add(15, 'day').toDate();
      }

      // Create job document with plan info
      const jobRef = await addDoc(collection(db, 'jobs'), {
        title: jobData.title,
        description: jobData.description,
        applicationLink: jobData.applicationLink || '',
        location: jobData.location,
        salary: `${jobData.salaryCurrency} ${jobData.salary}`,
        jobType: jobData.jobType,
        experienceLevel: jobData.experienceLevel,
        deadline: jobDeadline ? { seconds: Math.floor(jobDeadline.getTime() / 1000) } : null,
        postedBy: user.uid,
        companyName: companyData.name,
        companyLogo: companyData.logoUrl || '/default_logo.png',
        createdAt: serverTimestamp(),
        status: 'active',
        plan: plan,
        paymentStatus: 'simulated_paid',
        industry: jobData.industry || companyData.industry,
      });

      const jobId = jobRef.id;

      // Ensure industry exists in industries collection
      const industryToCheck = jobData.industry || companyData.industry;
      if (industryToCheck && industryToCheck.trim()) {
        const industriesRef = collection(db, 'industries');
        const q = query(industriesRef, where('name', '==', industryToCheck.trim()));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(industriesRef, { name: industryToCheck.trim(), createdAt: new Date() });
        }
      }

      // Notify subscribers for paid plans
      if (plan === 'standard' || plan === 'premium') {
        try {
          const notifyUrl = `${window.location.origin}`;
          await fetch(API_ENDPOINTS.NOTIFY_JOB_POSTED, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: jobData.title,
              industry: jobData.industry || companyData.industry,
              url: notifyUrl,
              plan: plan,
              jobId
            })
          });
          console.log('Job notification sent successfully');
        } catch (notifyError) {
          console.warn('Failed to send job notifications (backend not available):', notifyError);
          // Don't throw the error - job posting should still succeed
        }
      }

      // Clear temporary data
      sessionStorage.removeItem('tempJobData');
      
      // Redirect to dashboard with success message
      navigate('/employer-dashboard', { 
        state: { 
          message: `Payment successful! Your ${plan} job posting is now live.` 
        }
      });

    } catch (err: any) {
      console.error('Error submitting job after payment:', err);
      setError(err.message || 'Failed to submit job after payment');
      setLoading(false);
    }
  };

  if (!plan || !jobData) return (
    <Container className="py-5 d-flex justify-content-center">
      <Spinner animation="border" />
    </Container>
  );

  return (
    <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm p-4" style={{ maxWidth: 500, width: '100%' }}>
        <h3 className="mb-3 text-center">Payment Simulation</h3>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Alert variant="info" className="text-center mb-3">
          <strong>Job:</strong> {jobData.title}<br/>
          <strong>Plan:</strong> {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </Alert>

        <div className="mb-4">
          <h5 className="mb-2">Plan Features:</h5>
          <ul className="mb-0">
          {plan === 'standard' && (
            <>
              <li>Price: <strong>$75</strong></li>
                <li>Enhanced visibility for 30 days</li>
              <li>Email notifications to subscribers</li>
                <li>Better search ranking</li>
            </>
          )}
          {plan === 'premium' && (
            <>
              <li>Price: <strong>$120</strong></li>
                <li>Featured listing for 30 days</li>
              <li>Top of search results</li>
                <li>Priority email notifications</li>
                <li>Company logo highlighting</li>
            </>
          )}
        </ul>
        </div>

        <Alert variant="warning" className="text-center small mb-3">
          This is a simulation - no real payment will be processed.
        </Alert>

        <Button 
          variant="success" 
          className="w-100 mt-3" 
          onClick={handleSimulatePayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing Payment...
            </>
          ) : (
            `Simulate Payment ($${plan === 'standard' ? '75' : '120'})`
          )}
        </Button>
        
        <Button 
          variant="outline-secondary" 
          className="w-100 mt-2" 
          onClick={() => {
            sessionStorage.removeItem('tempJobData');
            navigate('/job-form');
          }}
          disabled={loading}
        >
          Back to Job Form
        </Button>
      </Card>
    </Container>
  );
};

export default PaymentSim; 