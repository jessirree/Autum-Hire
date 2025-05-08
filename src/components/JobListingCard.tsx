import React from 'react';

interface JobListingCardProps {
  jobTitle: string;
  companyName: string;
  details?: string;
  companyLogo?: string;
}

const JobListingCard: React.FC<JobListingCardProps> = ({
  jobTitle,
  companyName,
  details = "No details provided",
  companyLogo = "/company-default-logo.png"
}) => {
  return (
    <div className="card mb-3 border-0 shadow-sm">
      <div className="card-body d-flex align-items-center p-4">
        <img 
          src={companyLogo} 
          alt={companyName} 
          className="company-logo me-4"
          style={{ width: '60px', height: '60px', objectFit: 'contain' }}
        />
        <div className="flex-grow-1">
          <h5 className="card-title mb-1">{jobTitle}</h5>
          <h6 className="card-subtitle mb-2 text-muted">{companyName}</h6>
          <p className="card-text small mb-0">{details}</p>
        </div>
        <div className="d-flex flex-column align-items-end">
          <button className="btn btn-link bookmark-btn">
            <i className="far fa-bookmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobListingCard; 