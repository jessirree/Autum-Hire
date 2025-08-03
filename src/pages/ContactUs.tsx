import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';
import './ContactUs.css';
import { Helmet } from 'react-helmet-async';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Send the form data to the backend endpoint
      const response = await fetch(API_ENDPOINTS.SEND_CONTACT_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending contact message:', err);
      setError(err.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Contact Us | Autumhire</title>
        <meta name="description" content="Contact Autumhire for support, questions, or feedback. We're here to help you find or post jobs." />
        <meta property="og:title" content="Contact Us | Autumhire" />
        <meta property="og:description" content="Contact Autumhire for support, questions, or feedback. We're here to help you find or post jobs." />
        <meta property="og:type" content="website" />
      </Helmet>
      <h1 className="text-center mb-5">Contact Us</h1>
      
      <Row className="justify-content-center">
        <Col md={4} className="mb-4">
          <Card className="contact-info-card h-100">
            <Card.Body>
              <h3 className="mb-4">Get in Touch</h3>
              
              <div className="contact-item mb-4">
                <FaEnvelope className="contact-icon" />
                <div>
                  <h5>Email</h5>
                  <p>info@autumhire.com</p>
                </div>
              </div>

              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <div>
                  <h5>Location</h5>
                  <p>Nairobi, Kenya</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="contact-form-card">
            <Card.Body>
              <h3 className="mb-4">Send us a Message</h3>
              
              {success && (
                <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                  Your message has been sent successfully! We've sent you a confirmation email and will get back to you soon.
                </Alert>
              )}
              
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Your Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Enter message subject"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Enter your message"
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ContactUs;
