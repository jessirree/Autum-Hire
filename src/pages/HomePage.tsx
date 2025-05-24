// src/pages/HomePage.tsx
import { FaSearch, FaChevronLeft, FaChevronRight, FaBell } from "react-icons/fa";
import JobCard from '../components/JobCard';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Collapse from 'react-bootstrap/Collapse';

export default function HomePage() {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const premiumUserIds = new Set(
        usersSnapshot.docs
          .filter(doc => doc.data().subscriptionType === 'premium')
          .map(doc => doc.id)
      );
      // Fetch jobs
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobs: any[] = [];
      jobsSnapshot.forEach(doc => {
        const job: any = { id: doc.id, ...doc.data() };
        if (premiumUserIds.has(job.postedBy)) {
          jobs.push(job);
        }
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
      {/* Hero Section */}
      <div
        className="d-flex flex-column justify-content-center align-items-center w-100 position-relative"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}bg1.png)`,
          backgroundSize: '100%',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
          height: '70vh',
          width: '100vw',
          overflow: 'hidden'
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">Featured Jobs</h4>
            <button
              className="btn btn-light d-flex align-items-center"
              style={{ gap: 8 }}
              onClick={() => navigate('/subscribe')}
            >
              <FaBell className="me-2" /> Subscribe for Job Alerts
            </button>
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
            {featuredJobs.length === 0 ? (
              <div className="text-muted">No featured jobs available.</div>
            ) : (
              featuredJobs.map((job, index) => (
                <div key={job.id || index} style={{ minWidth: 300, maxWidth: 340 }} className="position-relative">
                  <div className="text-center p-4 shadow-sm rounded h-100" style={{ background: '#eae3d2' }}>
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
                      className="btn login-btn w-100 mt-3"
                      onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    >
                      {expandedJobId === job.id ? 'Hide Details' : 'View Details'}
                    </button>
                    <Collapse in={expandedJobId === job.id}>
                      <div>
                        <div className="mt-3 text-start">
                          <strong>Description:</strong>
                          <div style={{ whiteSpace: 'pre-line' }}>{job.description}</div>
                          {job.website && (
                            <div className="mt-2">
                              <strong>Company Website:</strong> <a href={job.website} target="_blank" rel="noopener noreferrer">{job.website}</a>
                            </div>
                          )}
                          {job.location && (
                            <div className="mt-2">
                              <strong>Location:</strong> {job.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </Collapse>
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

      {/* Footer */}
      <footer className="bg-dark text-white text-center p-4" style={{ width: '100vw' }}>
        <div className="container">
          <div className="mb-3">
            <a href="#" className="text-white me-3"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="text-white me-3"><i className="fab fa-instagram"></i></a>
            <a href="#" className="text-white"><i className="fab fa-linkedin-in"></i></a>
          </div>
          <div className="small">
            <a href="#" className="text-white me-2">Terms and Conditions</a> |
            <a href="#" className="text-white ms-2">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}