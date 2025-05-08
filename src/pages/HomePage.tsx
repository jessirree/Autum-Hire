// src/pages/HomePage.tsx
import { FaSearchLocation, FaSearch } from "react-icons/fa";
import JobCard from '../components/JobCard';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';

// Sample job data
const featuredJobs = [
  {
    title: "Senior Software Engineer",
    company: "Tech Corp",
    location: "New York, NY",
    salary: "$120k - $150k",
    type: "Full-time"
  },
  {
    title: "Product Manager",
    company: "Innovation Labs",
    location: "San Francisco, CA",
    salary: "$130k - $160k",
    type: "Full-time"
  },
  {
    title: "UX Designer",
    company: "Creative Studio",
    location: "Remote",
    salary: "$90k - $120k",
    type: "Contract"
  }
];

export default function HomePage() {
  return (
    <div style={{ width: '100vw', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <div
        className="text-white d-flex flex-column justify-content-center align-items-center w-100"
        style={{
          backgroundImage: `url(/background.png)`,
          backgroundSize: '100%',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
          height: '70vh',
          width: '100vw',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2rem' }}>
          <div className="container">
            <h2 className="fw-bold text-center mb-4">FIND A JOB</h2>
            <div className="row justify-content-center g-3">
              <div className="col-sm-4">
                <div className="input-group">   
                  <span className="input-group-text"><FaSearch /></span>
                  <input type="text" className="form-control" placeholder="Keywords" />
                </div>
              </div>
              <div className="col-sm-4">
                <div className="input-group">
                  <span className="input-group-text"><FaSearchLocation /></span>
                  <input type="text" className="form-control" placeholder="Location" />
                </div>
              </div>
              <div className="col-sm-2">
                <button className="btn btn-warning fw-bold w-100">Search</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Jobs */}
      <div style={{ width: '100vw', backgroundColor: '#b3c2a3' }} className="py-5">
        <div className="container">
          <div className="row justify-content-center g-4">
            {featuredJobs.map((job, index) => (
              <div key={index} className="col-sm-3 mx-3">
                <JobCard {...job} />
              </div>
            ))}
          </div>
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