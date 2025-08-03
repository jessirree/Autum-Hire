// src/pages/HomePage.tsx
import { FaSearch, FaChevronLeft, FaChevronRight, FaBell } from "react-icons/fa";
import { Modal, Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      // Fetch jobs
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobs: any[] = [];
      jobsSnapshot.forEach(doc => {
        const job: any = { id: doc.id, ...doc.data() };
          jobs.push(job);
      });
      setFeaturedJobs(jobs);
    };
    fetchFeaturedJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs?keywords=${encodeURIComponent(keywords)}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // px
      if (direction === 'left') {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div style={{ width: '100vw', overflowX: 'hidden' }}>
      <Helmet>
        <title>Autumhire - Find Your Next Job</title>
        <meta name="description" content="Browse the latest job listings on Autumhire and find your next opportunity." />
      </Helmet>
      {/* Hero Section */}
      <div
        className="hero-section d-flex flex-column justify-content-center align-items-center position-relative"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}bg1.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '75vh',
          width: '100%',
          padding: 0,
          margin: 0,
          border: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Force placeholder color to white with inline style tag */}
        <style>{`
          .hero-section .form-control::placeholder,
          .hero-section .form-control::-webkit-input-placeholder,
          .hero-section .form-control::-moz-placeholder,
          .hero-section .form-control:-ms-input-placeholder,
          .hero-section .form-control::-ms-input-placeholder {
            color: #fff !important;
            opacity: 1 !important;
          }
        `}</style>
        {/* Black overlay with 30% opacity */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1
        }} />
        <div className="container text-center" style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="fw-bold mb-4" style={{ fontSize: '3rem', color: '#eae3d2' }}>FIND A JOB</h2>
          <form className="row justify-content-center g-3" onSubmit={handleSearch}>
            <div className="col-sm-6">
              <div className="input-group">
                <span className="input-group-text" style={{ color: '#fff', background: 'transparent', border: '1px solid #fff' }}><FaSearch /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Keywords"
                  style={{ color: '#222', background: 'rgba(234,227,210,0.6)', border: '1px solid #fff' }}
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                />
              </div>
            </div>
            <div className="col-sm-2">
              <button className="btn login-btn fw-bold w-100" type="submit">Search</button>
            </div>
          </form>
        </div>
      </div>

      {/* Featured Jobs */}
      <div style={{ width: '100vw', backgroundColor: '#b3c2a3', position: 'relative' }} className="py-5">
        <div className="container position-relative">
          <div className="d-flex justify-content-end mb-4">
            <button
              className="btn btn-light d-flex align-items-center"
              style={{ gap: 8 }}
              onClick={() => navigate('/subscribe')}
            >
              <FaBell className="me-2" /> Subscribe for Job Alerts
            </button>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">Featured Jobs</h4>
          </div>
          <button
            className="btn btn-light position-absolute top-50 start-0 translate-middle-y"
            style={{ zIndex: 2, left: '-20px' }}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <FaChevronLeft />
          </button>
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              gap: '1.5rem',
              padding: '0 2.5rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            className="hide-scrollbar"
          >
            {featuredJobs.filter(job => job.status === 'active').length === 0 ? (
              <div className="text-muted">No featured jobs available.</div>
            ) : (
              featuredJobs.filter(job => job.status === 'active').map((job, index) => (
                <div key={job.id || index} style={{ minWidth: 300, maxWidth: 340 }} className="position-relative">
                  <div className="text-center p-4 shadow-sm rounded h-100" style={{ background: 'white' }}>
                    <img
                      src={job.companyLogo || '/default_logo.png'}
                      alt="Company Logo"
                      style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, marginBottom: 10 }}
                    />
                    <h5 className="fw-bold mb-3">{job.title}</h5>
                    <div className="text-muted">
                      <p className="mb-2">{job.companyName}</p>
                      <p className="mb-2"><i className="fas fa-map-marker-alt me-2"></i>{job.location}</p>
                      <p className="mb-2"><i className="fas fa-money-bill me-2"></i>{job.salary}</p>
                      <p className="mb-0"><i className="fas fa-briefcase me-2"></i>{job.jobType}</p>
                    </div>
                    <button
                      className="btn featured-job-view-details-btn w-100 mt-3"
                      onClick={() => setSelectedJob(job)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            className="btn btn-light position-absolute top-50 end-0 translate-middle-y"
            style={{ zIndex: 2, right: '-20px' }}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Job Details Modal */}
      <Modal show={!!selectedJob} onHide={() => setSelectedJob(null)} centered size="xl" className="wide-modal">
        <Modal.Header>
          <Modal.Title>Job Details</Modal.Title>
          <Button variant="close" aria-label="Close" onClick={() => setSelectedJob(null)} style={{ position: 'absolute', right: 16, top: 16, fontSize: 24, background: 'none', border: 'none' }}>
            &times;
          </Button>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedJob && (
            <div className="row">
              <div className="col-md-8">
                <h5 className="mb-3">{selectedJob.title}</h5>
                <div className="mb-4">
                  <h6>Job Description</h6>
                  <div 
                    style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                  />
                </div>
                {selectedJob.applicationLink && (
                  <div className="mb-4">
                    <a 
                      href={selectedJob.applicationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-lg"
                      style={{ 
                        backgroundColor: 'var(--pumpkin-orange)',
                        borderColor: 'var(--pumpkin-orange)'
                      }}
                    >
                      Apply Now
                    </a>
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="card h-100" style={{ backgroundColor: 'var(--background-alt)', border: 'none' }}>
                  <div className="card-body">
                    <h6 className="card-title mb-3">Job Details</h6>
                    <div className="mb-3">
                      <small className="text-muted">Company</small>
                      <p className="mb-0 fw-bold">{selectedJob.companyName}</p>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Salary</small>
                      <p className="mb-0 fw-bold">{selectedJob.salary}</p>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Job Type</small>
                      <p className="mb-0">{selectedJob.jobType}</p>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Experience Level</small>
                      <p className="mb-0">{selectedJob.experienceLevel}</p>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Location</small>
                      <p className="mb-0">{selectedJob.location}</p>
                    </div>
              {selectedJob.website && (
                      <div className="mb-3">
                        <small className="text-muted">Company Website</small>
                        <p className="mb-0">
                          <a href={selectedJob.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                            Visit Website
                          </a>
                        </p>
                      </div>
              )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Footer */}
      <footer className="bg-dark text-white text-center p-4" style={{ width: '100vw' }}>
        <div className="container">
          <div className="mb-3">
            <a href="#" className="text-white me-3"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="text-white me-3"><i className="fab fa-instagram"></i></a>
            <a href="#" className="text-white"><i className="fab fa-linkedin-in"></i></a>
          </div>
          <div className="small">
            <a href="/terms" className="text-white me-2">Terms and Conditions</a> |
            <a href="/contact" className="text-white ms-2">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;