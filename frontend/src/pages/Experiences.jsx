import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';
import { Star, SlidersHorizontal, Clock, MapPin, Video, ArrowUpDown, Compass, Shield, Heart, Globe, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Activities', icon: '✨' },
  { id: 'culinary', label: 'Culinary Arts', icon: '🍳' },
  { id: 'adventure', label: 'Outdoor Adventure', icon: '⛰️' },
  { id: 'entertainment', label: 'Entertainment & Magic', icon: '🎬' },
  { id: 'wellness', label: 'Wellness & Health', icon: '🧘' },
  { id: 'sightseeing', label: 'Sightseeing & Walks', icon: '📸' }
];

const getExperienceCategory = (title) => {
  const t = title.toLowerCase();
  if (t.includes('cook') || t.includes('food') || t.includes('pasta') || t.includes('beer') || t.includes('brewery') || t.includes('taste')) {
    return 'culinary';
  }
  if (t.includes('scuba') || t.includes('reef') || t.includes('dive') || t.includes('climb')) {
    return 'adventure';
  }
  if (t.includes('bollywood') || t.includes('dance') || t.includes('magic') || t.includes('illusion') || t.includes('show')) {
    return 'entertainment';
  }
  if (t.includes('yoga') || t.includes('meditation') || t.includes('yogi') || t.includes('wellness')) {
    return 'wellness';
  }
  if (t.includes('photography') || t.includes('walk') || t.includes('heritage') || t.includes('fort')) {
    return 'sightseeing';
  }
  return 'sightseeing'; // default fallback
};

const getCategoryBadgeColor = (cat) => {
  switch (cat) {
    case 'culinary': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'adventure': return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'entertainment': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'wellness': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'sightseeing': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-gray-55 text-gray-700 border-gray-200';
  }
};

