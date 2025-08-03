import React, { useState } from 'react';

interface JobFilterProps {
  onFilter: (filters: any) => void;
}

const JobFilter: React.FC<JobFilterProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    keywords: '',
    country: '',
    city: '',
    experience: '',
    datePosted: '',
    organization: '',
    jobType: '',
    location: ''
  });

  const [suggestions, setSuggestions] = useState<{ place_id: string; display_name: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

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
      country: '',
      city: '',
      experience: '',
      datePosted: '',
      organization: '',
      jobType: '',
      location: ''
    });
    onFilter({});
  };

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, location: value }));
    if (value.length > 2) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { 'User-Agent': 'autumhire-job-platform/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data);
        setShowDropdown(true);
      } catch (err) {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (city: { place_id: string; display_name: string }) => {
    setFilters(prev => ({ ...prev, location: city.display_name }));
    setSuggestions([]);
    setShowDropdown(false);
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

      {/* Remove contract type filter field */}

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

      <div className="mb-4">
        <label htmlFor="jobType">Job Type:</label>
        <select id="jobType" name="jobType" value={filters.jobType} onChange={handleChange} style={{ backgroundColor: 'white', color: 'black' }}>
          <option value="">All</option>
          {jobTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="mb-4" style={{ position: 'relative' }}>
        <label htmlFor="location">Location:</label>
        <input
          type="text"
          id="location"
          name="location"
          className="form-control"
          value={filters.location || ''}
          onChange={handleLocationChange}
          placeholder="Enter city"
          autoComplete="off"
        />
        {showDropdown && suggestions.length > 0 && (
          <ul className="suggestions-dropdown" style={{ position: 'absolute', zIndex: 10, background: 'white', width: '100%', border: '1px solid #ccc', maxHeight: 180, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
            {suggestions.map(city => (
              <li key={city.place_id} onClick={() => handleSuggestionClick(city)} style={{ padding: '8px', cursor: 'pointer' }}>
                {city.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="btn btn-warning w-100 mb-2" onClick={handleSearch}>Search</button>
      <button className="btn btn-outline-secondary w-100" onClick={handleClear}>Clear filters</button>
    </div>
  );
};

export default JobFilter; 