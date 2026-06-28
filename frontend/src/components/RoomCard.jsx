import React from 'react';
import { Users, Wifi, Tv, Wind, Coffee, Bed, ArrowRight, ShieldCheck, Trash2, Edit } from 'lucide-react';

const RoomCard = ({ room, onReserve, isAdminView = false, onEdit, onDelete }) => {
  const {
    id,
    type, // Standard, Deluxe, Suite, etc.
    price,
    capacity = 2,
    amenities = ['Free WiFi', 'Air Conditioning', 'Flat-screen TV'],
    description = 'Spacious, elegant room featuring high-grade furnishings, premium mattress bedding, and custom bathroom fixtures.',
    basePrice,
    surgeFactor,
    pricingLabel
  } = room;

  // Map standard amenities to icon representations
  const getAmenityIcon = (name) => {
    const term = name.toLowerCase();
    if (term.includes('wifi') || term.includes('internet')) return <Wifi className="w-4 h-4" />;
    if (term.includes('tv') || term.includes('screen')) return <Tv className="w-4 h-4" />;
    if (term.includes('ac') || term.includes('air')) return <Wind className="w-4 h-4" />;
    if (term.includes('coffee') || term.includes('breakfast')) return <Coffee className="w-4 h-4" />;
    return <Bed className="w-4 h-4" />;
  };

  // Curated room photo based on room ID
  const roomPhotos = [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80'
  ];

  const roomImage = (room.photos && room.photos.length > 0) ? room.photos[0] : roomPhotos[id % roomPhotos.length];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Room Photo */}
      <div className="relative h-48 md:h-full w-full bg-gray-100 min-h-[180px]">
        <img
          src={roomImage}
          alt={type}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Bed className="w-3.5 h-3.5" />
          <span>{type}</span>
        </div>
      </div>

      {/* Room Content */}
      <div className="p-6 md:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xl font-bold text-gray-900">{type} Room</h4>
              {pricingLabel && (
                <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider mt-1.5 ${
                  pricingLabel === 'High Demand' 
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : pricingLabel === 'Limited Rooms Left'
                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : 'bg-brand/10 text-brand border border-brand/20'
                }`}>
                  🔥 {pricingLabel}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-baseline space-x-0.5 justify-end">
                <span className="font-extrabold text-2xl text-brand">
                  {price === 'N/A' ? 'N/A' : `₹${Math.round(price)}`}
                </span>
                {price !== 'N/A' && <span className="text-gray-500 text-xs font-medium">/ night</span>}
              </div>
              {basePrice && price !== 'N/A' && Math.round(price) > Math.round(basePrice) && (
                <span className="text-[10px] text-gray-400 line-through block mt-0.5">
                  was ₹{Math.round(basePrice)}
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-2 leading-relaxed">{description}</p>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-6 mt-4">
            <div className="flex items-center space-x-1.5 text-xs text-gray-700 font-semibold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Users className="w-4 h-4 text-gray-400" />
              <span>Fits up to {capacity} {capacity === 1 ? 'Guest' : 'Guests'}</span>
            </div>
            
            <div className="flex items-center space-x-1.5 text-xs text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>Free Cancellation</span>
            </div>
          </div>

          {/* Amenities tags */}
          <div className="mt-5">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5">Room Amenities</p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, idx) => (
                <span
                  key={idx}
                  className="flex items-center space-x-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md"
                >
                  {getAmenityIcon(amenity)}
                  <span>{amenity}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-100 pt-4 mt-6 flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Includes all local taxes and service fees</span>

          {isAdminView ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onEdit(room)}
                className="flex items-center space-x-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition duration-200"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Room</span>
              </button>
              <button
                onClick={() => onDelete(room.id)}
                className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (price !== 'N/A') {
                  onReserve(room);
                }
              }}
              disabled={price === 'N/A'}
              className={`flex items-center space-x-2 font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition duration-200 ${
                price === 'N/A'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-brand hover:bg-brand-hover text-white cursor-pointer hover:shadow-lg'
              }`}
            >
              <span>{price === 'N/A' ? 'Sold Out' : 'Reserve Room'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
