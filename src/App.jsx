import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Login from './pages/Login';
import AdminSignup from './pages/AdminSignup';
import UserSignup from './pages/UserSignup';
import InviteUser from './pages/InviteUser';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Scanner from './pages/Scanner';
import Transaction from './pages/Transaction';
import AddProduct from './pages/AddProduct';
import ActivityLog from './pages/ActivityLog';
import AllActivity from './pages/AllActivity';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/user-signup" element={<UserSignup />} />
          <Route path="/invite-user" element={<InviteUser />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/activity" element={<AllActivity />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;