import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './dashboard.css';

// Pages
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import DatasetDashboard from './pages/DatasetDashboard';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Navigate to="/admin/datasets" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/datasets" 
            element={
              <ProtectedRoute>
                <DatasetDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;