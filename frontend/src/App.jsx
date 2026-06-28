import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Global toast interceptor to track recently shown toasts for deduplication
window._recentToasts = [];
const originalSuccess = toast.success;
const originalInfo = toast.info;
const originalWarn = toast.warn;
const originalError = toast.error;

const recordToast = (type, content) => {
  const extractText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.map(extractText).join(' ');
    if (typeof val === 'object') {
      if (val.props && val.props.children) {
        return extractText(val.props.children);
      }
      try {
        return JSON.stringify(val);
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  const text = extractText(content).toLowerCase();
  const now = Date.now();

  window._recentToasts.push({
    text,
    type,
    timestamp: now
  });

  // Keep only toasts shown in the last 7 seconds and limit the history size to 10
  window._recentToasts = window._recentToasts
    .filter(t => now - t.timestamp < 7000)
    .slice(-10);
};

toast.success = function(content, options) {
  recordToast('success', content);
  return originalSuccess.apply(this, arguments);
};
toast.info = function(content, options) {
  recordToast('info', content);
  return originalInfo.apply(this, arguments);
};
toast.warn = function(content, options) {
  recordToast('warn', content);
  return originalWarn.apply(this, arguments);
};
toast.error = function(content, options) {
  recordToast('error', content);
  return originalError.apply(this, arguments);
};

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { HotelProvider } from './context/HotelContext';
import { WishlistProvider } from './context/WishlistContext';
import { BookingProvider } from './context/BookingContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Route Protection Components
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import HotelSearch from './pages/HotelSearch';
import HotelDetails from './pages/HotelDetails';
import Experiences from './pages/Experiences';
import ExperienceDetails from './pages/ExperienceDetails';
import ExperienceBookingStatus from './pages/ExperienceBookingStatus';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Guest Pages
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import MyGuests from './pages/MyGuests';
import Checkout from './pages/Checkout';
import BookingStatus from './pages/BookingStatus';
import Wishlists from './pages/Wishlists';

// Protected Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateHotel from './pages/admin/CreateHotel';
import UpdateHotel from './pages/admin/UpdateHotel';
import HotelList from './pages/admin/HotelList';
import CreateRoom from './pages/admin/CreateRoom';
import RoomList from './pages/admin/RoomList';
import InventoryManagement from './pages/admin/InventoryManagement';
import HotelReports from './pages/admin/HotelReports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HotelProvider>
          <WishlistProvider>
            <BookingProvider>
            
            {/* React Toast notifications container */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />

            <Routes>
              {/* PUBLIC & GENERAL GUEST ROUTES */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="search" element={<HotelSearch />} />
                <Route path="hotels/:hotelId" element={<HotelDetails />} />
                <Route path="experiences" element={<Experiences />} />
                <Route path="experiences/:id" element={<ExperienceDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />

                {/* PROTECTED GUEST ROUTES */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="wishlists"
                  element={
                    <ProtectedRoute>
                      <Wishlists />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-guests"
                  element={
                    <ProtectedRoute>
                      <MyGuests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="checkout/:bookingId"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="booking-status/:bookingId"
                  element={
                    <ProtectedRoute>
                      <BookingStatus />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="experiences/booking-status/:bookingId"
                  element={
                    <ProtectedRoute>
                      <ExperienceBookingStatus />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* PROTECTED ADMIN (HOTEL MANAGER) ROUTES */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="hotels" element={<HotelList />} />
                <Route path="hotels/create" element={<CreateHotel />} />
                <Route path="hotels/:hotelId/edit" element={<UpdateHotel />} />
                <Route path="hotels/:hotelId/rooms" element={<RoomList />} />
                <Route path="hotels/:hotelId/rooms/create" element={<CreateRoom />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="reports" element={<HotelReports />} />
              </Route>

              {/* 404 Fallback - Redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

          </BookingProvider>
        </WishlistProvider>
      </HotelProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
