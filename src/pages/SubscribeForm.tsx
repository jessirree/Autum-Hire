import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const categories = [
  'Software Engineering',
  'Product Management',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'Human Resources',
    'Data Science',
    'Customer Support',
    'Operations',
    'Legal',
    'IT Support',
    'Content Writing',
    'Hospitality',
    'Business Analysis',
  'Other'
];

const SubscribeForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await addDoc(collection(db, 'job_alert_subscribers'), {
        email,
        category,
        location,
        createdAt: serverTimestamp(),
      });
      setSuccess('You have successfully subscribed for job alerts!');
      setEmail('');
      setCategory('');
      setLocation('');
    } catch (err: any) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm mx-auto" style={{ maxWidth: 500 }}>
        <Card.Body>
          <h3 className="mb-4 text-center">Subscribe for Job Alerts</h3>
          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location Preference</Form.Label>
              <Form.Control
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="city, country (optional)"
              />
            </Form.Group>
            <Button type="submit" variant="success" className="w-100" disabled={loading}>
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SubscribeForm;
