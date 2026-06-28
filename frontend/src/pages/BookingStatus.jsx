import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBookings } from '../context/BookingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, XCircle, Info, Calendar, ArrowRight, ShieldCheck, Home } from 'lucide-react';
import { toast } from 'react-toastify';

const BookingStatus = () => {
  const { bookingId } = useParams();
  const { getBookingStatus, currentBooking, loading, error } = useBookings();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let intervalId;
    const fetchStatus = () => {
      getBookingStatus(bookingId)
        .then((booking) => {
          if (booking && (booking.status === 'CONFIRMED' || booking.status === 'CANCELLED' || booking.status === 'EXPIRED')) {
            if (intervalId) clearInterval(intervalId);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    };

    fetchStatus();

    intervalId = setInterval(() => {
      fetchStatus();
    }, 3500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bookingId, retryCount]);

  if (loading && !currentBooking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-500 text-sm font-semibold">Verifying your secure transaction...</p>
      </div>
    );
  }

  if (error || !currentBooking) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto space-y-4">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h3 className="text-xl font-bold text-gray-900">Verification Error</h3>
        <p className="text-gray-500 text-sm">{error || "We couldn't verify the status of this booking. Please reload the page."}</p>
        <button
          onClick={() => setRetryCount(prev => prev + 1)}
          className="bg-brand text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    hotelName = 'Premium Resort Stay',
    roomType = 'Standard',
    checkInDate,
    checkOutDate,
    totalPrice = 120,
    status = 'INITIAL',
    guests = []
  } = currentBooking;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto my-10 bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center space-y-8">
      {/* STATUS GRAPHIC & HEADING */}
      {status === 'CONFIRMED' || status === 'COMPLETED' ? (
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Booking Paid & Confirmed!</h2>
          <p className="text-sm text-green-600 font-semibold bg-green-50/50 max-w-sm mx-auto py-1 px-4 rounded-full border border-green-100">
            Reservation Ticket Issued successfully
          </p>
        </div>
      ) : status === 'CANCELLED' ? (
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200">
            <XCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Reservation Cancelled</h2>
          <p className="text-xs text-gray-500">This reservation session was cancelled or the session timed out.</p>
        </div>
      ) : currentBooking?.paymentSessionId === 'CASH' ? (
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-250">
            <Info className="w-10 h-10 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Cash Payment Pending Check-In</h2>
          <p className="text-xs text-amber-700 bg-amber-50/50 max-w-sm mx-auto py-1.5 px-4 rounded-full border border-amber-200 font-extrabold uppercase tracking-wide">
            Pay ₹{totalPrice} in Cash at Property
          </p>
          <p className="text-[11px] text-gray-400 max-w-md mx-auto leading-relaxed">
            Your stay is reserved. Please pay the hotel manager directly in cash upon arrival to confirm your check-in.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200">
            <Info className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Checking Stripe Session...</h2>
          <p className="text-xs text-gray-500">We are waiting for Stripe to notify us of your payment completion.</p>
        </div>
      )}

      {/* TRIP DETAILS REPORT */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left space-y-4">
        <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">Itinerary Receipt</h3>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400 font-semibold uppercase block tracking-wider">Property Name</span>
            <span className="font-bold text-gray-800 text-sm mt-0.5 block">{hotelName}</span>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase block tracking-wider">Room category</span>
            <span className="font-bold text-gray-800 text-sm mt-0.5 block">{roomType} Room</span>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase block tracking-wider">Check-in</span>
            <span className="font-bold text-gray-800 text-sm mt-0.5 block">{formatDate(checkInDate)}</span>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase block tracking-wider">Check-out</span>
            <span className="font-bold text-gray-800 text-sm mt-0.5 block">{formatDate(checkOutDate)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 font-semibold uppercase block tracking-wider">Travelers Roster</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {guests.length === 0 ? (
                <span className="text-gray-500 italic">None registered</span>
              ) : (
                guests.map((g, idx) => (
                  <span key={idx} className="bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                    {g.name} ({g.gender[0]}, {g.age} yrs)
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="flex justify-between items-baseline">
          <span className="font-extrabold text-gray-900 text-sm">
            {currentBooking?.paymentSessionId === 'CASH' && status === 'PAYMENTS_PENDING' ? 'Amount Due at Check-In' : 'Total Amount Paid'}
          </span>
          <span className="font-extrabold text-brand text-2xl">₹{totalPrice} INR</span>
        </div>
      </div>

      {/* SECURITY VERIFIED & ACTIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-green-700 font-bold bg-green-50 p-3 rounded-xl border border-green-100">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>Airbnb SafeStay Verification Complete</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/my-bookings"
            className="w-full sm:w-auto bg-gray-900 hover:bg-brand text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-1.5"
          >
            <span>Go to My Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs py-3 px-6 rounded-xl transition flex items-center justify-center space-x-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingStatus;
