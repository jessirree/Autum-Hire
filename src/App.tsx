import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import AboutUs from './pages/AboutUs';
import HomePage from './pages/HomePage';
import Auth from './pages/Auth';
import JobForm from './pages/JobForm';
import PostJob from './pages/PostJob';
import EmployerDashboard from './pages/EmployerDashboard';
import JobListings from './pages/JobListings';
import SubscribeForm from './pages/SubscribeForm';
import './App.css';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route 
              path="/job-form" 
              element={
                <ProtectedRoute>
                  <JobForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer-dashboard" 
              element={
                <ProtectedRoute>
                  <EmployerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/jobs" element={<JobListings />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/subscribe" element={<SubscribeForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
