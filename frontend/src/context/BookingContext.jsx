import React, { createContext, useState, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [currentBooking, setCurrentBooking] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initialize booking
  const initializeBooking = async (bookingRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/bookings/init', bookingRequest);
      const data = response.data.data || response.data;
      const mappedData = {
        ...data,
        status: data.bookingStatus,
        totalPrice: data.amount,
      };
      setCurrentBooking(mappedData);
      setLoading(false);
      return mappedData;
    } catch (err) {
      console.error('Initialize booking failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to initialize booking.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // 2. Add guests to booking
  const addGuestsToBooking = async (bookingId, guestsList) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/addGuests`, guestsList);
      const data = response.data.data || response.data;
      setCurrentBooking(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('Add guests failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to add guests to booking.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // 3. Initiate payment redirect (Stripe checkout)
  const initiatePayment = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/payments`);
      const data = response.data.data || response.data;
      setLoading(false);
      if (data.sessionUrl) {
        // Redirect to Stripe checkout page
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('Stripe Checkout URL not returned from backend.');
      }
    } catch (err) {
      console.error('Payment initiation failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to initiate payment.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // 4. Cancel booking
  const cancelBooking = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/cancel`);
      const data = response.data.data || response.data;
      
      // Update my bookings list and current booking state if they are modified
      setMyBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
      if (currentBooking && currentBooking.id === bookingId) {
        setCurrentBooking(prev => ({ ...prev, status: 'CANCELLED' }));
      }
      setLoading(false);
      return data;
    } catch (err) {
      console.error('Cancel booking failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to cancel booking.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // 5. Fetch booking status (now fetches full booking details with status)
  const getBookingStatus = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/bookings/${bookingId}`);
      const data = response.data.data || response.data;
      const mappedData = {
        ...data,
        status: data.bookingStatus,
        totalPrice: data.amount,
      };
      setCurrentBooking(mappedData);
      setLoading(false);
      return mappedData;
    } catch (err) {
      console.error('Get booking status failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to get booking status.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // 6. Fetch user bookings
  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/users/myBookings');
      const data = response.data.data || response.data;
      const mappedBookings = (Array.isArray(data) ? data : []).map(b => ({
        ...b,
        status: b.bookingStatus,
        totalPrice: b.amount,
      }));
      setMyBookings(mappedBookings);
      setLoading(false);
      return mappedBookings;
    } catch (err) {
      console.error('Fetch my bookings failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to fetch your bookings.';
      setError(errMsg);
      setLoading(false);
      return [];
    }
  };

  const rateBooking = async (bookingId, rating) => {
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/rate`, { rating });
      const updatedBooking = response.data.data || response.data;
      
      const normalizedBooking = {
        ...updatedBooking,
        status: updatedBooking.bookingStatus,
        totalPrice: updatedBooking.amount,
      };

      // Update local state list and currentBooking if matched
      setMyBookings(prev => prev.map(b => b.id === bookingId ? normalizedBooking : b));
      if (currentBooking && currentBooking.id === bookingId) {
        setCurrentBooking(normalizedBooking);
      }
      return normalizedBooking;
    } catch (err) {
      console.error('Rate booking failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit rating.';
      throw new Error(errMsg);
    }
  };

  const selectCashPaymentMethod = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/cash`);
      const data = response.data.data || response.data;
      const mappedData = {
        ...data,
        status: data.bookingStatus,
        totalPrice: data.amount,
      };
      setCurrentBooking(mappedData);
      setLoading(false);
      return mappedData;
    } catch (err) {
      console.error('Select cash payment failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to select cash payment.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  const confirmCashPayment = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/confirm-cash`);
      const data = response.data.data || response.data;
      setLoading(false);
      return data;
    } catch (err) {
      console.error('Confirm cash payment failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to confirm cash payment.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  const value = {
    currentBooking,
    myBookings,
    loading,
    error,
    initializeBooking,
    addGuestsToBooking,
    initiatePayment,
    cancelBooking,
    getBookingStatus,
    fetchMyBookings,
    setCurrentBooking,
    rateBooking,
    selectCashPaymentMethod,
    confirmCashPayment
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};
