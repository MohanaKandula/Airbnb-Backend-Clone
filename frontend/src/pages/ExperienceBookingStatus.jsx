import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, XCircle, Info, Calendar, ArrowRight, ShieldCheck, Home, Video, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

const ExperienceBookingStatus = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('PENDING'); // PENDING, CONFIRMED, CANCELLED, EXPIRED
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Stripe cancels redirect here with ?cancel=true
  const isCancelled = searchParams.get('cancel') === 'true';

  useEffect(() => {
    if (isCancelled) {
      setStatus('CANCELLED');
      setLoading(false);
      return;
    }

    let intervalId;
    const fetchStatus = async () => {
      try {
        const response = await axiosInstance.get(`/experiences/bookings/${bookingId}/status`);
        const data = response.data.data || response.data;
        const bookingStatus = data.bookingStatus || data.status;
        setStatus(bookingStatus);

        // Fetch complete booking details to render receipt
        const detailsResponse = await axiosInstance.get(`/experiences/bookings/${bookingId}`);
        const detailsData = detailsResponse.data.data || detailsResponse.data;
        setBooking(detailsData);
        setLoading(false);

        if (bookingStatus === 'CONFIRMED' || bookingStatus === 'CANCELLED' || bookingStatus === 'EXPIRED') {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to poll experience booking status:', err);
        setError('Verification failed. We are continuing to verify in the background.');
      }
    };

    fetchStatus();

    intervalId = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bookingId, isCancelled, retryCount]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-500 text-sm font-semibold">Verifying your secure transaction...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto space-y-4">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h3 className="text-xl font-bold text-gray-900">Verification Error</h3>
        <p className="text-gray-500 text-sm">{error}</p>
        <button
          onClick={() => setRetryCount(prev => prev + 1)}
          className="bg-brand text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-10 bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center space-y-8">
      
      {/* STATUS HEADER GRAPHIC */}
      {status === 'CONFIRMED' ? (
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0 font-display">Spot Paid & Confirmed!</h2>
          <p className="text-sm text-green-600 font-semibold bg-green-50/50 max-w-sm mx-auto py-1 px-4 rounded-full border border-green-100">
            Activity Ticket Issued successfully
          </p>
        </div>
      ) : status === 'CANCELLED' ? (
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200">
            <XCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Payment Cancelled</h2>
          <p className="text-xs text-gray-500">You cancelled the payment process. No charges were made.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200">
            <Info className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight margin-0">Confirming Payment...</h2>
          <p className="text-xs text-gray-500">Please hold tight, we are waiting for payment validation from Stripe.</p>
        </div>
      )}

      {/* ITINERARY RECEIPT CARD */}
      {booking && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left space-y-4">
          <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">Activity Ticket Details</h3>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <span className="text-gray-400 font-semibold uppercase block tracking-wider">Experience Name</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">{booking.experience?.title}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold uppercase block tracking-wider">Date of Activity</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>{formatDate(booking.bookingDate)}</span>
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold uppercase block tracking-wider">Duration</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">{booking.experience?.duration || '2 hours'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold uppercase block tracking-wider">Total Tickets</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">{booking.guestsCount} Guest Spot{booking.guestsCount > 1 && 's'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold uppercase block tracking-wider">Format / Location</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block flex items-center space-x-1">
                {booking.experience?.isOnline ? (
                  <>
                    <Video className="w-3.5 h-3.5 text-brand" />
                    <span className="text-brand font-extrabold">Online Live Call</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{booking.experience?.location}</span>
                  </>
                )}
              </span>
            </div>

            {/* Virtual Zoom Boarding Pass Card */}
            {booking.experience?.isOnline && status === 'CONFIRMED' && (
              <div className="col-span-2 bg-slate-900 text-white p-5 rounded-2xl space-y-3.5 relative overflow-hidden shadow-lg border border-slate-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/15 rounded-full blur-xl -mr-6 -mt-6"></div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4.5 h-4.5 text-brand" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350">Zoom Boarding Pass</span>
                  </div>
                  <span className="text-[9px] bg-brand text-white px-2.5 py-1 rounded font-extrabold uppercase tracking-widest animate-pulse">Live link ready</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Meeting ID</span>
                    <span className="text-xs font-mono font-extrabold tracking-wider text-slate-200 mt-0.5 block">843 920 1827</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Passcode</span>
                    <span className="text-xs font-mono font-extrabold tracking-wider text-slate-200 mt-0.5 block">airbnb-exp</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <a 
                    href="https://zoom.us/j/8439201827" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-brand hover:bg-brand-hover text-white text-center font-extrabold text-xs py-3 rounded-xl transition duration-200 shadow-md hover:shadow-lg cursor-pointer block"
                  >
                    Launch Video Session
                  </a>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          <div className="flex justify-between items-baseline">
            <span className="font-extrabold text-gray-900 text-sm">Total Amount Paid</span>
            <span className="font-extrabold text-brand text-2xl">₹{booking.amount}</span>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-green-700 font-bold bg-green-50 p-3 rounded-xl border border-green-100">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>Stripe Secure Payment Process Verified</span>
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

export default ExperienceBookingStatus;