const Experiences = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const city = searchParams.get('city') || '';
  const date = searchParams.get('date') || '';
  const guestsCount = searchParams.get('guestsCount') || '1';
  const isOnlineParam = searchParams.get('isOnline');
  const isOnline = isOnlineParam === 'true' ? true : (isOnlineParam === 'false' ? false : null);

  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(6000);
  const [sortBy, setSortBy] = useState('rating-desc'); // price-asc, price-desc, rating-desc
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleFilter = (type) => {
    const newParams = new URLSearchParams(searchParams);
    if (type === 'all') {
      newParams.delete('isOnline');
    } else {
      newParams.set('isOnline', type);
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/experiences', {
          params: {
            city: isOnline === true ? '' : city,
            isOnline: isOnline === null ? undefined : isOnline
          }
        });
        const data = response.data.data || response.data;
        setExperiences(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load experiences:', err);
        setError(err.response?.data?.message || 'Failed to fetch experiences. Please try again.');
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [city, isOnline]);

  // Client-side filtering logic
  const filteredExperiences = useMemo(() => {
    let result = [...experiences];

    // Filter by price
    result = result.filter(exp => exp.price >= minPrice && exp.price <= maxPrice);

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(exp => getExperienceCategory(exp.title) === selectedCategory);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [experiences, minPrice, maxPrice, selectedCategory, sortBy]);

  const clearFilters = () => {
    setMinPrice(0);
    setMaxPrice(6000);
    setSortBy('rating-desc');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-950 via-slate-900 to-rose-950 text-white py-16 px-8 md:px-16 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/15 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-secondary/10 rounded-full blur-3xl -ml-20 -mb-20" />
        
        <div className="relative max-w-4xl space-y-4">
          <span className="inline-flex items-center space-x-1.5 bg-brand/15 border border-brand/35 px-3.5 py-1 rounded-full text-brand text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Unforgettable Hosts & Local Guides</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none text-white margin-0">
            {isOnline === true 
              ? 'Online Virtual Experiences' 
              : (isOnline === false 
                ? `In-Person Experiences in ${city || 'Everywhere'}` 
                : `All Experiences in ${city || 'Everywhere'}`
              )
            }
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
            {isOnline === true 
              ? 'Join interactive, live video-session classes and workshops led by expert hosts globally, right from your home.'
              : (isOnline === false
                ? `Explore unique, hand-crafted local tours and activities. Make memories in ${city || 'any city'} with expert guides.`
                : 'Discover a world of unique host-led activities, from hand-crafted local tours to interactive virtual workshops.'
              )
            }
          </p>

          {/* Banner Stats Row */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-white/10 mt-6 max-w-xl">
            <div>
              <span className="block text-xl font-extrabold text-brand">100%</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Verified Local Experts</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-brand">Small Groups</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Highly Interactive</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-xl font-extrabold text-brand">Zero Hassle</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Secure Stripe Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Filter Bars (Types & Categories) */}
      <div className="space-y-4 bg-white border border-gray-100 rounded-3xl p-5 shadow-xs">
        {/* Toggle Pills (All, In-Person, Online) */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Format:</span>
          <button
            onClick={() => toggleFilter('all')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
              isOnline === null
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🧭 All Formats
          </button>
          <button
            onClick={() => toggleFilter('false')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
              isOnline === false
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            📍 In-Person
          </button>
          <button
            onClick={() => toggleFilter('true')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
              isOnline === true
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            💻 Online Virtual
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* Categories Selector */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex-shrink-0">Category:</span>
          <div className="flex items-center space-x-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all duration-250 cursor-pointer flex-shrink-0 flex items-center space-x-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Filters, Right Results */}
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
              className="text-xs text-brand hover:underline font-bold cursor-pointer bg-transparent border-none"
            >
              Clear All
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide">Price Range (INR)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold mb-1">Min Price</span>
                <input 
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl py-2 px-3 text-xs bg-gray-50 focus:outline-none focus:border-brand font-semibold text-gray-700"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold mb-1">Max Price</span>
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
              <option value="rating-desc">Guest Rating: Highest first</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* Apply Filters (Mobile drawer confirmation) */}
          <button
            onClick={() => setShowMobileFilters(false)}
            className="w-full bg-gray-950 hover:bg-brand text-white font-extrabold text-xs py-3 rounded-xl transition duration-200 lg:hidden cursor-pointer"
          >
            Apply Filters
          </button>
        </aside>

        {/* Right Column: Experience Cards Grid (Col-span 3) */}
        <main className="lg:col-span-3 space-y-6">
          {/* Summary and Sorting Details Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-50 rounded-2xl p-4 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-gray-950 tracking-tight margin-0">
                {isOnline ? 'Virtual Workshops' : `Activities in ${city || 'Everywhere'}`}
              </h2>
              <p className="text-[11px] text-gray-400 font-bold mt-1">
                {filteredExperiences.length} {filteredExperiences.length === 1 ? 'experience' : 'experiences'} showing • {guestsCount} guest spot(s) selected
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
                <span>Sorted by Rating</span>
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
          ) : filteredExperiences.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl max-w-2xl mx-auto p-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 border border-gray-100">
                <SlidersHorizontal className="w-8 h-8 text-brand/35" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-gray-950">No experiences match your filter</h3>
                <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
                  Adjust your price range, change categories, or clear your search filters to view experiences.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 bg-gray-950 hover:bg-brand text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((exp) => {
                const category = getExperienceCategory(exp.title);
                const categoryLabel = CATEGORIES.find(c => c.id === category)?.label || 'Activity';
                const badgeColor = getCategoryBadgeColor(category);

                return (
                  <div 
                    key={exp.id}
                    onClick={() => navigate(`/experiences/${exp.id}?date=${date}&guestsCount=${guestsCount}`)}
                    className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-pointer flex flex-col h-full hover:-translate-y-0.5"
                  >
                    {/* Photo Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-150">
                      <img 
                        src={exp.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'} 
                        alt={exp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {exp.isOnline && (
                        <span className="absolute top-4 left-4 bg-brand text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                          <Video className="w-3 h-3" />
                          <span>Live Video call</span>
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        {/* Rating, Category Badge & Location */}
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={`px-2 py-0.5 rounded border text-[9px] uppercase tracking-wide ${badgeColor}`}>
                            {categoryLabel}
                          </span>
                          {exp.rating && (
                            <div className="flex items-center text-gray-900 space-x-0.5">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{exp.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-extrabold text-gray-950 text-sm leading-snug group-hover:text-brand transition duration-150 line-clamp-2">
                          {exp.title}
                        </h3>

                        <div className="flex items-center space-x-1 text-[11px] text-gray-400 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-gray-450" />
                          <span>{exp.isOnline ? 'Online via Zoom' : exp.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-xs">
                        {/* Duration & Languages */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-gray-500 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{exp.duration || '2 hours'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-400 text-[10px] font-bold">
                            <Globe className="w-3 h-3 text-gray-400" />
                            <span>English, Hindi</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-gray-400 text-[10px] block font-bold mb-0.5">Price</span>
                          <span className="font-extrabold text-gray-900 text-sm">₹{exp.price}</span>
                          <span className="text-[10px] text-gray-400 font-semibold block">/ guest</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Experiences;
