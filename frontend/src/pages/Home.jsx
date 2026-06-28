import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotels } from '../context/HotelContext';
import SearchBar from '../components/SearchBar';
import HotelCard from '../components/HotelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import RecommendationCarousel from '../components/RecommendationCarousel';
import { Sparkles, MapPin, Compass, Shield, Heart, Star, Video } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const Home = () => {
  const { hotels, loading, error, searchHotels, setSearchParams } = useHotels();
  const navigate = useNavigate();
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [featuredExperiences, setFeaturedExperiences] = useState([]);
  const [experiencesLoading, setExperiencesLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Load Delhi hotels by default as featured on mount & fetch featured experiences & recommendations
  useEffect(() => {
    if (hotels.length === 0) {
      searchHotels({ city: 'Delhi' });
    }
    
    const fetchFeaturedExperiences = async () => {
      setExperiencesLoading(true);
      try {
        const response = await axiosInstance.get('/experiences');
        const data = response.data.data || response.data;
        // Show first 3 seeded experiences as featured
        setFeaturedExperiences(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch (err) {
        console.error('Failed to load featured experiences:', err);
      } finally {
        setExperiencesLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      setRecLoading(true);
      try {
        const response = await axiosInstance.get('/hotels/recommendations/personalized');
        const data = response.data.data || response.data;
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setRecLoading(false);
      }
    };

    fetchFeaturedExperiences();
    fetchRecommendations();
  }, []);

  const handleSearchSubmit = () => {
    navigate('/search');
  };

  const handleCityClick = (cityName) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const params = {
      city: cityName,
      checkInDate: today,
      checkOutDate: tomorrowStr,
      roomsCount: 1,
      guestsCount: 1
    };

    setSearchParams(params);
    searchHotels(params);
    navigate('/search');
  };

  const locations = [
    { name: 'Andhra Pradesh', tag: 'Coastal Gateway', description: 'Vibrant beaches and ancient temple heritage.', image: 'https://images.unsplash.com/photo-1608958220963-f8f5337b55f4?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-teal-600' },
    { name: 'Arunachal Pradesh', tag: 'Dawn-Lit Peaks', description: 'Monasteries and misty mountains.', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-orange-600' },
    { name: 'Assam', tag: 'Tea Capital', description: 'Lush tea plantations and wildlife reserves.', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-emerald-600' },
    { name: 'Bihar', tag: 'Enlightened Land', description: 'Historical ruins and spiritual sites.', image: 'https://images.unsplash.com/photo-1599661046289-e318878567c4?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-indigo-600' },
    { name: 'Chhattisgarh', tag: 'Tribal Heartlands', description: 'Waterfalls and rich temple architecture.', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-purple-600' },
    { name: 'Goa', tag: 'Beach Haven', description: 'Sun, sand, and historic colonial retreats.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-brand' },
    { name: 'Gujarat', tag: 'Royal Heritage', description: 'Salt deserts and grand palace architecture.', image: 'https://images.unsplash.com/photo-1596494819308-9c10f5e19b45?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-amber-600' },
    { name: 'Haryana', tag: 'Historic Gateway', description: 'Modern hubs and ancient battlegrounds.', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-blue-600' },
    { name: 'Himachal Pradesh', tag: 'Snowy Peaks', description: 'Scenic hill stations and adventure trails.', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-sky-600' },
    { name: 'Jharkhand', tag: 'Forest Sanctuary', description: 'Waterfalls and rich natural biodiversity.', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-green-600' },
    { name: 'Karnataka', tag: 'Heritage Tech Hub', description: 'Ancient ruins and thriving city parks.', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-pink-600' },
    { name: 'Kerala', tag: 'God\'s Own Country', description: 'Serene backwaters and lush tea gardens.', image: 'https://images.unsplash.com/photo-1570168007244-23704139443d?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-rose-600' },
    { name: 'Madhya Pradesh', tag: 'Heart of India', description: 'Tiger reserves and monumental temples.', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-violet-600' },
    { name: 'Maharashtra', tag: 'Gateway Metropolis', description: 'Harbor skylines and scenic hill stations.', image: 'https://images.unsplash.com/photo-1596494819308-9c10f5e19b45?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-red-600' },
    { name: 'Manipur', tag: 'Jeweled Land', description: 'Floating lakes and rich cultural arts.', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-fuchsia-600' },
    { name: 'Meghalaya', tag: 'Abode of Clouds', description: 'Root bridges and rain-washed hills.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-cyan-600' },
    { name: 'Mizoram', tag: 'Blue Mountains', description: 'Scenic peaks and bamboo forests.', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-yellow-600' },
    { name: 'Nagaland', tag: 'Festive Hills', description: 'Hornbill festival and rich tribal legacy.', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-lime-600' },
    { name: 'Odisha', tag: 'Temple Heritage', description: 'Ancient temples and sun-kissed beaches.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-emerald-700' },
    { name: 'Punjab', tag: 'Golden Fields', description: 'Golden Temple and rich harvest culture.', image: 'https://images.unsplash.com/photo-1596494819308-9c10f5e19b45?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-amber-700' },
    { name: 'Rajasthan', tag: 'Desert Majesty', description: 'Forts, palaces, and sand dunes.', image: 'https://images.unsplash.com/photo-1477584322811-53475141e180?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-rose-700' },
    { name: 'Sikkim', tag: 'Himalayan Ridge', description: 'Glacial lakes and snowy mountain peaks.', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-indigo-700' },
    { name: 'Tamil Nadu', tag: 'Temple Towers', description: 'Gopurams, coastal towns, and hill stations.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-sky-700' },
    { name: 'Telangana', tag: 'Deccan Pearl', description: 'Charminar, palaces, and rock formations.', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-teal-700' },
    { name: 'Tripura', tag: 'Palace Sanctuary', description: 'Lakes, water palaces, and green valleys.', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-pink-700' },
    { name: 'Uttar Pradesh', tag: 'Ganges Heritage', description: 'Taj Mahal and spiritual ghats of Varanasi.', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-violet-700' },
    { name: 'Uttarakhand', tag: 'Land of Gods', description: 'Rishikesh retreats and Himalayan valleys.', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-cyan-700' },
    { name: 'West Bengal', tag: 'Colonial Splendor', description: 'Darjeeling tea hills and Sundarbans delta.', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-teal-800' },
    { name: 'Delhi', tag: 'Capital Luxury', description: 'Heritage landmarks and metro elegance.', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80', badgeColor: 'bg-indigo-800' }
  ];

  const displayedLocations = showAllLocations ? locations : locations.slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Hero Banner Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-rose-950 text-white py-24 px-8 md:px-16 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-secondary/10 rounded-full blur-3xl -ml-20 -mb-20" />

        <div className="relative max-w-3xl space-y-6">
          <span className="inline-flex items-center space-x-1 bg-brand/10 border border-brand/20 px-3.5 py-1 rounded-full text-brand text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verifiable Luxury Accommodations</span>
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none text-white margin-0">
            Find your next <span className="text-brand">perfect</span> getaway stay
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl leading-relaxed">
            Discover verified hotels, luxury villas, and comfortable suites all around the globe. Secure booking in just 3 clicks.
          </p>
        </div>
      </section>

      {/* Sits elegantly on the hero border */}
      <section className="relative -mt-20 z-10 px-4">
        <SearchBar onSearchSubmit={handleSearchSubmit} />
      </section>

      {/* City Search Category Grid */}
      <section className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight">Search by Location</h2>
          <p className="text-gray-500 text-sm">Select a curated destination to view beautiful beachfront stays or metropolitan luxury.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedLocations.map((loc) => (
            <div 
              key={loc.name}
              onClick={() => handleCityClick(loc.name)}
              className="group relative h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent z-10" />
              <img 
                src={loc.image} 
                alt={`${loc.name} stays`} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute bottom-6 left-6 z-20 space-y-1">
                <span className={`${loc.badgeColor} text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider`}>
                  {loc.tag}
                </span>
                <h3 className="text-white font-extrabold text-xl">Stays in {loc.name}</h3>
                <p className="text-gray-300 text-[10px] font-medium leading-relaxed">{loc.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAllLocations(!showAllLocations)}
            className="bg-gray-950 hover:bg-brand text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md transition-all duration-300 cursor-pointer border-none"
          >
            {showAllLocations ? 'Show Fewer Destinations' : 'See All 29 Indian States & UTs'}
          </button>
        </div>
      </section>

      {/* Featured Experiences Listing */}
      <section className="space-y-6 pt-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight">Discover Unique Experiences</h2>
            <p className="text-gray-500 text-sm">Activities led by passionate local hosts and expert guides.</p>
          </div>
          <button 
            onClick={() => navigate('/experiences')}
            className="text-brand hover:underline font-extrabold text-sm flex items-center space-x-1 cursor-pointer bg-transparent border-none"
          >
            <span>See all experiences</span>
            <span>&rarr;</span>
          </button>
        </div>

        {experiencesLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="medium" />
          </div>
        ) : featuredExperiences.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <p className="text-gray-700 font-bold text-sm">No experiences listed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredExperiences.map((exp) => (
              <div 
                key={exp.id}
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  navigate(`/experiences/${exp.id}?date=${today}&guestsCount=1`);
                }}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
              >
                {/* Photo */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                  <img 
                    src={exp.image} 
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  {exp.isOnline && (
                    <span className="absolute top-4 left-4 bg-brand text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                      <Video className="w-3 h-3" />
                      <span>Live Video Call</span>
                    </span>
                  )}
                </div>
                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{exp.isOnline ? 'Online' : exp.location}</span>
                      </span>
                      {exp.rating && (
                        <div className="flex items-center text-gray-900 space-x-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{exp.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-extrabold text-gray-950 text-sm leading-snug group-hover:text-brand transition duration-150 line-clamp-2">
                      {exp.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-xs text-gray-500 font-semibold">
                    <span>{exp.duration}</span>
                    <span className="font-extrabold text-gray-950 text-sm">₹{exp.price} <span className="text-[10px] text-gray-400 font-normal">/ guest</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust Badges */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-center">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-gray-950 text-sm">Explore Everywhere</h4>
          <p className="text-gray-500 text-xs leading-relaxed">Filter thousands of luxury stays across premium global tourist hubs instantly.</p>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-gray-950 text-sm">100% Secure Payments</h4>
          <p className="text-gray-500 text-xs leading-relaxed">Integrated directly with Stripe. Secure, encrypted checkout redirections.</p>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-brand flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-gray-950 text-sm">Superhost Hospitality</h4>
          <p className="text-gray-500 text-xs leading-relaxed">High hospitality standards with instant and automated guest registries.</p>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {!recLoading && recommendations.length > 0 && (
        <RecommendationCarousel
          title="Recommended Stays for You"
          subtitle="Personalized recommendations curated from your search and wishlist history."
          hotels={recommendations}
        />
      )}

      {/* Featured Hotels Listing */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight">Explore Featured Properties</h2>
          <p className="text-gray-500 text-sm">Top-rated accommodations with premium amenities and dynamic pricing.</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 border border-red-100 rounded-2xl max-w-2xl mx-auto p-6 space-y-2">
            <p className="text-red-700 font-bold text-base">Unable to load accommodations</p>
            <p className="text-red-500 text-xs">{error}</p>
            <button
              onClick={() => searchHotels({ city: 'Delhi' })}
              className="mt-2 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl max-w-2xl mx-auto p-6">
            <p className="text-gray-700 font-bold text-base">No properties listed yet</p>
            <p className="text-gray-400 text-xs mt-1">Check back later or register a new hotel via the Manager Panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
