import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import WorkerDashboard from './WorkerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'white' }}>
        Loading portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  } else if (user.role === 'worker') {
    return <WorkerDashboard />;
  } else {
    return <StudentDashboard />;
  }
};

export default Dashboard;
