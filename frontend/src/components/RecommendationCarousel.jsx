import React, { useRef } from 'react';
import HotelCard from './HotelCard';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const RecommendationCarousel = ({ title, subtitle, hotels = [] }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="space-y-6 py-6 border-b border-gray-100 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand fill-brand/20 animate-pulse" />
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 margin-0">{title}</h2>
          </div>
          {subtitle && <p className="text-gray-500 text-xs mt-1 margin-0 font-medium">{subtitle}</p>}
        </div>

        {/* Carousel controls */}
        {hotels.length > 3 && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer border-none"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer border-none"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-none snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {hotels.map((hotel) => (
          <div 
            key={hotel.id} 
            className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
          >
            <HotelCard hotel={hotel} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationCarousel;
