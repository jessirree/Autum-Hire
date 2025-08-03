import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Row, Col, Card } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { API_ENDPOINTS } from '../config/api';

const SubscribeForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<{ place_id: string; display_name: string }[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [industriesList, setIndustriesList] = useState<string[]>([]);

  React.useEffect(() => {
    const fetchIndustries = async () => {
      try {
        console.log('Fetching industries from Firestore...');
        const querySnapshot = await getDocs(collection(db, 'industries'));
        console.log('Query snapshot:', querySnapshot);
        console.log('Number of documents:', querySnapshot.docs.length);
        
        const industries = querySnapshot.docs.map(doc => {
          console.log('Document data:', doc.id, doc.data());
          return doc.data().name;
        });
        
        console.log('Industries list:', industries);
        setIndustriesList(industries);
      } catch (err) {
        console.error('Error fetching industries:', err);
        setIndustriesList([]);
      }
    };
    fetchIndustries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (industries.length === 0) {
      setError('Please select at least one industry');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.SEND_JOB_ALERT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          industries: industries,
          location
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('You have successfully subscribed to job alerts!');
      setEmail('');
      setIndustries([]);
      setLocation('');
      } else {
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationAutocomplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    if (value.length > 2) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { 'User-Agent': 'autumhire-job-platform/1.0' } }
        );
        const data = await res.json();
        setLocationSuggestions(data);
        setShowLocationDropdown(true);
      } catch (err) {
        setLocationSuggestions([]);
        setShowLocationDropdown(false);
      }
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  const handleLocationSuggestionClick = (city: { place_id: string; display_name: string }) => {
    setLocation(city.display_name);
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
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
              <Form.Label>Industries</Form.Label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', borderRadius: 4, padding: 8 }}>
                {industriesList.length > 0 ? (
                  industriesList.map(ind => (
                    <Form.Check
                      key={ind}
                      type="checkbox"
                      id={`industry-${ind}`}
                      label={ind}
                      value={ind}
                      checked={industries.includes(ind)}
                onChange={e => {
                        if (e.target.checked) {
                          setIndustries(prev => [...prev, ind]);
                        } else {
                          setIndustries(prev => prev.filter(i => i !== ind));
                        }
                      }}
                    />
                  ))
                ) : (
                  <div className="text-muted text-center py-3">
                    Loading industries...
                  </div>
                )}
              </div>
              {industries.length > 0 && (
                <Form.Text className="text-muted">
                  {industries.length} industry{industries.length !== 1 ? 'ies' : ''} selected
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location Preference</Form.Label>
              <div style={{ position: 'relative' }}>
              <Form.Control
                type="text"
                value={location}
                  onChange={handleLocationAutocomplete}
                placeholder="city, country (optional)"
                  autoComplete="off"
              />
                {showLocationDropdown && locationSuggestions.length > 0 && (
                  <ul style={{ position: 'absolute', zIndex: 10, background: 'white', width: '100%', border: '1px solid #ccc', maxHeight: 180, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
                    {locationSuggestions.map(city => (
                      <li key={city.place_id} onClick={() => handleLocationSuggestionClick(city)} style={{ padding: '8px', cursor: 'pointer' }}>
                        {city.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
