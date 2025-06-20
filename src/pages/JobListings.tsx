import React, { useEffect, useState } from 'react';
import JobFilter from '../components/JobFilter';
import JobListingCard from '../components/JobListingCard';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Dropdown from 'react-bootstrap/Dropdown';
import { useLocation, useNavigate } from 'react-router-dom';
import './JobListings.css';
import { FaBell } from 'react-icons/fa';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const JobListings: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState<string>('Most Recent');
  const query = useQuery();
  const navigate = useNavigate();

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

  // Set keywords filter from query param on mount
  useEffect(() => {
    const keywords = query.get('keywords');
    if (keywords) {
      setFilters((prev: any) => ({ ...prev, keywords }));
    }
    // eslint-disable-next-line
  }, [query]);

  // Filtering logic
  const applyFilters = (jobs: any[]) => {
    let filtered = [...jobs];
    // Contract type (jobType)
    if (filters.contractType) {
      filtered = filtered.filter(job => job.jobType === filters.contractType);
    }
    // Organization (companyName)
    if (filters.organization) {
      filtered = filtered.filter(job => job.companyName && job.companyName.toLowerCase().includes(filters.organization.toLowerCase()));
    }
    // Experience level
    if (filters.experience) {
      // Map dropdown value to job field value
      let expMap: Record<string, string> = {
        entry: 'Entry Level',
        mid: 'Mid Level',
        senior: 'Senior Level',
      };
      const expValue = expMap[filters.experience] || filters.experience;
      filtered = filtered.filter(job => job.experienceLevel === expValue);
    }
    // Location
    if (filters.location) {
      filtered = filtered.filter(job => job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
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
    // Date posted
    if (filters.datePosted) {
      const now = new Date();
      let minDate = new Date();
      if (filters.datePosted === '24h') {
        minDate.setDate(now.getDate() - 1);
      } else if (filters.datePosted === '7d') {
        minDate.setDate(now.getDate() - 7);
      } else if (filters.datePosted === '30d') {
        minDate.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter(job => {
        if (!job.createdAt || !job.createdAt.seconds) return false;
        const jobDate = new Date(job.createdAt.seconds * 1000);
        return jobDate >= minDate;
      });
    }
    return filtered;
  };

  // Sorting logic
  const applySort = (jobs: any[]) => {
    let sorted = [...jobs];
    if (sortBy === 'Most Recent') {
      // Sort by job.plan (premium > standard > free), then by most recent
      sorted.sort((a, b) => {
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
    } else if (sortBy === 'Company Name') {
      sorted.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
    }
    // Most Relevant can be customized as needed
    return sorted;
  };

  const handleFilter = (filters: any) => {
    setFilters(filters);
  };

  const handleSort = (sort: string | null) => {
    if (!sort) return;
    setSortBy(sort);
  };

  // Apply filters and sort
  const displayedJobs = applySort(applyFilters(jobs));

  return (
    <div style={{ width: '100vw', overflowX: 'hidden' }}>
      <div className="container-fluid py-5">
        <div className="container">
          <div className="row justify-content-center">
            {/* Filter Section */}
            <div className="col-lg-3 col-md-4 mb-4">
              <JobFilter onFilter={handleFilter} />
            </div>

            {/* Job Listings Section */}
            <div className="col-lg-8 col-md-7 ms-md-4">
              <div className="d-flex justify-content-end mb-4">
                  <button
                    className="btn btn-outline-success d-flex align-items-center"
                    style={{ gap: 8 }}
                    onClick={() => navigate('/subscribe')}
                  >
                    <FaBell className="me-2" /> Subscribe for Job Alerts
                  </button>
                </div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Available Positions</h4>
                <Dropdown onSelect={handleSort}>
                  <Dropdown.Toggle variant="outline-secondary" id="sortDropdown">
                    Sort by: {sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="Most Recent">Most Recent</Dropdown.Item>
                    <Dropdown.Item eventKey="Most Relevant">Most Relevant</Dropdown.Item>
                    <Dropdown.Item eventKey="Company Name">Company Name</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Job Cards */}
              <div className="job-cards-container">
                {loading ? (
                  <div>Loading jobs...</div>
                ) : displayedJobs.length === 0 ? (
                  <div>No jobs available.</div>
                ) : (
                  displayedJobs.map((job, index) => {
                    const company = companies[job.postedBy] || {};
                    return (
                      <div key={job.id || index} className="mb-4 p-3 shadow-sm rounded bg-white">
                        <div className="d-flex align-items-center">
                          <img
                            src={job.companyLogo || '/default_logo.png'}
                            alt="Company Logo"
                            style={{ width: 60, height: 60, objectFit: 'contain', marginRight: 20, borderRadius: 8 }}
                          />
                          <div style={{ flex: 1 }}>
                            <h5 className="mb-1">{job.title}</h5>
                            <div className="text-muted mb-1">
                              <strong>Type:</strong> {job.jobType} &nbsp;|&nbsp;
                              <strong>Experience:</strong> {job.experienceLevel || 'N/A'} &nbsp;|&nbsp;
                              <strong>Location:</strong> {job.location} &nbsp;|&nbsp;
                              <strong>Salary:</strong> {job.salary}
                            </div>
                            <div className="text-muted mb-1">
                              <strong>Company:</strong> {job.companyName}
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-primary ms-3"
                            onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                          >
                            {expandedJobId === job.id ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                        {expandedJobId === job.id && (
                          <div className="mt-3 border-top pt-3">
                            <div className="mb-2">
                              <strong>Description:</strong>
                              <div style={{ whiteSpace: 'pre-line' }}>{job.description}</div>
                            </div>
                            {company.location && (
                              <div className="mb-2">
                                <strong>Company Location:</strong> {company.location}
                              </div>
                            )}
                            {company.website && (
                              <div className="mb-2">
                                <strong>Company Website:</strong> <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListings;
