import React from 'react';
import './AboutUs.css';
import { Helmet } from 'react-helmet-async';

const AboutUs: React.FC = () => {
  return (
    <div style={{ width: '100vw', overflowX: 'hidden' }}>
      <Helmet>
        <title>About Us | Autumhire</title>
        <meta name="description" content="Autumhire Solutions - Your strategic HR partner for recruitment, staffing, and talent development." />
        <meta property="og:title" content="About Us | Autumhire" />
        <meta property="og:description" content="Autumhire Solutions - Your strategic HR partner for recruitment, staffing, and talent development." />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="about-us-container">
        <div className="container py-5">
          <h1 className="text-center mb-4">About Us</h1>
          
          {/* New Intro */}
          <p className="intro-lead">
            At Autumhire Solutions, we go beyond traditional recruitment. As a forward-thinking
            Human Resource partner, we blend aggressive talent strategies, cutting-edge technology, and
            deep industry insight to deliver exceptional results for businesses and professionals alike.
            Whether you're a growing company seeking top-tier talent, flexible workforce solutions, or a
            skilled professional ready for your next challenge, we're here to make meaningful, lasting
            connections.
          </p>

          {/* New Services Section */}
          <section className="mb-5">
            <h2 className="section-title text-center mb-4">Our Services</h2>
            <div className="row g-4">
              {/* Strategic Talent Acquisition */}
              <div className="col-lg-4 col-md-6">
                <div className="service-card">
                  <h3>Strategic Talent Acquisition & Recruitment</h3>
                  <p>We don't just fill positions — we build high-performing teams that drive your business forward.</p>
                  <ul className="service-list">
                    <li><strong>Executive & Leadership Search:</strong> Discreet, targeted headhunting for C-suite and strategic roles</li>
                    <li><strong>Permanent Recruitment:</strong> Comprehensive sourcing and placement for critical long-term hires</li>
                    <li><strong>Volume & Mass Recruitment:</strong> Scalable campaigns for high-turnover scenarios</li>
                    <li><strong>Specialized Industry Hiring:</strong> Tailored pipelines for tech, finance, healthcare, and more</li>
                    <li><strong>Passive Candidate Engagement:</strong> Reaching the best talent not actively looking</li>
                  </ul>
                </div>
              </div>

              {/* Casual & Temporary Staffing */}
              <div className="col-lg-4 col-md-6">
                <div className="service-card">
                  <h3>Casual & Temporary Staffing Outsourcing</h3>
                  <p>Need flexible, on-demand workforce solutions without the long-term commitment?</p>
                  <ul className="service-list">
                    <li>Rapid placement of casual, temp, and contract workers</li>
                    <li>Flexible staffing models: daily, weekly, or project-based</li>
                    <li>Managed outsourcing for high-volume needs</li>
                    <li>Full compliance handling (labor laws, insurance, payroll)</li>
                  </ul>
                </div>
              </div>

              {/* Technology-Driven HR */}
              <div className="col-lg-4 col-md-6">
                <div className="service-card">
                  <h3>Technology-Driven HR Solutions</h3>
                  <p>Innovation is at our core. We leverage modern tools to make the talent journey faster and smarter.</p>
                  <ul className="service-list">
                    <li>AI-powered candidate matching and screening</li>
                    <li>Automated recruitment workflows and applicant tracking</li>
                    <li>Virtual assessment centers and video interviewing</li>
                    <li>Data analytics for recruitment insights</li>
                    <li>Mobile-first job matching for candidates</li>
                  </ul>
                </div>
              </div>

              {/* Learning & Development */}
              <div className="col-lg-4 col-md-6">
                <div className="service-card">
                  <h3>Learning & Development Systems</h3>
                  <p>Investing in people is investing in performance. We design customized upskilling programs.</p>
                  <ul className="service-list">
                    <li>Tailored training workshops and certification programs</li>
                    <li>Leadership development & succession planning</li>
                    <li>Soft skills, technical skills, and compliance training</li>
                    <li>Employee onboarding & induction optimization</li>
                    <li>Performance coaching and career path development</li>
                  </ul>
                </div>
              </div>

              {/* Compensation & Benefits */}
              <div className="col-lg-4 col-md-6">
                <div className="service-card">
                  <h3>Compensation & Benefits Advisory</h3>
                  <p>Attract and retain top talent with competitive, cost-effective reward strategies.</p>
                  <ul className="service-list">
                    <li>Design market-competitive salary structures</li>
                    <li>Develop attractive benefits packages</li>
                    <li>Implement performance-based incentive schemes</li>
                    <li>Conduct salary benchmarking and total reward audits</li>
                    <li>Ensure compliance with local labor laws</li>
                  </ul>
                </div>
              </div>

              {/* Team Building */}
              <div className="col-lg-4 col-md-6">
                <div className="service-card">
                  <h3>Team Building & Organizational Development</h3>
                  <p>Strong teams deliver exceptional results. We facilitate powerful experiences.</p>
                  <ul className="service-list">
                    <li>Custom team-building workshops and offsites</li>
                    <li>Culture assessment & transformation programs</li>
                    <li>Conflict resolution which team dynamics interventions</li>
                    <li>Employee engagement surveys & action planning</li>
                    <li>Change management support during restructuring</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Why Partner Section */}
          <section className="partner-section">
            <h2 className="section-title mb-3">Why partner with Autumhire?</h2>
            <p className="mb-4" style={{ fontSize: '1.1rem' }}>
              Because we combine the aggression of a boutique search firm,
              the scale of a large agency, and the innovation of a tech-driven HR partner — all delivered
              with integrity, excellence, and a genuine passion for people.
            </p>
            <p className="mb-4">
              We're not just filling roles. We're shaping futures, building legacies, and powering
              organizations to thrive in today's dynamic world with flexible, reliable talent solutions.
            </p>
            <h4 className="fw-bold text-muted">Ready to transform your talent strategy? Contact us today — let's create something extraordinary together.</h4>
          </section>

          <hr className="my-5" />

          {/* Original Content Moved Bottom */}
          
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

          {/* Objectives (Was 'What We Offer') */}
          <section className="mb-5">
            <h2 className="section-title"> Objectives </h2>
            <div className="offer-grid">
              <div className="offer-item">To be a partner of choice in providing quality Talent acquisition practice </div>
              <div className="offer-item">To advocate for the best Human Resource practice</div>
              <div className="offer-item">To lead in the innovation and technology of Talent acquisition systems, tools and strategies </div>
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