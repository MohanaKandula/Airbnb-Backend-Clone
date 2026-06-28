import React, { useState } from 'react';
import { Calendar, Users, Home, CreditCard, XCircle, CheckCircle, Info, Star } from 'lucide-react';

const BookingCard = ({ booking, onPay, onCancel, onRate }) => {
  const {
    id,
    hotelName = 'Premium Resort Stay',
    roomType = 'Standard',
    checkInDate,
    checkOutDate,
    totalPrice = 240,
    status = 'INITIAL', // INITIAL, PENDING, COMPLETED, CANCELLED
    guests = [],
    rating,
  } = booking;

  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleRate = async (ratingVal) => {
    if (!onRate) return;
    setSubmittingRating(true);
    try {
      await onRate(id, ratingVal);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysCount = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return (
          <span className="flex items-center space-x-1 bg-green-50 text-green-700 font-bold text-xs px-3 py-1.5 rounded-full border border-green-200">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>Paid & Confirmed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center space-x-1 bg-red-50 text-red-700 font-bold text-xs px-3 py-1.5 rounded-full border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span>Cancelled</span>
          </span>
        );
      case 'PENDING':
      case 'INITIAL':
      default:
        return (
          <span className="flex items-center space-x-1 bg-amber-50 text-amber-700 font-bold text-xs px-3 py-1.5 rounded-full border border-amber-200">
            <Info className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Pending Payment</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition duration-200 flex flex-col md:flex-row justify-between gap-6">
      {/* Left Column: Details */}
      <div className="space-y-4 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="font-extrabold text-gray-900 text-lg">{hotelName}</h4>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2.5">
            <Home className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Room Selected</p>
              <p className="font-semibold text-gray-800">{roomType} Room</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Travelers</p>
              <p className="font-semibold text-gray-800">
                {guests.length || 1} {guests.length === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Check-in</p>
              <p className="font-semibold text-gray-800">{formatDate(checkInDate)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Check-out</p>
              <p className="font-semibold text-gray-800">{formatDate(checkOutDate)}</p>
            </div>
          </div>
        </div>

        {/* Guests List Sub-panel */}
        {guests.length > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs space-y-1.5">
            <p className="font-bold text-gray-900 uppercase tracking-wide">Registered Guests</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {guests.map((g, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-md font-medium"
                >
                  {g.name} ({g.gender[0]}, {g.age} yrs) {g.isPrimary && '🔑'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Financials & Action Buttons */}
      <div className="flex flex-col justify-between items-stretch md:items-end text-left md:text-right border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 min-w-[200px]">
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wider">Total Charge</span>
          <div className="flex items-baseline space-x-0.5 justify-start md:justify-end mt-0.5">
            <span className="font-extrabold text-3xl text-gray-900">₹{totalPrice}</span>
            <span className="text-gray-500 text-xs font-semibold">INR</span>
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            for {getDaysCount()} {getDaysCount() === 1 ? 'night' : 'nights'} including vat
          </span>
        </div>

        {/* Rating Section */}
        {(status === 'CONFIRMED' || status === 'COMPLETED') && (
          <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col items-start md:items-end space-y-1">
            {rating ? (
              <>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Your Rating</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`}
                    />
                  ))}
                  <span className="text-[11px] text-gray-700 font-bold ml-1">{rating} / 5</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block">Rate your stay</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={submittingRating}
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition cursor-pointer p-0.5 hover:scale-110 disabled:opacity-50"
                    >
                      <Star
                        className={`w-4.5 h-4.5 transition duration-100 ${
                          star <= (hoverRating || 0)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions based on Status */}
        <div className="flex flex-col gap-2 mt-6 w-full">
          {(status === 'INITIAL' || status === 'PENDING') && onPay && (
            <button
              onClick={() => onPay(id)}
              className="flex items-center justify-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition duration-200 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Complete Payment</span>
            </button>
          )}

          {status !== 'CANCELLED' && onCancel && (
            <button
              onClick={() => onCancel(id)}
              className="flex items-center justify-center space-x-2 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition duration-200 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Reservation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
