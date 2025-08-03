import React from 'react';
import './AboutUs.css';
import { Helmet } from 'react-helmet-async';

const AboutUs: React.FC = () => {
  return (
    <div style={{ width: '100vw', overflowX: 'hidden' }}>
      <Helmet>
        <title>About Us | Autumhire</title>
        <meta name="description" content="Learn about Autumhire, our mission, vision, and values in talent acquisition and HR innovation." />
        <meta property="og:title" content="About Us | Autumhire" />
        <meta property="og:description" content="Learn about Autumhire, our mission, vision, and values in talent acquisition and HR innovation." />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="about-us-container">
        <div className="container py-5">
          <h1 className="text-center mb-5">About Us</h1>

          {/* Who We Are Section */}
          <section className="mb-5">
            <h2 className="section-title">Who We Are</h2>
            <p className="section-content">
            Autumhire solutions is a proactive Human resource firm specializing in Strategic resourcing systems, learning and development systems, compensation and benefits and Team building.
            </p>
            <p className="section-content">
            We champion the best Human Resource practice and integrate it with innovation and modern technology for the benefit of our clients.
            </p>
          </section>

          {/* Mission & Vision Section */}
          <div className="row mb-5">
            <div className="col-md-6 mb-4">
              <div className="mission-vision-card">
                <h2 className="section-title"> Our Mission</h2>
                <p className="section-content">
                To combine aggressive strategic talent acquisition with quality products and services through innovation and modern technology for the best talent acquisition value of consumers.
                </p>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="mission-vision-card">
                <h2 className="section-title"> Our Vision</h2>
                <p className="section-content">
                Talent acquisition practices into the global village through innovation and modern technology.
                </p>
              </div>
            </div>
          </div>

          {/* What We Offer Section */}
          <section className="mb-5">
            <h2 className="section-title"> Objectives </h2>
            <div className="offer-grid">
              <div className="offer-item">To be a partner of choice in providing quality Talent acquisition practice </div>
              <div className="offer-item">To advocate for the best Human Resource practice</div>
              <div className="offer-item">To lead in the innovation and technology of Talent acquisition systems, tools and strategies </div>
            </div>
          </section>

          {/* Core Values Section */}
          <section className="mb-5">
            <h2 className="section-title"> Our Core Values</h2>
            <div className="row">
              <div className="col-md-6 col-lg-4 mb-4">
                <div className="value-card">
                  <h3>Innovation</h3>
                  <p>We continually improve to meet the evolving job market.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 mb-4">
                <div className="value-card">
                  <h3>Integrity</h3>
                  <p>We maintain the highest standards of honesty and ethics.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 mb-4">
                <div className="value-card">
                  <h3>Excellence</h3>
                  <p>We strive for excellence in everything we do.</p>
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