interface JobCardProps {
  title: string;
  company?: string;
  location?: string;
  salary?: string;
  type?: string;
}

const JobCard: React.FC<JobCardProps> = ({ 
  title, 
  company = "Company Name", 
  location = "Location", 
  salary = "Competitive", 
  type = "Full-time" 
}) => {
  return (
    <div className="text-center p-4 shadow-sm rounded h-100" style={{ background: '#eae3d2' }}>
      <h5 className="fw-bold mb-3">{title}</h5>
      <div className="text-muted">
        <p className="mb-2">{company}</p>
        <p className="mb-2"><i className="fas fa-map-marker-alt me-2"></i>{location}</p>
        <p className="mb-2"><i className="fas fa-money-bill me-2"></i>{salary}</p>
        <p className="mb-0"><i className="fas fa-briefcase me-2"></i>{type}</p>
      </div>
      <button className="btn login-btn w-100 mt-3">View Details</button>
    </div>
  );
};

export default JobCard; 