import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookings } from '../context/BookingContext';
import axiosInstance from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { Calendar, Users, Home, CreditCard, ShieldCheck, UserPlus, Info, Check, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const Checkout = () => {
  const { bookingId } = useParams();
  const { currentBooking, getBookingStatus, addGuestsToBooking, initiatePayment, selectCashPaymentMethod, loading: bookingLoading } = useBookings();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [localLoading, setLocalLoading] = useState(false);
  const [savedGuests, setSavedGuests] = useState([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // stripe or cash
  const [hasActiveCash, setHasActiveCash] = useState(false);

  // Companion form for direct registry
  const [showAddGuestForm, setShowAddGuestForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', age: '', gender: 'MALE', isPrimary: false }
  });

  const loadBookingAndGuests = async () => {
    setLocalLoading(true);
    try {
      // 1. Fetch current initialized booking details
      const booking = await getBookingStatus(bookingId);
      if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        toast.info('This booking is already paid and completed!');
        navigate(`/booking-status/${bookingId}`);
        return;
      }
      if (booking.status === 'CANCELLED') {
        toast.error('This booking was cancelled.');
        navigate('/my-bookings');
        return;
      }

      // 2. Fetch saved guests
      const response = await axiosInstance.get('/users/guests');
      const guestsData = response.data.data || response.data;
      const guestsList = Array.isArray(guestsData) ? guestsData : [];
      setSavedGuests(guestsList);

      // Auto-select primary guest if available
      const primaryGuest = guestsList.find(g => g.isPrimary);
      if (primaryGuest) {
        setSelectedGuestIds([primaryGuest.id]);
      }

      // Fetch active cash reservation checks
      try {
        const cashCheck = await axiosInstance.get('/bookings/has-active-cash');
        const hasCash = typeof cashCheck.data.data === 'boolean' ? cashCheck.data.data : !!cashCheck.data;
        setHasActiveCash(hasCash);
      } catch (err) {
        console.warn("Failed to check active cash reservations:", err);
      }
    } catch (err) {
      toast.error('Failed to load reservation checkout.');
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    loadBookingAndGuests();
  }, [bookingId]);

  const toggleSelectGuest = (id) => {
    setSelectedGuestIds(prev =>
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  const handleCreateGuest = async (data) => {
    try {
      const payload = {
        name: data.name,
        age: parseInt(data.age),
        gender: data.gender,
        isPrimary: data.isPrimary
      };
      const response = await axiosInstance.post('/users/guests', payload);
      const newGuest = response.data.data || response.data;
      toast.success('Traveler registered successfully!');
      
      // Reset companion form and refresh traveler options
      reset();
      setShowAddGuestForm(false);
      
      const refreshRes = await axiosInstance.get('/users/guests');
      const updatedList = Array.isArray(refreshRes.data.data) ? refreshRes.data.data : refreshRes.data;
      setSavedGuests(updatedList);
      
      // Auto select the newly created companion
      if (newGuest?.id) {
        setSelectedGuestIds(prev => [...prev, newGuest.id]);
      } else {
        loadBookingAndGuests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register companion.');
    }
  };

  const submitGuestsRoster = async () => {
    if (selectedGuestIds.length === 0) {
      toast.warning('Please select at least one traveler for this stay.');
      return;
    }

    setLocalLoading(true);
    try {
      await addGuestsToBooking(bookingId, selectedGuestIds);
      toast.success('Travelers roster linked successfully!');
      setStep(2); // Progress to checkout summary & pay
    } catch (err) {
      toast.error(err.message || 'Could not link guest roster.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCompleteBooking = async () => {
    setLocalLoading(true);
    try {
      if (paymentMethod === 'stripe') {
        toast.info('Initializing Stripe Checkout redirect...', { autoClose: 2000 });
        await initiatePayment(bookingId);
      } else {
        toast.info('Processing Pay at Property cash booking...', { autoClose: 2500 });
        await selectCashPaymentMethod(bookingId);
        toast.success('Stays reservation placed successfully pending cash check-in!');
        navigate(`/booking-status/${bookingId}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete reservation booking.');
      setLocalLoading(false);
    }
  };

  if (bookingLoading || localLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-500 text-sm font-semibold">Processing transaction details...</p>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto space-y-4">
        <Info className="w-16 h-16 text-brand mx-auto" />
        <h3 className="text-xl font-bold text-gray-900">Reservation Checkout Error</h3>
        <p className="text-gray-500 text-sm">We couldn't retrieve the checkout workspace for this reservation.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-brand text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  const {
    hotelName = 'Luxury Retreat Resort',
    roomType = 'Deluxe Suite',
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

  const getDaysCount = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Left Columns - Booking Steps Wizard (Col-span 2) */}
      <div className="lg:col-span-2 space-y-8">
        {/* Wizard Steps Header */}
        <div className="flex items-center space-x-4 border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700'
            }`}>1</span>
            <span className="font-extrabold text-sm text-gray-900">Travelers Roster</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div className="flex items-center space-x-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700'
            }`}>2</span>
            <span className="font-extrabold text-sm text-gray-900">Payment & Secure</span>
          </div>
        </div>

        {/* STEP 1: Traveler Registration */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Select Travelers</h2>
              <p className="text-gray-500 text-sm">Select who will be staying during this trip, or register a new companion profile below.</p>
            </div>

            {/* Traveler selection grid */}
            {savedGuests.length === 0 ? (
              <div className="p-8 border border-dashed border-gray-300 rounded-2xl text-center space-y-3">
                <Info className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-gray-700 text-sm font-bold">No traveler profiles registered yet</p>
                <p className="text-gray-400 text-xs">Fill out the quick traveler form below to create your primary profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedGuests.map((g) => {
                  const isChecked = selectedGuestIds.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleSelectGuest(g.id)}
                      className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition ${
                        isChecked ? 'border-brand bg-brand/5 ring-1 ring-brand/10' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-gray-900">{g.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                          {g.gender} • {g.age} yrs {g.isPrimary && '🔑 (Primary)'}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isChecked ? 'bg-brand border-brand text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Companion Registry Toggle */}
            <div className="border-t border-gray-200 pt-6">
              {!showAddGuestForm ? (
                <button
                  onClick={() => setShowAddGuestForm(true)}
                  className="flex items-center space-x-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-gray-500" />
                  <span>Register Companion Traveler</span>
                </button>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-gray-900 text-sm">Register Companion Roster</h4>
                  <form onSubmit={handleSubmit(handleCreateGuest)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Companion Name</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        {...register('name', { required: 'Name is required' })}
                        className="w-full border border-gray-300 bg-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Age</label>
                      <input
                        type="number"
                        placeholder="Age"
                        {...register('age', { required: 'Age is required' })}
                        className="w-full border border-gray-300 bg-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Gender</label>
                      <select
                        {...register('gender')}
                        className="w-full border border-gray-300 bg-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddGuestForm(false)}
                        className="text-xs text-gray-500 hover:underline font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-gray-900 hover:bg-brand text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                      >
                        Save Traveler
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Step Continue Button */}
            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={submitGuestsRoster}
                className="flex items-center space-x-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <span>Save Travelers & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Secure Payment */}
        {step === 2 && (
           <div className="space-y-6">
             <div>
               <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Confirm & Securely Pay</h2>
               <p className="text-gray-500 text-sm">Please select your payment option and review the traveler list below.</p>
             </div>

             {/* Payment Method Selector */}
             <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
               <h3 className="font-extrabold text-gray-900 text-base border-b border-gray-100 pb-3">Select Payment Option</h3>
               <div className="space-y-3">
                 {/* Stripe radio card */}
                 <label className={`flex items-start p-4 border rounded-2xl cursor-pointer transition ${
                   paymentMethod === 'stripe' ? 'border-brand bg-brand/5 ring-1 ring-brand/10' : 'border-gray-200 hover:bg-gray-50'
                 }`}>
                   <input
                     type="radio"
                     name="paymentMethod"
                     value="stripe"
                     checked={paymentMethod === 'stripe'}
                     onChange={() => setPaymentMethod('stripe')}
                     className="w-4.5 h-4.5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer mt-0.5"
                   />
                   <div className="ml-3">
                     <span className="font-bold text-sm text-gray-900 block">Stripe Online Card Payment</span>
                     <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Pay securely now using credit or debit cards via Stripe sandbox.</span>
                   </div>
                 </label>

                 {/* Cash radio card */}
                 <label className={`flex items-start p-4 border rounded-2xl transition ${
                   hasActiveCash 
                     ? 'opacity-65 bg-gray-50 border-gray-150 cursor-not-allowed' 
                     : (paymentMethod === 'cash' ? 'border-brand bg-brand/5 ring-1 ring-brand/10 cursor-pointer' : 'border-gray-200 hover:bg-gray-50 cursor-pointer')
                 }`}>
                   <input
                     type="radio"
                     name="paymentMethod"
                     value="cash"
                     checked={paymentMethod === 'cash'}
                     disabled={hasActiveCash}
                     onChange={() => setPaymentMethod('cash')}
                     className="w-4.5 h-4.5 rounded border-gray-300 text-brand focus:ring-brand mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                   />
                   <div className="ml-3">
                     <span className="font-bold text-sm text-gray-900 block">Pay at Property (Cash on Arrival)</span>
                     <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Pay directly in cash to the hotel manager upon checking in.</span>
                     {hasActiveCash && (
                       <span className="inline-flex items-center space-x-1 mt-2 text-[9px] font-extrabold text-brand bg-brand/5 border border-brand/10 px-2 py-0.5 rounded uppercase tracking-wider">
                         ⚠️ Locked: You have a pending cash reservation elsewhere.
                       </span>
                     )}
                   </div>
                 </label>
               </div>
             </div>

             <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
               <h3 className="font-extrabold text-gray-900 text-base border-b border-gray-100 pb-3">Traveler Companion List</h3>
               <div className="divide-y divide-gray-100">
                 {currentBooking.guests?.map((g, idx) => (
                   <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                     <span className="font-bold text-gray-900">{g.name}</span>
                     <span className="text-gray-400 font-semibold uppercase text-xs">{g.gender} • {g.age} yrs</span>
                   </div>
                 ))}
               </div>
             </div>

             {/* Back to Step 1 or Unified confirm handler */}
             <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
               <button
                 onClick={() => setStep(1)}
                 className="text-xs text-gray-500 hover:underline font-bold"
               >
                 Go Back to Travelers
               </button>
               
               <button
                 onClick={handleCompleteBooking}
                 className="flex items-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold text-sm px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
               >
                 <CreditCard className="w-4 h-4" />
                 <span>{paymentMethod === 'stripe' ? 'Confirm & Pay with Stripe' : 'Confirm Cash Booking'}</span>
               </button>
             </div>
           </div>
         )}
      </div>

      {/* Right Column - Booking Summary Sticky Block (Col-span 1) */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg border-b border-gray-100 pb-3">Stay Summary</h3>
            <div className="space-y-4 mt-4">
              <div className="flex items-start space-x-3">
                <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm leading-snug">{hotelName}</h4>
                  <p className="text-gray-500 text-xs mt-0.5">{roomType} Room</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold">{formatDate(checkInDate)}</p>
                  <p className="text-gray-400 mt-0.5">to {formatDate(checkOutDate)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-gray-700">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold">{getDaysCount()} {getDaysCount() === 1 ? 'Night' : 'Nights'}</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Pricing detail items */}
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Room charges</span>
              <span className="font-bold text-gray-900">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fees & taxes</span>
              <span className="text-green-600 font-bold">FREE</span>
            </div>
            <hr className="border-gray-100 my-2" />
            <div className="flex justify-between items-baseline text-sm">
              <span className="font-extrabold text-gray-900">Total Price</span>
              <span className="font-extrabold text-brand text-lg">₹{totalPrice}</span>
            </div>
          </div>

          {/* Security stamp */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-green-800 leading-relaxed">
              <p className="font-bold">Stripe Encrypted Channel</p>
              <p className="mt-0.5 text-green-700">All data connections are handled using enterprise SSL layers. We never store credit cards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
