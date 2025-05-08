import React from 'react';
import JobFilter from '../components/JobFilter';
import JobListingCard from '../components/JobListingCard';
import './JobListings.css';

// Sample data - replace with actual data from your backend
const sampleJobs = [
  {
    jobTitle: "Senior Software Engineer",
    companyName: "Tech Corp",
    details: "Full-time • Remote • 5+ years experience",
    companyLogo: "/company-logo1.png"
  },
  {
    jobTitle: "Product Manager",
    companyName: "Innovation Labs",
    details: "Full-time • New York • 3+ years experience",
    companyLogo: "/company-logo2.png"
  },
  {
    jobTitle: "UX Designer",
    companyName: "Creative Studio",
    details: "Contract • Remote • 2+ years experience",
    companyLogo: "/company-logo3.png"
  }
];

const JobListings: React.FC = () => {
  const handleFilter = (filters: any) => {
    // Implement filter logic here
    console.log('Filters applied:', filters);
  };

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
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Available Positions</h4>
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-secondary dropdown-toggle" 
                    type="button" 
                    id="sortDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    Sort by
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="sortDropdown">
                    <li><a className="dropdown-item" href="#">Most Recent</a></li>
                    <li><a className="dropdown-item" href="#">Most Relevant</a></li>
                    <li><a className="dropdown-item" href="#">Company Name</a></li>
                  </ul>
                </div>
              </div>

              {/* Job Cards */}
              <div className="job-cards-container">
                {sampleJobs.map((job, index) => (
                  <JobListingCard
                    key={index}
                    jobTitle={job.jobTitle}
                    companyName={job.companyName}
                    details={job.details}
                    companyLogo={job.companyLogo}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListings;
