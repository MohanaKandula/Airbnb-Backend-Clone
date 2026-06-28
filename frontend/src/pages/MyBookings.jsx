import React, { useEffect, useState } from 'react';
import { useBookings } from '../context/BookingContext';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { CalendarDays, Compass, Info, Video, MapPin, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';

const MyBookings = () => {
  const { myBookings, loading, error, fetchMyBookings, initiatePayment, cancelBooking, rateBooking } = useBookings();
  const [activeTab, setActiveTab] = useState('stays'); // stays vs experiences
  const [experienceBookings, setExperienceBookings] = useState([]);
  const [expLoading, setExpLoading] = useState(false);

  useEffect(() => {
    fetchMyBookings().catch((err) => {
      toast.error('Could not fetch bookings list.');
    });
  }, []);

  const fetchExperiences = async () => {
    setExpLoading(true);
    try {
      const response = await axiosInstance.get('/experiences/bookings/my-bookings');
      const data = response.data.data || response.data;
      setExperienceBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load experience bookings.');
    } finally {
      setExpLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'experiences') {
      fetchExperiences();
    }
  }, [activeTab]);

  const handlePay = async (bookingId) => {
    try {
      toast.info('Redirecting to Stripe checkout...', { autoClose: 2000 });
      await initiatePayment(bookingId);
    } catch (err) {
      toast.error(err.message || 'Payment redirection failed.');
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        await cancelBooking(bookingId);
        toast.success('Reservation cancelled successfully!');
      } catch (err) {
        toast.error(err.message || 'Failed to cancel reservation.');
      }
    }
  };

  const handleRate = async (bookingId, ratingVal) => {
    try {
      await rateBooking(bookingId, ratingVal);
      toast.success('Thank you for rating your stay!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit rating.');
    }
  };

  const handlePayExperience = async (bookingId) => {
    try {
      toast.info('Redirecting to Stripe checkout...', { autoClose: 2000 });
      const successUrl = `${window.location.origin}/experiences/booking-status/${bookingId}`;
      const failureUrl = `${window.location.origin}/experiences/booking-status/${bookingId}?cancel=true`;
      const res = await axiosInstance.post(`/experiences/bookings/${bookingId}/payments`, null, {
        params: { successUrl, failureUrl }
      });
      const data = res.data.data || res.data;
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (err) {
      toast.error('Checkout redirect failed.');
    }
  };

  const handleCancelExperience = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel your experience spot?')) {
      try {
        await axiosInstance.post(`/experiences/bookings/${bookingId}/cancel`);
        toast.success('Spot cancelled successfully.');
        fetchExperiences();
      } catch (err) {
        toast.error('Failed to cancel experience spot.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 margin-0">My Bookings & Trips</h1>
        <p className="text-gray-500 text-sm">View details of your past hotel stays, virtual activities, and experiences.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('stays')}
          className={`flex-1 py-3 text-center font-extrabold text-xs tracking-wider uppercase border-b-2 transition cursor-pointer ${
            activeTab === 'stays' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-950'
          }`}
        >
          🏨 Hotel Stays ({myBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('experiences')}
          className={`flex-1 py-3 text-center font-extrabold text-xs tracking-wider uppercase border-b-2 transition cursor-pointer ${
            activeTab === 'experiences' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-950'
          }`}
        >
          🏄 Activities & Experiences ({experienceBookings.length})
        </button>
      </div>

      {/* Stays Tab Content */}
      {activeTab === 'stays' && (
        <>
          {loading && myBookings.length === 0 ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-red-50 border border-red-100 rounded-2xl p-6">
              <p className="text-red-700 font-bold text-base">Unable to load reservations</p>
              <p className="text-red-500 text-xs mt-1">{error}</p>
            </div>
          ) : myBookings.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
                <CalendarDays className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">No reservations booked yet</h3>
                <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Start exploring thousands of curated, verified premium properties. Your next perfect stay is just a few clicks away!
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/"
                  className="inline-flex items-center space-x-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition duration-200"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore Stays</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {myBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPay={handlePay}
                  onCancel={handleCancel}
                  onRate={handleRate}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Experiences Tab Content */}
      {activeTab === 'experiences' && (
        <>
          {expLoading && experienceBookings.length === 0 ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : experienceBookings.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">No activities booked yet</h3>
                <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Explore guided tours, local activities, and virtual interactive cooking/yoga workshops led by experts!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {experienceBookings.map((bk) => (
                <div key={bk.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-center">
                  
                  {/* Experience Image */}
                  <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-gray-150 flex-shrink-0">
                    <img 
                      src={bk.experience?.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=300&q=80'} 
                      alt={bk.experience?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Booking Info */}
                  <div className="flex-1 space-y-3.5 text-left w-full">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider border ${
                        bk.bookingStatus === 'CONFIRMED'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : bk.bookingStatus === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {bk.bookingStatus === 'CONFIRMED' ? 'Paid & Confirmed' : bk.bookingStatus === 'CANCELLED' ? 'Cancelled' : 'Pending Payment'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase">Ticket ID: #{bk.id}</span>
                    </div>

                    <h3 className="font-extrabold text-gray-950 text-base leading-snug">
                      {bk.experience?.title}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500 font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Date: <span className="text-gray-800 font-bold">{new Date(bk.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Duration: <span className="text-gray-800 font-bold">{bk.experience?.duration || '2 hours'}</span></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {bk.experience?.isOnline ? (
                          <>
                            <Video className="w-4 h-4 text-brand" />
                            <span className="text-brand font-extrabold">Online Live Call</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>Location: <span className="text-gray-800 font-bold">{bk.experience?.location}</span></span>
                          </>
                        )}
                      </div>
                      <div>Tickets: <span className="text-gray-800 font-bold">{bk.guestsCount} spot(s) booked</span></div>
                    </div>
                  </div>

                  {/* Price and CTAs */}
                  <div className="w-full md:w-fit text-right flex flex-row md:flex-col justify-between items-center md:items-end gap-4 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-bold mb-0.5 uppercase tracking-wide">Total Paid</span>
                      <span className="text-lg font-extrabold text-brand">₹{bk.amount}</span>
                    </div>

                    <div className="flex space-x-2.5">
                      {(bk.bookingStatus === 'RESERVED' || bk.bookingStatus === 'PAYMENTS_PENDING') && (
                        <button
                          onClick={() => handlePayExperience(bk.id)}
                          className="bg-brand hover:bg-brand-hover text-white text-[11px] font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Pay Now
                        </button>
                      )}
                      {bk.bookingStatus !== 'CANCELLED' && bk.bookingStatus !== 'EXPIRED' && (
                        <button
                          onClick={() => handleCancelExperience(bk.id)}
                          className="border border-gray-300 hover:border-red-500 hover:text-red-500 text-gray-500 text-[11px] font-extrabold px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Cancel Spot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyBookings;
