import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar';
import HomePage from './pages/HomePage';
import JobListings from './pages/JobListings';
import AboutUs from './pages/AboutUs';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/about" element={<AboutUs />} />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  );
}

export default App;
