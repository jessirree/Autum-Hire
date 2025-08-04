import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';

const PaymentSim: React.FC = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Retrieve job data from session storage
    const storedData = sessionStorage.getItem('tempJobData');
    if (storedData) {
      setJobData(JSON.parse(storedData));
    } else {
      navigate('/post-job');
    }
  }, [user, navigate]);

  const handlePaymentSimulation = async () => {
    if (!jobData || !user) return;

    setLoading(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get company data
      const companyRef = doc(db, 'companies', user.uid);
      const companyDoc = await getDoc(companyRef);
      
      if (!companyDoc.exists()) {
        throw new Error('Company profile not found');
      }

      const companyData = companyDoc.data();

      // Set deadline based on plan
      let jobDeadline = jobData.deadline ? new Date(jobData.deadline) : null;
      if (jobData.plan === 'free') {
        jobDeadline = dayjs().add(15, 'day').toDate();
      } else if (jobData.plan === 'standard' || jobData.plan === 'premium') {
        jobDeadline = dayjs().add(30, 'day').toDate();
      }

      // Create job document with plan info
      const jobRef = await addDoc(collection(db, 'jobs'), {
        title: jobData.title,
        description: jobData.description,
        applicationLink: jobData.applicationLink,
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
        plan: jobData.plan,
        paymentStatus: 'paid',
        industry: jobData.industry,
        // Plan-specific features
        features: {
          isFeatured: jobData.plan === 'premium',
          isEnhanced: jobData.plan === 'standard' || jobData.plan === 'premium',
          hasEmailNotifications: jobData.plan === 'standard' || jobData.plan === 'premium',
          hasPrioritySupport: jobData.plan === 'standard' || jobData.plan === 'premium',
          hasTopSearchResults: jobData.plan === 'premium',
          listingDuration: jobData.plan === 'free' ? 15 : 30
        }
      });

      setPaymentStatus('completed');
      
      // Clear session storage
      sessionStorage.removeItem('tempJobData');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/employer-dashboard', { 
          state: { 
            message: 'Your job has been posted successfully after payment!' 
          }
        });
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to process payment and post job');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const getPlanAmount = (plan: 'standard' | 'premium') => {
    return plan === 'standard' ? 7500 : 12000; // Amount in KES
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (!jobData) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Loading payment details...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <Card className="shadow">
            <Card.Header className="text-center">
              <h4>Payment Simulation</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <div className="text-center mb-4">
                <h5>Job Details</h5>
                <p><strong>Title:</strong> {jobData.title}</p>
                <p><strong>Plan:</strong> {jobData.plan === 'standard' ? 'Standard' : 'Premium'}</p>
                <p><strong>Amount:</strong> {formatAmount(getPlanAmount(jobData.plan))}</p>
              </div>

              {paymentStatus === 'pending' && (
                <div className="text-center">
                  <p className="text-muted mb-4">
                    This is a payment simulation. In the real implementation, 
                    this would integrate with M-Pesa for actual payment processing.
                  </p>
                  <Button
                    onClick={handlePaymentSimulation}
                    disabled={loading}
                    size="lg"
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
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Processing Payment...
                      </>
                    ) : (
                      `Simulate Payment (${formatAmount(getPlanAmount(jobData.plan))})`
                    )}
                  </Button>
                </div>
              )}

              {paymentStatus === 'completed' && (
                <Alert variant="success" className="text-center">
                  <h5>Payment Successful!</h5>
                  <p>Your job has been posted successfully.</p>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Redirecting to dashboard...
                </Alert>
              )}

              {paymentStatus === 'failed' && (
                <Alert variant="danger" className="text-center">
                  <h5>Payment Failed</h5>
                  <p>Please try again or contact support.</p>
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setPaymentStatus('pending');
                      setError('');
                    }}
                  >
                    Try Again
                  </Button>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default PaymentSim; 