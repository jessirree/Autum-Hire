import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './JobListings.css';
import { FaBell, FaMapMarkerAlt, FaClock, FaBriefcase, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { formatFirestoreTimestamp } from '../utils/dateFormatter';

const JobListings: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [searchKeywords, setSearchKeywords] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<{ place_id: string; display_name: string }[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Hybrid', 'Graduate Trainee'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

  useEffect(() => {
    const fetchJobsAndCompanies = async () => {
      setLoading(true);
      try {
        // Fetch jobs
        const jobsRef = collection(db, 'jobs');
        const jobsSnapshot = await getDocs(jobsRef);
        const jobsList: any[] = [];
        jobsSnapshot.forEach(doc => {
          jobsList.push({ id: doc.id, ...doc.data() });
        });
        setJobs(jobsList);

        // Fetch companies
        const companiesRef = collection(db, 'companies');
        const companiesSnapshot = await getDocs(companiesRef);
        const companiesMap: Record<string, any> = {};
        companiesSnapshot.forEach(doc => {
          companiesMap[doc.id] = doc.data();
        });
        setCompanies(companiesMap);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchJobsAndCompanies();
  }, []);

  // Set keywords filter from query param on mount ONLY
  useEffect(() => {
    const keywords = searchParams.get('keywords');
    if (keywords) {
      setSearchKeywords(keywords);
      setFilters((prev: any) => ({ ...prev, keywords }));
    }
  }, [searchParams.get('keywords')]); // Only depend on the actual keywords parameter

  // Cleanup effect for navigation
  useEffect(() => {
    return () => {
      // Cleanup any pending states when component unmounts
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    };
  }, []);

  // Select first job when jobs load or filters change
  useEffect(() => {
    const displayedJobs = applyFilters(jobs);
    if (displayedJobs.length === 0) {
      setSelectedJobId(null);
    }
  }, [jobs, filters]);

  // Location autocomplete
  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev: any) => ({ ...prev, location: value }));
    
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
    setFilters((prev: any) => ({ ...prev, location: city.display_name }));
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
  };

  const handleSearch = () => {
    setFilters((prev: any) => ({ ...prev, keywords: searchKeywords }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchKeywords('');
  };

  // Filtering logic
  const applyFilters = (jobs: any[]) => {
    let filtered = [...jobs];
    
    // Only show jobs with status 'active'
    filtered = filtered.filter(job => job.status === 'active');
    // Sort by job.plan (premium > standard > free), then by most recent
    filtered.sort((a, b) => {
      const aPlan = a.plan || 'free';
      const bPlan = b.plan || 'free';
      const order: Record<string, number> = { premium: 0, standard: 1, free: 2 };
      const subA = order[aPlan as keyof typeof order] !== undefined ? order[aPlan as keyof typeof order] : 3;
      const subB = order[bPlan as keyof typeof order] !== undefined ? order[bPlan as keyof typeof order] : 3;
      if (subA !== subB) return subA - subB;
      const aDate = a.createdAt?.seconds || 0;
      const bDate = b.createdAt?.seconds || 0;
      return bDate - aDate;
    });
    
    // Keywords (search in title and description)
    if (filters.keywords) {
      const kw = filters.keywords.toLowerCase();
      filtered = filtered.filter(job => {
        const company = companies[job.postedBy] || {};
        return (
          (job.title && job.title.toLowerCase().includes(kw)) ||
          (job.description && job.description.toLowerCase().includes(kw)) ||
          (company.name && company.name.toLowerCase().includes(kw)) ||
          (company.industry && company.industry.toLowerCase().includes(kw))
        );
      });
    }

    // Location
    if (filters.location) {
      filtered = filtered.filter(job => job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()));
    }

    // Job Type
    if (filters.jobType) {
      filtered = filtered.filter(job => job.jobType === filters.jobType);
    }

    // Contract Type (same as Job Type)
    if (filters.contractType) {
      filtered = filtered.filter(job => job.jobType === filters.contractType);
    }

    // Experience Level
    if (filters.experienceLevel) {
      filtered = filtered.filter(job => job.experienceLevel === filters.experienceLevel);
    }

    // Organization (company name search)
    if (filters.organization) {
      filtered = filtered.filter(job => job.companyName && job.companyName.toLowerCase().includes(filters.organization.toLowerCase()));
    }

    return filtered;
  };

  const getDaysAgo = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return 'Unknown';
    const jobDate = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - jobDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Day${diffDays !== 1 ? 's' : ''} Ago`;
  };

  // Apply filters
  const displayedJobs = applyFilters(jobs);
  const selectedJob = displayedJobs.find(job => job.id === selectedJobId);
  const selectedCompany = selectedJob ? companies[selectedJob.postedBy] || {} : {};

  // Count active filters for "Clear All" display
  const activeFiltersCount = Object.values(filters).filter(value => value && value !== '').length;

  return (
    <>
      <Helmet>
        <title>Find Jobs | Autumhire</title>
        <meta name="description" content="Browse the latest job listings and career opportunities on Autumhire." />
        <meta property="og:title" content="Find Jobs | Autumhire" />
        <meta property="og:description" content="Browse the latest job listings and career opportunities on Autumhire." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <div style={{ width: '100vw', overflowX: 'hidden', backgroundColor: '#f8f9fa' }}>
        {/* Top Search and Filters Section */}
        <div className="py-4" style={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <div className="container">
            {/* Search Bar */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex align-items-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaSearch className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search for jobs or keywords"
                      value={searchKeywords}
                      onChange={(e) => setSearchKeywords(e.target.value)}
                      onKeyPress={handleKeyPress}
                      style={{ fontSize: '16px', padding: '12px' }}
                    />
                    <button 
                      className="btn"
                      onClick={handleSearch}
                      style={{
                        backgroundColor: 'var(--pumpkin-orange)',
                        borderColor: 'var(--pumpkin-orange)',
                        color: 'white',
                        fontWeight: '600',
                        padding: '12px 24px'
                      }}
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="row">
              <div className="col-12">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-3 flex-wrap">
                  {/* Location */}
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control filter-dropdown"
                      placeholder="Location"
                      value={filters.location || ''}
                      onChange={handleLocationChange}
                      style={{ minWidth: '140px', width: '140px', fontSize: '14px', padding: '8px 12px' }}
                    />
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <ul className="suggestions-dropdown position-absolute w-100 bg-white border shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto', top: '100%', left: 0 }}>
                        {locationSuggestions.map(city => (
                          <li 
                            key={city.place_id} 
                            className="p-2 cursor-pointer border-bottom"
                            onClick={() => handleLocationSuggestionClick(city)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            {city.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Job Type */}
                  <select 
                    className="form-select filter-dropdown"
                    value={filters.jobType || ''}
                    onChange={(e) => setFilters((prev: any) => ({ ...prev, jobType: e.target.value }))}
                    style={{ minWidth: '120px', width: '120px', fontSize: '14px', padding: '8px 12px' }}
                  >
                    <option value="">Job Type</option>
                    {jobTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                 
                  {/* Experience Level */}
                  <select 
                    className="form-select filter-dropdown"
                    value={filters.experienceLevel || ''}
                    onChange={(e) => setFilters((prev: any) => ({ ...prev, experienceLevel: e.target.value }))}
                    style={{ minWidth: '140px', width: '140px', fontSize: '14px', padding: '8px 12px' }}
                  >
                    <option value="">Experience Level</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>

                  {/* Organization */}
                  <input
                    type="text"
                    className="form-control filter-dropdown"
                    placeholder="Organization"
                    value={filters.organization || ''}
                    onChange={(e) => setFilters((prev: any) => ({ ...prev, organization: e.target.value }))}
                    style={{ minWidth: '140px', width: '140px', fontSize: '14px', padding: '8px 12px' }}
                  />
                </div>

                {/* Active Filters and Clear - More Compact */}
                {activeFiltersCount > 0 && (
                  <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-2">
                    {filters.location && (
                      <span className="badge bg-light text-dark border d-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        {filters.location}
                        <button 
                          className="btn-close btn-close-sm ms-1"
                          onClick={() => setFilters((prev: any) => ({ ...prev, location: '' }))}
                          style={{ fontSize: '8px' }}
                        ></button>
                      </span>
                    )}
                    {filters.jobType && (
                      <span className="badge bg-light text-dark border d-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        {filters.jobType}
                        <button 
                          className="btn-close btn-close-sm ms-1"
                          onClick={() => setFilters((prev: any) => ({ ...prev, jobType: '' }))}
                          style={{ fontSize: '8px' }}
                        ></button>
                      </span>
                    )}
                    {filters.contractType && (
                      <span className="badge bg-light text-dark border d-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        {filters.contractType}
                        <button 
                          className="btn-close btn-close-sm ms-1"
                          onClick={() => setFilters((prev: any) => ({ ...prev, contractType: '' }))}
                          style={{ fontSize: '8px' }}
                        ></button>
                      </span>
                    )}
                    {filters.experienceLevel && (
                      <span className="badge bg-light text-dark border d-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        {filters.experienceLevel}
                        <button 
                          className="btn-close btn-close-sm ms-1"
                          onClick={() => setFilters((prev: any) => ({ ...prev, experienceLevel: '' }))}
                          style={{ fontSize: '8px' }}
                        ></button>
                      </span>
                    )}
                    {filters.organization && (
                      <span className="badge bg-light text-dark border d-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        {filters.organization}
                        <button 
                          className="btn-close btn-close-sm ms-1"
                          onClick={() => setFilters((prev: any) => ({ ...prev, organization: '' }))}
                          style={{ fontSize: '8px' }}
                        ></button>
                      </span>
                    )}
                    <button 
                      className="btn btn-link text-primary p-0"
                      onClick={clearFilters}
                      style={{ fontSize: '12px', textDecoration: 'underline' }}
                    >
                      Clear All ({activeFiltersCount})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-fluid py-4">
          <div className="container">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">{displayedJobs.length} JOBS FOUND</h5>
                  <button
                    className="btn btn-outline-success d-flex align-items-center"
                    style={{ gap: 8 }}
                    onClick={() => navigate('/subscribe')}
                  >
                    <FaBell className="me-2" /> Subscribe for Job Alerts
                  </button>
              </div>

            {/* Conditional Layout */}
            {selectedJob ? (
              <div className="row">
                {/* Job List Sidebar */}
                <div className="col-lg-5 col-md-6">
                  <div className="job-list-sidebar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {loading ? (
                      <div className="text-center p-4">Loading jobs...</div>
                ) : displayedJobs.length === 0 ? (
                      <div className="text-center p-4">No jobs available.</div>
                    ) : (
                      displayedJobs.map((job, index) => (
                        <div
                          key={job.id || index}
                          className={`job-card-sidebar p-3 mb-2 cursor-pointer ${selectedJobId === job.id ? 'selected' : ''}`}
                          onClick={() => setSelectedJobId(job.id)}
                          style={{
                            border: selectedJobId === job.id ? '2px solid var(--pumpkin-orange)' : '1px solid #ddd',
                            backgroundColor: selectedJobId === job.id ? '#fff5f3' : 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            minHeight: '110px'
                          }}
                        >
                          <div className="d-flex align-items-center" style={{ minHeight: '90px' }}>
                          <img
                            src={job.companyLogo || '/default_logo.png'}
                            alt="Company Logo"
                              style={{
                                width: 70,
                                height: 70,
                                objectFit: 'contain',
                                marginRight: 24,
                                borderRadius: 10,
                                flexShrink: 0,
                                alignSelf: 'center'
                              }}
                            />
                            <div className="flex-grow-1">
                              <h6
                                className="job-title-link mb-1"
                                style={{
                                  color: 'var(--pumpkin-orange)',
                                  textDecoration: 'underline',
                                  fontWeight: '600',
                                  margin: 0
                                }}
                              >
                                {job.title}
                              </h6>
                              <div className="mb-2" style={{ fontSize: '15px', fontWeight: 500 }}>
                                {job.companyName}
                              </div>
                              <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14px' }}>
                                <FaMapMarkerAlt className="me-2" style={{ fontSize: '12px' }} />
                                <span>{job.location}</span>
                              </div>
                              <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14px' }}>
                                <FaClock className="me-2" style={{ fontSize: '12px' }} />
                                <span>Posted: {formatFirestoreTimestamp(job.createdAt)}</span>
                              </div>
                              {job.deadline && (
                                <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14px' }}>
                                  <FaCalendarAlt className="me-2" style={{ fontSize: '12px' }} />
                                  <span>Closing Date: {formatFirestoreTimestamp(job.deadline)}</span>
                                </div>
                              )}
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {/* Optionally keep the posted date here if needed */}
                              </div>
                            </div>
                            <div className="d-flex flex-column justify-content-center align-items-end ms-auto" style={{ height: '100%' }}>
                              <div className="d-flex gap-2">
                                {job.applicationLink && (
                                  <a
                                    href={job.applicationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-primary"
                                    style={{ backgroundColor: 'var(--pumpkin-orange)', borderColor: 'var(--pumpkin-orange)', color: 'white' }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Apply
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={e => { e.stopPropagation(); setSelectedJobId(job.id); }}
                                >
                                  View Details
                                </button>
                            </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Job Details Panel */}
                <div className="col-lg-7 col-md-6">
                  <div className="job-details-panel p-4" style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <h4 className="mb-0">{selectedJob.title}</h4>
                          <button
                        className="btn btn-close"
                        onClick={() => setSelectedJobId(null)}
                        style={{ fontSize: '20px' }}
                          >
                        ×
                          </button>
                    </div>

                    {selectedJob.applicationLink && (
                      <a
                        href={selectedJob.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn mb-4"
                        style={{
                          backgroundColor: 'var(--pumpkin-orange)',
                          borderColor: 'var(--pumpkin-orange)',
                          color: 'white',
                          fontWeight: '600',
                          padding: '10px 30px',
                          borderRadius: '25px',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--golden-yellow)';
                          e.currentTarget.style.borderColor = 'var(--golden-yellow)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--pumpkin-orange)';
                          e.currentTarget.style.borderColor = 'var(--pumpkin-orange)';
                        }}
                      >
                        Apply
                      </a>
                    )}

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <FaMapMarkerAlt className="me-2 text-muted" />
                          <span>{selectedJob.location}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <FaBriefcase className="me-2 text-muted" />
                          <span>{selectedJob.jobType}</span>
                        </div>
                      </div>
                            </div>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <FaClock className="me-2 text-muted" />
                          <span>Posted: {formatFirestoreTimestamp(selectedJob.createdAt)}</span>
                              </div>
                              </div>
                      <div className="col-md-6">
                        {selectedJob.deadline && (
                          <div className="d-flex align-items-center mb-3">
                            <FaCalendarAlt className="me-2 text-muted" />
                            <span>End Date: {formatFirestoreTimestamp(selectedJob.deadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedJob.experienceLevel && (
                      <div className="mb-4">
                        <strong>Experience Level:</strong> {selectedJob.experienceLevel}
                      </div>
                    )}

                    {selectedJob.salary && selectedJob.salary.trim() !== '' && /[0-9]/.test(selectedJob.salary) && (
                      <div className="mb-4">
                        <strong>Salary:</strong> {selectedJob.salary}
                      </div>
                    )}

                    <div className="mb-4">
                      <strong>Company:</strong> {selectedJob.companyName}
                    </div>

                    {selectedJob.description && (
                      <div className="mb-4">
                        <h6>Job Description</h6>
                        <div 
                          style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                        />
                      </div>
                    )}

                    {selectedCompany.website && (
                      <div className="mb-4">
                        <strong>Company Website:</strong>{' '}
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">
                          {selectedCompany.website}
                        </a>
                      </div>
                    )}

                    {selectedCompany.industry && (
                      <div className="text-muted border-top pt-3 mt-4" style={{ fontStyle: 'italic' }}>
                        {selectedCompany.industry}
                      </div>
                )}
              </div>
            </div>
          </div>
            ) : (
              <div className="row">
                <div className="col-12">
                  <div className="job-list-sidebar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {loading ? (
                      <div className="text-center p-4">Loading jobs...</div>
                  ) : displayedJobs.length === 0 ? (
                      <div className="text-center p-4">No jobs available.</div>
                    ) : (
                      displayedJobs.map((job, index) => (
                        <div
                          key={job.id || index}
                          className={`job-card-sidebar p-3 mb-2 cursor-pointer ${selectedJobId === job.id ? 'selected' : ''}`}
                          onClick={() => setSelectedJobId(job.id)}
                          style={{
                            border: selectedJobId === job.id ? '2px solid var(--pumpkin-orange)' : '1px solid #ddd',
                            backgroundColor: selectedJobId === job.id ? '#fff5f3' : 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            minHeight: '110px'
                          }}
                        >
                          <div className="d-flex align-items-center" style={{ minHeight: '90px' }}>
                            <img
                              src={job.companyLogo || '/default_logo.png'}
                              alt="Company Logo"
                              style={{
                                width: 70,
                                height: 70,
                                objectFit: 'contain',
                                marginRight: 24,
                                borderRadius: 10,
                                flexShrink: 0,
                                alignSelf: 'center'
                              }}
                            />
                            <div className="flex-grow-1">
                              <h6
                                className="job-title-link mb-1"
                                style={{
                                  color: 'var(--pumpkin-orange)',
                                  textDecoration: 'underline',
                                  fontWeight: '600',
                                  margin: 0
                                }}
                              >
                                {job.title}
                              </h6>
                              <div className="mb-2" style={{ fontSize: '15px', fontWeight: 500 }}>
                                {job.companyName}
                              </div>
                              <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14px' }}>
                                <FaMapMarkerAlt className="me-2" style={{ fontSize: '12px' }} />
                                <span>{job.location}</span>
                              </div>
                              <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14px' }}>
                                <FaClock className="me-2" style={{ fontSize: '12px' }} />
                                <span>Posted: {formatFirestoreTimestamp(job.createdAt)}</span>
                              </div>
                              {job.deadline && (
                                <div className="d-flex align-items-center mb-2 text-muted" style={{ fontSize: '14px' }}>
                                  <FaCalendarAlt className="me-2" style={{ fontSize: '12px' }} />
                                  <span>Closing Date: {formatFirestoreTimestamp(job.deadline)}</span>
                                </div>
                              )}
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {/* Optionally keep the posted date here if needed */}
                              </div>
                            </div>
                            <div className="d-flex flex-column justify-content-center align-items-end ms-auto" style={{ height: '100%' }}>
                              <div className="d-flex gap-2">
                                {job.applicationLink && (
                                  <a
                                    href={job.applicationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-primary"
                                    style={{ backgroundColor: 'var(--pumpkin-orange)', borderColor: 'var(--pumpkin-orange)', color: 'white' }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Apply
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={e => { e.stopPropagation(); setSelectedJobId(job.id); }}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
    </>
  );
};

export default JobListings;
