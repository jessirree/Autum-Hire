import React from 'react';

interface JobFilterProps {
  onFilter: (filters: any) => void;
}

const JobFilter: React.FC<JobFilterProps> = ({ onFilter }) => {
  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h5 className="mb-4">Filters</h5>
      
      <div className="mb-4">
        <label className="form-label">Keywords</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g job title"
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Location</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g city, country"
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Experience level</label>
        <select className="form-select">
          <option value="">Select experience</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label">Date posted</label>
        <select className="form-select">
          <option value="">Select time period</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label">Contract type</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g full time"
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Organization</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g autumhire"
        />
      </div>

      <button className="btn btn-warning w-100 mb-2">Search</button>
      <button className="btn btn-outline-secondary w-100">Clear filters</button>
    </div>
  );
};

export default JobFilter; 