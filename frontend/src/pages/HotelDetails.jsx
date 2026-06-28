import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHotels } from '../context/HotelContext';
import { useBookings } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import LoadingSpinner from '../components/LoadingSpinner';
import RecommendationCarousel from '../components/RecommendationCarousel';
import axiosInstance from '../api/axiosInstance';
import { Star, MapPin, Coffee, Shield, Calendar, ArrowRight, ShieldAlert, Award, Sparkles, Phone, Mail, Waves, Wind, Dumbbell, Car, Utensils, Wifi, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useWishlist } from '../context/WishlistContext';

const HotelDetails = () => {
  const { hotelId } = useParams();
  const { getHotelDetails, currentHotel, loading, error, searchParams, setSearchParams } = useHotels();
  const { initializeBooking } = useBookings();
  const { isAuthenticated } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const isWishlisted = wishlistIds.has(parseInt(hotelId));
  const navigate = useNavigate();

  const [similarHotels, setSimilarHotels] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Fetch similar stay recommendations
  useEffect(() => {
    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
        const res = await axiosInstance.get(`/hotels/recommendations/similar/${hotelId}`);
        const data = res.data.data || res.data;
        setSimilarHotels(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch similar properties:', err);
      } finally {
        setSimilarLoading(false);
      }
    };
    if (hotelId) {
      fetchSimilar();
    }
  }, [hotelId]);

  // Search date inputs initialized from global context searchParams
  const [checkIn, setCheckIn] = useState(searchParams.checkInDate || '');
  const [checkOut, setCheckOut] = useState(searchParams.checkOutDate || '');
  const [roomsCount, setRoomsCount] = useState(searchParams.roomsCount || 1);

  // Sync date changes from UI inputs to global search parameters, which automatically triggers fetch
  useEffect(() => {
    if (checkIn && checkOut) {
      setSearchParams(prev => ({
        ...prev,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomsCount: parseInt(roomsCount) || 1
      }));
    }
  }, [checkIn, checkOut, roomsCount]);

  // Fetch hotel details whenever ID or search date boundaries change
  useEffect(() => {
    getHotelDetails(hotelId).catch((err) => {
      console.error('Failed to load hotel details:', err);
    });
  }, [hotelId, searchParams.checkInDate, searchParams.checkOutDate, searchParams.roomsCount]);

  const handleReserveRoom = async (room) => {
    if (!isAuthenticated) {
      toast.info('Please log in to make a reservation.');
      navigate('/login', { state: { from: `/hotels/${hotelId}` } });
      return;
    }

    if (!checkIn || !checkOut) {
      toast.warning('Please select Check-in and Check-out dates first.');
      document.getElementById('date-selector-panel')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    try {
      const bookingData = await initializeBooking({
        hotelId: parseInt(hotelId),
        roomId: room.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomsCount: parseInt(roomsCount) || 1
      });
      const bookingId = bookingData.id || bookingData.bookingId;
      toast.success('Reservation initialized! Proceeding to traveler registration...');
      navigate(`/checkout/${bookingId}`);
    } catch (err) {
      toast.error(err.message || 'Could not initiate booking. Try selecting other dates.');
    }
  };

  if (loading && !currentHotel) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !currentHotel) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto space-y-4">
        <ShieldAlert className="w-16 h-16 text-brand mx-auto" />
        <h3 className="text-xl font-bold text-gray-900">Stay Information Unavailable</h3>
        <p className="text-gray-500 text-sm">{error || 'The requested hotel stay could not be loaded.'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-brand text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md hover:bg-brand-hover transition cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const {
    name,
    city,
    photos = [],
    amenities = [],
    contactInfo,
    rating
  } = currentHotel.hotel || {};

  const ratingValue = typeof rating === 'number' ? rating : 0;

  const rooms = currentHotel.rooms || [];

  // Curated high quality gallery fallbacks
  const fallbackPhotos = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=600&q=80'
  ];

  const mainPhoto = (photos && photos.length > 0) ? photos[0] : fallbackPhotos[0];
  const gridPhotos = (photos && photos.length > 1) ? photos.slice(1, 5) : fallbackPhotos.slice(1, 5);

  const getDaysCount = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
  };

  const getAmenityIcon = (name) => {
    const term = name.toLowerCase();
    if (term.includes('wifi')) return <Wifi className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    if (term.includes('pool') || term.includes('swim')) return <Waves className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    if (term.includes('ac') || term.includes('air') || term.includes('condition')) return <Wind className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    if (term.includes('gym') || term.includes('fitness')) return <Dumbbell className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    if (term.includes('parking') || term.includes('valet')) return <Car className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    if (term.includes('restaurant') || term.includes('dining') || term.includes('food')) return <Utensils className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    return <Coffee className="w-5 h-5 text-gray-400 flex-shrink-0" />;
  };

  const activeRooms = rooms.filter(r => r.price !== null && r.price !== undefined);
  const soldOutRooms = rooms.filter(r => r.price === null || r.price === undefined);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title Header */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 margin-0">{name}</h1>
          <button
            onClick={() => toggleWishlist(parseInt(hotelId))}
            className="flex items-center space-x-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition duration-200 cursor-pointer bg-white"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-brand text-brand' : 'fill-transparent text-gray-500'}`} />
            <span>{isWishlisted ? 'Saved' : 'Save'}</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-bold uppercase tracking-wider">
          {ratingValue > 0 ? (
            <span className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-brand text-brand" />
              <span className="text-gray-950">{ratingValue.toFixed(2)}</span>
              <span className="text-gray-300">·</span>
              <span className="underline cursor-pointer normal-case font-semibold text-gray-500">Verified Reviews</span>
            </span>
          ) : (
            <span className="text-gray-500 font-semibold normal-case">No reviews yet</span>
          )}
          <span className="text-gray-300">|</span>
          <span className="flex items-center space-x-1 cursor-pointer underline font-semibold text-gray-600 normal-case">
            <MapPin className="w-4 h-4 text-brand" />
            <span>{contactInfo?.address || `${city}, India`}</span>
          </span>
        </div>
      </section>

      {/* Modern Photo Grid Layout */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[350px] md:h-[450px] rounded-3xl overflow-hidden shadow-md">
        <div className="md:col-span-2 h-full bg-gray-100 relative group overflow-hidden">
          <img
            src={mainPhoto}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
          />
        </div>
        <div className="hidden md:grid grid-cols-2 col-span-2 gap-4 h-full">
          {gridPhotos.map((photo, idx) => (
            <div key={idx} className="h-[217px] bg-gray-100 relative overflow-hidden group">
              <img
                src={photo}
                alt={`${name} photo ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Sticky Sidebar widget grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Details Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="border-b border-gray-100 pb-6 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-950 text-xl flex items-center space-x-2">
                <span>Hosted by Superhost manager</span>
                <Sparkles className="w-5 h-5 text-brand" />
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">Professional hospitality standards • Verified stays</p>
            </div>
            <Award className="w-12 h-12 text-brand/20 bg-brand/5 p-2.5 rounded-full border border-brand/10" />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-gray-950 text-lg">About this stay</h4>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              Experience the best of {city} at {name}. Ideal for leisure and corporate visitors, this retreat features premium accommodations, high fidelity internet connection, and round-the-clock room concierge service.
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h4 className="font-extrabold text-gray-950 text-lg">What this stay offers</h4>
            <div className="grid grid-cols-2 gap-4">
              {amenities.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-sm text-gray-700 font-medium">
                  {getAmenityIcon(item)}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details & Dynamic Interactive Map */}
          {contactInfo && (
            <div className="border-t border-gray-100 pt-6 space-y-6">
              <div className="space-y-4">
                <h4 className="font-extrabold text-gray-950 text-lg">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{contactInfo.phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{contactInfo.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-extrabold text-gray-950 text-lg">Location & Area Map</h4>
                <div className="rounded-3xl overflow-hidden shadow-md border border-gray-150 h-[300px] bg-gray-100 relative">
                  <iframe
                    title="dynamic-hotel-map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(contactInfo?.address || `${name}, ${city}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                    className="absolute inset-0"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  <span>{contactInfo?.address || `${city}, India`}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Date Selector Reservation widget */}
        <div className="lg:col-span-1">
          <div
            id="date-selector-panel"
            className="sticky top-24 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-6"
          >
            <div>
              <span className="font-extrabold text-gray-950 text-2xl">
                ₹{activeRooms[0]?.price ? Math.round(activeRooms[0].price) : 120}
              </span>
              <span className="text-gray-500 text-xs font-bold uppercase block mt-1">Starting price per night</span>
            </div>

            <hr className="border-gray-100" />

            {/* Date picking forms */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl py-2.5 px-3 text-xs bg-white focus:outline-none focus:border-brand font-semibold text-gray-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl py-2.5 px-3 text-xs bg-white focus:outline-none focus:border-brand font-semibold text-gray-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">Rooms Count</label>
                <select
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl py-2.5 px-3 text-xs bg-white focus:outline-none focus:border-brand font-semibold text-gray-700 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Room' : 'Rooms'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-xs text-gray-600 leading-relaxed">
              <div className="flex items-center space-x-2 text-brand font-bold">
                <Shield className="w-4 h-4" />
                <span>Verified Stay Guarantee</span>
              </div>
              <p>Dates selected update pricing and room availability in real-time. Choose dates to proceed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Rooms Section */}
      <section className="border-t border-gray-100 pt-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-950 tracking-tight margin-0">Select Room Category</h3>
            <p className="text-gray-500 text-sm mt-1 mb-0">Choose from the available room tiers below. Prices are dynamically calculated based on your date range.</p>
          </div>
          {checkIn && checkOut && (
            <div className="bg-brand/5 border border-brand/10 text-brand px-4 py-2 rounded-2xl flex items-center space-x-2 text-xs font-bold w-fit self-start sm:self-center">
              <Calendar className="w-4 h-4 text-brand" />
              <span>Available Stay: {checkIn} to {checkOut} ({getDaysCount()} {getDaysCount() === 1 ? 'Night' : 'Nights'})</span>
            </div>
          )}
        </div>

        {/* Display Rooms Grid */}
        <div className="space-y-6">
          {rooms.length === 0 ? (
            <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400">
              Please enter valid check-in and check-out dates to query room inventory.
            </div>
          ) : (
            <>
              {/* Active Available Rooms */}
              {activeRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onReserve={handleReserveRoom}
                />
              ))}

              {/* Sold Out Rooms */}
              {soldOutRooms.map((room) => (
                <div key={room.id} className="opacity-60 grayscale">
                  <RoomCard
                    key={room.id}
                    room={{
                      ...room,
                      price: 'N/A'
                    }}
                    onReserve={() => {}}
                    isAdminView={false}
                  />
                  <div className="bg-red-50 text-red-700 font-extrabold text-xs px-4 py-2 rounded-b-2xl border border-t-0 border-red-100 flex items-center justify-between">
                    <span>Sold Out / Unavailable for selected dates</span>
                    <span className="uppercase tracking-wider">Dates unavailable</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Similar Stays Recommendations */}
      {!similarLoading && similarHotels.length > 0 && (
        <RecommendationCarousel
          title="Similar Stays You May Like"
          subtitle="Explore other properties matching similar categories and price points in the same city."
          hotels={similarHotels}
        />
      )}
    </div>
  );
};

export default HotelDetails;
