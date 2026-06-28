import React, { useState, useMemo } from 'react';
import { useHotels } from '../context/HotelContext';
import SearchBar from '../components/SearchBar';
import HotelCard from '../components/HotelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { SlidersHorizontal, Map, Star, Wifi, Shield, ArrowUpDown, ChevronDown } from 'lucide-react';

const HotelSearch = () => {
  const { hotels, loading, error, searchParams } = useHotels();

  // Filters State
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(12000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('price-asc'); // price-asc, price-desc, rating-desc
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Available amenities matching the seeder
  const amenitiesList = [
    { id: 'WiFi', label: 'Free WiFi' },
    { id: 'Swimming Pool', label: 'Swimming Pool' },
    { id: 'Parking', label: 'Free Parking' },
    { id: 'AC', label: 'Air Conditioning' },
    { id: 'Gym', label: 'Fitness Center' },
    { id: 'Restaurant', label: 'Dining / Restaurant' }
  ];

  // Client-side filtering logic for instant animations
  const filteredHotels = useMemo(() => {
    let result = [...hotels];

    // 1. Filter by price range
    result = result.filter(hotel => {
      const price = hotel.price || (hotel.id % 2 === 0 ? 3200 : 2100);
      return price >= minPrice && price <= maxPrice;
    });

    // 2. Filter by amenities
    if (selectedAmenities.length > 0) {
      result = result.filter(hotel => {
        const hotelAmens = hotel.amenities || [];
        return selectedAmenities.every(amen => 
          hotelAmens.some(ha => ha.toLowerCase().includes(amen.toLowerCase()))
        );
      });
    }

    // 3. Sort results
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating-desc') {
      const getRating = (h) => h.rating || 0;
      result.sort((a, b) => getRating(b) - getRating(a));
    }

    return result;
  }, [hotels, minPrice, maxPrice, selectedAmenities, sortBy]);

  const handleAmenityChange = (amenityId) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId) ? prev.filter(a => a !== amenityId) : [...prev, amenityId]
    );
  };

  const clearFilters = () => {
    setMinPrice(0);
    setMaxPrice(12000);
    setSelectedAmenities([]);
    setSortBy('price-asc');
  };

  return (
    <div className="space-y-8">
      {/* Grid Layout: Left Sidebar Filters (Desktop), Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Filters (Desktop View) */}
        <aside className={`lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6 h-fit sticky top-24 ${
          showMobileFilters ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-extrabold text-gray-950 text-base flex items-center space-x-2">
              <SlidersHorizontal className="w-4.5 h-4.5 text-brand" />
              <span>Filters</span>
            </h3>
            <button 
              onClick={clearFilters}
              className="text-xs text-brand hover:underline font-bold cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide">Price Range (INR)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-1">Min Price</span>
                <input 
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl py-2 px-3 text-xs bg-gray-50 focus:outline-none focus:border-brand font-semibold text-gray-700"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-1">Max Price</span>
                <input 
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl py-2 px-3 text-xs bg-gray-50 focus:outline-none focus:border-brand font-semibold text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Sort By Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide">Sort Results</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-xs bg-gray-50 focus:outline-none focus:border-brand font-semibold text-gray-700 cursor-pointer"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Guest Rating: Highest first</option>
            </select>
          </div>

          {/* Amenities Filters */}
          <div className="space-y-3 border-t border-gray-50 pt-4">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide">Amenities</label>
            <div className="space-y-2">
              {amenitiesList.map((amenity) => (
                <label key={amenity.id} className="flex items-center space-x-2.5 text-xs text-gray-600 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity.id)}
                    onChange={() => handleAmenityChange(amenity.id)}
                    className="w-4.5 h-4.5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  />
                  <span>{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Apply Filters (Mobile drawer confirmation) */}
          <button
            onClick={() => setShowMobileFilters(false)}
            className="w-full bg-gray-950 hover:bg-brand text-white font-extrabold text-xs py-3 rounded-xl transition duration-200 lg:hidden cursor-pointer"
          >
            Apply Filters
          </button>
        </aside>

        {/* Right Column: Search Results Listing (Col-span 3) */}
        <main className="lg:col-span-3 space-y-6">
          {/* Summary and Sorting Details Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-50 rounded-2xl p-4 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-gray-950 tracking-tight margin-0">
                {searchParams.city ? `Stays in ${searchParams.city}` : 'All Available Stays'}
              </h2>
              <p className="text-[11px] text-gray-400 font-bold mt-1">
                {filteredHotels.length} {filteredHotels.length === 1 ? 'property' : 'properties'} showing • Matches for {searchParams.roomsCount || 1} room(s)
              </p>
            </div>

            {/* Quick Actions (Filter toggle, Sorting selection) */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center space-x-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition lg:hidden cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <span>Filters</span>
              </button>
              <div className="flex items-center space-x-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <span>Sorted by Price</span>
              </div>
            </div>
          </div>

          {/* Main Cards Grid */}
          {loading ? (
            <div className="py-24 flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-red-50 border border-red-100 rounded-3xl max-w-2xl mx-auto p-6">
              <p className="text-red-700 font-extrabold text-base">Search failed</p>
              <p className="text-red-500 text-xs mt-1">{error}</p>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl max-w-2xl mx-auto p-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 border border-gray-100">
                <SlidersHorizontal className="w-8 h-8 text-brand/35" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-gray-950">No properties match your filter</h3>
                <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
                  Adjust your price range, select different amenities, or clear your search filters to view stays in this location.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 bg-gray-950 hover:bg-brand text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HotelSearch;
