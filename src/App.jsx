import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Protected from './components/Protected.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TechnicianSearch from './pages/TechnicianSearch.jsx';
import TechnicianDetail from './pages/TechnicianDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import BookingsList from './pages/BookingsList.jsx';
import BookingDetail from './pages/BookingDetail.jsx';
import Wallet from './pages/Wallet.jsx';

import NewRequest from './pages/customer/NewRequest.jsx';
import MyRequests from './pages/customer/MyRequests.jsx';
import RequestDetail from './pages/customer/RequestDetail.jsx';
import Warranties from './pages/customer/Warranties.jsx';

import TechProfileForm from './pages/technician/TechProfileForm.jsx';
import AvailableRequests from './pages/technician/AvailableRequests.jsx';

import VerifyTechnicians from './pages/admin/VerifyTechnicians.jsx';
import Users from './pages/admin/Users.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/technicians" element={<TechnicianSearch />} />
        <Route path="/technicians/:id" element={<TechnicianDetail />} />

        {/* Any logged-in user */}
        <Route element={<Protected />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/wallet" element={<Wallet />} />
        </Route>

        {/* Customer */}
        <Route element={<Protected roles={['customer']} />}>
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/requests/new" element={<NewRequest />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/warranties" element={<Warranties />} />
        </Route>

        {/* Technician */}
        <Route element={<Protected roles={['technician']} />}>
          <Route path="/tech/profile" element={<TechProfileForm />} />
          <Route path="/tech/requests" element={<AvailableRequests />} />
        </Route>

        {/* Admin */}
        <Route element={<Protected roles={['admin']} />}>
          <Route path="/admin/technicians" element={<VerifyTechnicians />} />
          <Route path="/admin/users" element={<Users />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
