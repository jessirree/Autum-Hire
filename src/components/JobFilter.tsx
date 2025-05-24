import React, { useState } from 'react';

interface JobFilterProps {
  onFilter: (filters: any) => void;
}

const JobFilter: React.FC<JobFilterProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    experience: '',
    datePosted: '',
    contractType: '',
    organization: ''
  });

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    onFilter(filters);
  };

  const handleClear = () => {
    setFilters({
      keywords: '',
      location: '',
      experience: '',
      datePosted: '',
      contractType: '',
      organization: ''
    });
    onFilter({});
  };

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h5 className="mb-4">Filters</h5>
      
      <div className="mb-4">
        <label className="form-label">Keywords</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g job title"
          name="keywords"
          value={filters.keywords}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Location</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g city, country"
          name="location"
          value={filters.location}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Experience level</label>
        <select 
          className="form-select"
          name="experience"
          value={filters.experience}
          onChange={handleChange}
        >
          <option value="">Select experience</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label">Date posted</label>
        <select 
          className="form-select"
          name="datePosted"
          value={filters.datePosted}
          onChange={handleChange}
        >
          <option value="">Select time period</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label">Contract type</label>
        <select
          className="form-select"
          name="contractType"
          value={filters.contractType}
          onChange={handleChange}
        >
          <option value="">Select contract type</option>
          {jobTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label">Organization</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g autumhire"
          name="organization"
          value={filters.organization}
          onChange={handleChange}
        />
      </div>

      <button className="btn btn-warning w-100 mb-2" onClick={handleSearch}>Search</button>
      <button className="btn btn-outline-secondary w-100" onClick={handleClear}>Clear filters</button>
    </div>
  );
};

export default JobFilter; 