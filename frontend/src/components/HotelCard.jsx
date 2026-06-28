import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, Wifi, Coffee, Sparkles, Building, Tv, Shield } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

const HotelCard = ({ hotel }) => {
  const {
    id,
    name,
    city,
    photos,
    amenities = [],
    price,
    rating
  } = hotel;

  const ratingValue = typeof rating === 'number' ? rating : 0;

  const { wishlistIds, toggleWishlist } = useWishlist();
  const isWishlisted = wishlistIds.has(id);

  const fallbackPhotos = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=600&q=80'
  ];

  const hotelImage = (photos && photos.length > 0) ? photos[0] : fallbackPhotos[id % fallbackPhotos.length];

  // Render icons for some key amenities
  const getAmenityIcon = (name) => {
    const term = name.toLowerCase();
    if (term.includes('wifi')) return <Wifi className="w-3 h-3 text-gray-400" />;
    if (term.includes('pool')) return <span className="text-[10px]">🏊</span>;
    if (term.includes('ac') || term.includes('air')) return <span className="text-[10px]">❄️</span>;
    if (term.includes('food') || term.includes('breakfast') || term.includes('restaurant')) return <Coffee className="w-3 h-3 text-gray-400" />;
    return null;
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 relative">
      {/* Favorite Button Overlay */}
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(id);
        }}
        className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md hover:bg-white flex items-center justify-center shadow-md transition duration-200 cursor-pointer border-none"
      >
        <Heart className={`w-4.5 h-4.5 transition-colors ${isWishlisted ? 'fill-brand text-brand' : 'fill-transparent text-gray-500 group-hover:fill-brand/10'}`} />
      </button>

      {/* Hotel Photo Section */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-50">
        <img
          src={hotelImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
        {/* Rating Overlay */}
        {ratingValue > 0 && (
          <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1 text-[11px] font-extrabold text-gray-900">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{ratingValue.toFixed(2)}</span>
          </div>
        )}

        {/* Free Cancellation Badge */}
        <div className="absolute bottom-3.5 left-3.5 bg-brand-secondary/90 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-md">
          Verified Guest Favorite
        </div>
      </div>

      {/* Details Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Location & Tags */}
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{city}</span>
            </div>
            {price && (
              <span className="text-brand font-extrabold normal-case bg-brand/5 px-2 py-0.5 rounded-full">
                Active Stay
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-gray-950 text-base group-hover:text-brand transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Amenities grid tags */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {amenities.slice(0, 3).map((item, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center space-x-1 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-500"
                >
                  {getAmenityIcon(item)}
                  <span>{item}</span>
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-400">
                  +{amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average stay</span>
            <div className="flex items-baseline space-x-0.5">
              <span className="font-extrabold text-gray-950 text-lg">
                ₹{price ? Math.round(price) : (id % 2 === 0 ? 3200 : 2100)}
              </span>
              <span className="text-gray-400 text-xs font-semibold">/ night</span>
            </div>
          </div>

          <Link
            to={`/hotels/${id}`}
            className="flex items-center space-x-1 bg-gray-900 group-hover:bg-brand text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all duration-300"
          >
            <span>View Stay</span>
            <span className="transition-transform group-hover:translate-x-0.5 duration-200">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
