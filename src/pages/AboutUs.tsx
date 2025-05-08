import React from 'react';
import './AboutUs.css';

const AboutUs: React.FC = () => {
  return (
    <div style={{ width: '100vw', overflowX: 'hidden' }}>
      <div className="about-us-container">
        <div className="container py-5">
          <h1 className="text-center mb-5">About Us</h1>

          {/* Who We Are Section */}
          <section className="mb-5">
            <h2 className="section-title">Who We Are</h2>
            <p className="section-content">
              We are a dynamic online job listing platform dedicated to bridging the gap between job seekers and employers. 
              Whether you're a recent graduate seeking your first role or a company looking to attract top talent, 
              our platform is designed to make the hiring journey seamless, transparent, and efficient.
            </p>
            <p className="section-content">
              Founded with the belief that everyone deserves access to meaningful employment, 
              we strive to empower individuals and businesses alike through smart technology and user-focused features.
            </p>
          </section>

          {/* Mission & Vision Section */}
          <div className="row mb-5">
            <div className="col-md-6 mb-4">
              <div className="mission-vision-card">
                <h2 className="section-title"> Our Mission</h2>
                <p className="section-content">
                  To connect job seekers with opportunities that match their skills, passions, 
                  and career goals—while providing employers with a streamlined way to find qualified candidates.
                </p>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="mission-vision-card">
                <h2 className="section-title"> Our Vision</h2>
                <p className="section-content">
                  To become the leading job-matching platform in our region, known for reliability, 
                  ease of use, and the positive impact we create in the job market.
                </p>
              </div>
            </div>
          </div>

          {/* What We Offer Section */}
          <section className="mb-5">
            <h2 className="section-title"> What We Offer</h2>
            <div className="offer-grid">
              <div className="offer-item">A curated list of job openings across various industries.</div>
              <div className="offer-item">Easy-to-use filters for skills, location, and job type.</div>
              <div className="offer-item">Employer dashboards to manage listings and applications.</div>
              <div className="offer-item">Real-time job alerts and updates for seekers.</div>
              <div className="offer-item">A mobile-responsive, secure, and user-friendly experience.</div>
            </div>
          </section>

          {/* Core Values Section */}
          <section className="mb-5">
            <h2 className="section-title"> Our Core Values</h2>
            <div className="row">
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="value-card">
                  <h3>Transparency</h3>
                  <p>We foster open, honest job listings with accurate information.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="value-card">
                  <h3>Accessibility</h3>
                  <p>Our platform is inclusive and easy to navigate for all users.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="value-card">
                  <h3>Empowerment</h3>
                  <p>We aim to uplift both individuals and organizations.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="value-card">
                  <h3>Innovation</h3>
                  <p>We continually improve to meet the evolving job market.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="mb-5">
            <h2 className="section-title">Why Choose Us?</h2>
            <ul className="choose-us-list">
              <li>Clean, distraction-free interface.</li>
              <li>Localized job opportunities and growing reach.</li>
              <li>Dedicated support for both seekers and recruiters.</li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="text-center">
            <h2 className="section-title"> Get in Touch</h2>
            <p className="section-content">
              Have questions or feedback? We'd love to hear from you.
            </p>
            <div className="social-links mt-4">
              <a href="#" className="social-link"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social-link"><i className="fab fa-linkedin-in"></i></a>
              <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 