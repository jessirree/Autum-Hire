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
          <div className="row justify-content-center g-3">
            <div className="col-sm-4">
              <div className="input-group">
                <span className="input-group-text" style={{ color: '#fff', background: 'transparent', border: '1px solid #fff' }}><FaSearch /></span>
                <input type="text" className="form-control" placeholder="Keywords" style={{ color: '#222', background: 'rgba(234,227,210,0.6)', border: '1px solid #fff' }} />
              </div>
            </div>
            <div className="col-sm-4">
              <div className="input-group">
                <span className="input-group-text" style={{ color: '#fff', background: 'transparent', border: '1px solid #fff' }}><FaSearchLocation /></span>
                <input type="text" className="form-control" placeholder="Location" style={{ color: '#222', background: 'rgba(234,227,210,0.6)', border: '1px solid #fff' }} />
              </div>
            </div>
            <div className="col-sm-2">
              <button className="btn login-btn fw-bold w-100">Search</button>
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