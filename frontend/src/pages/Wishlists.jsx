import React, { useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import HotelCard from '../components/HotelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Heart, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wishlists = () => {
  const { wishlistHotels, loading, fetchWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  if (loading && wishlistHotels.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 margin-0">Saved Wishlists</h1>
        <p className="text-gray-500 text-sm">Keep track of your favorite properties and plan your next getaway.</p>
      </div>

      {wishlistHotels.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8 max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-red-50 text-brand rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 fill-brand text-brand" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Create your first wishlist</h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
              As you search, click the heart icon on properties you like to save them here for later.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer border-none"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Stays</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlistHotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlists;
