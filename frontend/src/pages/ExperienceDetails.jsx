import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { Star, Clock, MapPin, Globe, Compass, Shield, Check, Minus, Plus, Video, Calendar, Sparkles, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

const getExperienceImagePool = (title, mainImage) => {
  const t = title.toLowerCase();
  let pool = [];
  if (t.includes('scuba') || t.includes('dive') || t.includes('coral') || t.includes('reef')) {
    pool = [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
    ];
  } else if (t.includes('cook') || t.includes('pasta') || t.includes('curry')) {
    pool = [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    ];
  } else if (t.includes('food') || t.includes('street') || t.includes('taste') || t.includes('brewery') || t.includes('beer')) {
    pool = [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&w=600&q=80'
    ];
  } else if (t.includes('bollywood') || t.includes('dance') || t.includes('studio')) {
    pool = [
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1502519140252-0231e2402167?auto=format&fit=crop&w=600&q=80'
    ];
  } else if (t.includes('yoga') || t.includes('meditation') || t.includes('yogi')) {
    pool = [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524863380900-26f8d1220f68?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&w=600&q=80'
    ];
  } else if (t.includes('photography') || t.includes('photo') || t.includes('heritage') || t.includes('fort')) {
    pool = [
      'https://images.unsplash.com/photo-1477584322811-53475141e180?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80'
    ];
  } else if (t.includes('magic') || t.includes('illusion') || t.includes('mystery')) {
    pool = [
      'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
    ];
  } else {
    pool = [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1477584322811-53475141e180?auto=format&fit=crop&w=600&q=80'
    ];
  }
  
  return [
    mainImage || pool[0],
    ...pool
  ].slice(0, 5);
};

const getExperienceReviews = (title) => {
  const t = title.toLowerCase();
  if (t.includes('scuba') || t.includes('dive') || t.includes('coral') || t.includes('reef')) {
    return [
      { name: 'Amit Sharma', date: 'April 2026', rating: 5, comment: 'PADI guides were incredible. I was a bit nervous, but they handled my safety perfectly. Saw gorgeous coral reefs!', avatar: 'AS' },
      { name: 'Rachel Green', date: 'May 2026', rating: 5, comment: 'Hands down the highlight of my trip to Goa! Highly recommended for couples or solo travelers.', avatar: 'RG' }
    ];
  }
  if (t.includes('cook') || t.includes('pasta') || t.includes('curry')) {
    return [
      { name: 'Karthik Rao', date: 'May 2026', rating: 5, comment: 'The recipe secrets for authentic sauces are pure gold. Cooked along from my kitchen, and it tasted exactly like restaurant food!', avatar: 'KR' },
      { name: 'Elena Petrova', date: 'March 2026', rating: 4, comment: 'Such a fun and heartwarming cooking session. Grandma\'s feedback was super sweet and helpful.', avatar: 'EP' }
    ];
  }
  if (t.includes('food') || t.includes('street') || t.includes('taste')) {
    return [
      { name: 'Vikram Mehta', date: 'May 2026', rating: 5, comment: 'Chandni Chowk can be overwhelming, but our guide took us to the absolute best spots safely. The jalebis were divine.', avatar: 'VM' },
      { name: 'Sophia Miller', date: 'April 2026', rating: 5, comment: 'Amazing street food experience! We tried things I would never have found on my own. Sanitizers and safety were spot on.', avatar: 'SM' }
    ];
  }
  return [
    { name: 'Rohan Sen', date: 'May 2026', rating: 5, comment: 'Incredible guidance and wonderful memories. Certified host was top-notch with answering all our questions.', avatar: 'RS' },
    { name: 'Sarah Connor', date: 'May 2026', rating: 4, comment: 'Very interactive, small group size made it feel special and private. Worth every rupee.', avatar: 'SC' }
  ];
};

const getWhatToBring = (exp) => {
  if (!exp) return [];
  if (exp.isOnline) {
    if (exp.title.toLowerCase().includes('cooking') || exp.title.toLowerCase().includes('pasta')) {
      return [
        { id: 1, text: 'Pasta flour (Tipo 00 or All-purpose) - 200g' },
        { id: 2, text: '2 fresh eggs' },
        { id: 3, text: 'Rolling pin or pasta machine' },
        { id: 4, text: 'A clean wooden board or countertop workspace' },
        { id: 5, text: 'Zoom client installed on a laptop with a working webcam' }
      ];
    }
    if (exp.title.toLowerCase().includes('yoga') || exp.title.toLowerCase().includes('meditation')) {
      return [
        { id: 1, text: 'A comfortable, non-slip yoga mat' },
        { id: 2, text: 'Loose, stretchable clothing' },
        { id: 3, text: 'A quiet room with enough space to stretch' },
        { id: 4, text: 'A yoga block or small pillow' },
        { id: 5, text: 'Zoom client installed on a laptop/tablet' }
      ];
    }
    return [
      { id: 1, text: 'Zoom client installed on your device' },
      { id: 2, text: 'A stable internet connection' },
      { id: 3, text: 'An open mind and positive energy!' }
    ];
  } else {
    if (exp.title.toLowerCase().includes('food') || exp.title.toLowerCase().includes('street')) {
      return [
        { id: 1, text: 'Comfortable walking shoes' },
        { id: 2, text: 'An empty stomach (lots of tasting included!)' },
        { id: 3, text: 'Umbrella or raincoat in case of light rain' },
        { id: 4, text: 'Hand sanitizer & wet wipes' }
      ];
    }
    return [
      { id: 1, text: 'Comfortable walking shoes' },
      { id: 2, text: 'Camera or smartphone for photos' },
      { id: 3, text: 'Sunscreen and sunglasses' },
      { id: 4, text: 'A bottle of drinking water' }
    ];
  }
};

const ExperienceDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking states
  const [bookingDate, setBookingDate] = useState(searchParams.get('date') || '');
  const [guestsCount, setGuestsCount] = useState(parseInt(searchParams.get('guestsCount')) || 1);

  // Preparation checklist state
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/experiences/${id}`);
        const data = response.data.data || response.data;
        setExperience(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load experience info:', err);
        setError(err.response?.data?.message || 'Failed to fetch experience details.');
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const adjustGuests = (increment) => {
    setGuestsCount(prev => Math.max(1, prev + (increment ? 1 : -1)));
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to book this experience.');
      navigate('/login');
      return;
    }

    if (!bookingDate) {
      toast.warn('Please select a date for your experience.');
      return;
    }

    setBookingLoading(true);
    try {
      // 1. Initialise the Booking
      const initResponse = await axiosInstance.post('/experiences/bookings', {
        experienceId: parseInt(id),
        bookingDate,
        guestsCount
      });
      const bookingData = initResponse.data.data || initResponse.data;
      const bookingId = bookingData.id;

      // 2. Initiate Stripe checkout
      const successUrl = `${window.location.origin}/experiences/booking-status/${bookingId}`;
      const failureUrl = `${window.location.origin}/experiences/booking-status/${bookingId}?cancel=true`;

      const paymentResponse = await axiosInstance.post(`/experiences/bookings/${bookingId}/payments`, null, {
        params: { successUrl, failureUrl }
      });
      const paymentData = paymentResponse.data.data || paymentResponse.data;

      if (paymentData.sessionUrl) {
        // Redirect to Stripe checkout
        window.location.href = paymentData.sessionUrl;
      } else {
        throw new Error('Payment session URL not returned');
      }

    } catch (err) {
      console.error('Booking checkout failed:', err);
      toast.error(err.response?.data?.message || 'Checkout setup failed. Please try again.');
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="text-center py-20 bg-red-50 border border-red-100 rounded-3xl max-w-2xl mx-auto p-6 space-y-4">
        <p className="text-red-700 font-extrabold text-lg">Error loading details</p>
        <p className="text-red-500 text-xs">{error || 'Experience not found'}</p>
        <button
          onClick={() => navigate('/experiences')}
          className="bg-brand text-white font-extrabold text-xs px-4 py-2 rounded-xl"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const totalPrice = experience.price * guestsCount;
  const photoGrid = getExperienceImagePool(experience.title, experience.image);
  const guestReviews = getExperienceReviews(experience.title);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950 tracking-tight leading-tight">
          {experience.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500">
          {experience.rating && (
            <div className="flex items-center text-gray-950 space-x-1">
              <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
              <span>{experience.rating} Rating</span>
            </div>
          )}
          <span>•</span>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{experience.duration || '2 hours'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{experience.isOnline ? 'Online via Zoom' : experience.location}</span>
          </div>
        </div>
      </div>

      {/* Premium 5-Photo Grid Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden shadow-md max-h-[420px] bg-gray-100 relative">
        {/* Principal Image */}
        <div className="md:col-span-2 md:row-span-2 h-[220px] md:h-[420px] bg-gray-150 overflow-hidden relative">
          <img 
            src={photoGrid[0]} 
            alt={experience.title} 
            className="w-full h-full object-cover hover:scale-102 transition duration-300"
          />
          {experience.isOnline && (
            <span className="absolute top-6 left-6 bg-brand text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 shadow-md">
              <Video className="w-4 h-4" />
              <span>Virtual Interactive Video</span>
            </span>
          )}
        </div>
        {/* Secondary Images (Stacked on the right) */}
        {photoGrid.slice(1).map((pic, idx) => (
          <div key={idx} className="hidden md:block h-[204px] bg-gray-150 overflow-hidden relative">
            <img 
              src={pic} 
              alt={`${experience.title} grid ${idx + 1}`} 
              className="w-full h-full object-cover hover:scale-103 transition duration-300"
            />
          </div>
        ))}
      </div>

      {/* Detail Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width) - Info & Hosts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Host info banner */}
          <div className="flex items-center justify-between border-b border-gray-150 pb-6">
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-gray-950">
                Experience hosted by {experience.host?.name || 'Local Expert'}
              </h2>
              <p className="text-xs text-gray-500 font-semibold">
                Guaranteed response and personalized guidance throughout the activity.
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
              {experience.host?.name ? experience.host.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'H'}
            </div>
          </div>

          {/* Key Selling Perks */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3.5">
              <Compass className="w-5 h-5 text-brand mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-gray-950">Highly Rated Host</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Guests give this expert host top scores for communication and guidance.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3.5">
              <Globe className="w-5 h-5 text-brand mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-gray-950">Small Group Capacity</h4>
                <p className="text-xs text-gray-500 leading-relaxed">This session fits a maximum of {experience.maxGuests || 10} travelers for personal interaction.</p>
              </div>
            </div>
            {experience.isOnline && (
              <div className="flex items-start space-x-3.5">
                <Video className="w-5 h-5 text-brand mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-gray-950">No travel required</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Join from any computer or mobile screen. Zoom details will be emailed upon purchase.</p>
                </div>
              </div>
            )}
          </div>

          {/* How Online Experiences Work - Interactive Stepper */}
          {experience.isOnline && (
            <>
              <hr className="border-gray-100" />
              <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 border border-slate-800 shadow-md">
                <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
                  <Video className="w-5 h-5 text-brand" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">How Online Experiences Work</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex space-x-3.5 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-[10px] text-brand flex-shrink-0">1</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">Join via Secure Zoom Session</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Check your email or boarding pass for the live launch link. Connect easily on any mobile screen or browser client.</p>
                    </div>
                  </div>
                  <div className="flex space-x-3.5 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-[10px] text-brand flex-shrink-0">2</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">Gather Checklist Prep Supplies</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Review the preparation list before the event starts. Check off ingredients or accessories to stay fully prepared.</p>
                    </div>
                  </div>
                  <div className="flex space-x-3.5 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-[10px] text-brand flex-shrink-0">3</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">Interact Live & Share</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Engage directly with the certified host and fellow travelers in a cozy group. Ask questions and follow instructions in real-time!</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <hr className="border-gray-100" />

          {/* About description */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-base text-gray-950">What we'll do</h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line font-medium">
              {experience.description}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* What is included */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-gray-950">What's included</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2.5 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <Check className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-bold">Expert Host/Guide fees</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <Check className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-bold">{experience.isOnline ? 'Online Session Link Access' : 'Safety equipment / gear'}</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <Check className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-bold">Local recommendations</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <Check className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-bold">Languages: English & Hindi</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* What to Bring Checklist Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-950">What to bring</h3>
              <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wide">Preparation checklist (Check items to prepare)</p>
            </div>
            <div className="space-y-2.5">
              {getWhatToBring(experience).map((item) => (
                <label 
                  key={item.id} 
                  className={`flex items-start space-x-3 p-3.5 border rounded-2xl cursor-pointer transition-all duration-200 ${
                    checkedItems[item.id] 
                      ? 'bg-emerald-50/50 border-emerald-200 text-gray-550 line-through opacity-70' 
                      : 'bg-white border-gray-150 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.id]}
                    onChange={() => toggleItem(item.id)}
                    className="w-4.5 h-4.5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer mt-0.5"
                  />
                  <span className="text-xs font-bold">{item.text}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Meet your Host Profile Card */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-gray-950">Meet your host</h3>
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand to-rose-400 text-white flex items-center justify-center font-extrabold text-xl shadow-md border border-white flex-shrink-0">
                {experience.host?.name ? experience.host.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'H'}
              </div>
              <div className="space-y-2 flex-1">
                <div>
                  <h4 className="font-extrabold text-base text-gray-950">{experience.host?.name || 'Local Expert'}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Airbnb Certified Experience Host</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                  Hi, I am passionate about creating memories and sharing unique local perspectives with travellers globally. I look forward to hosting this session and guiding you.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center space-x-1.5 text-[9px] font-extrabold text-brand bg-brand/5 border border-brand/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Verified Superhost</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 text-[9px] font-extrabold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Languages: English, Hindi</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Point Card (For in-person only) */}
          {!experience.isOnline && (
            <>
              <hr className="border-gray-100" />
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-gray-950">Where we'll meet</h3>
                <div className="bg-gray-50 border border-gray-150 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-950">Activity Meeting Point</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{experience.location}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                    We'll meet at <span className="text-gray-950 font-extrabold">{experience.location} Landmark Center</span>. Detailed landmark descriptions and host coordinate instructions will be provided on your boarding pass upon confirmation.
                  </p>
                  <div className="h-56 rounded-2xl bg-slate-200 border border-slate-300 relative overflow-hidden flex items-center justify-center shadow-inner">
                    {/* Styled custom vector/aesthetic map overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-70"></div>
                    <div className="absolute w-24 h-24 rounded-full bg-brand/10 border border-brand/20 animate-ping opacity-75"></div>
                    <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center z-10 border border-gray-100">
                      <MapPin className="w-5.5 h-5.5 text-brand animate-bounce" />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-gray-950/85 backdrop-blur-md text-white text-[9px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                      GPS: Verified Meeting Spot
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Testimonial Guest Reviews section */}
          <hr className="border-gray-100" />
          <div className="space-y-5">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-brand" />
              <h3 className="font-extrabold text-base text-gray-950">Guest Feedback ({guestReviews.length} reviews)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guestReviews.map((rev, idx) => (
                <div key={idx} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {rev.avatar}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-gray-900">{rev.name}</h4>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">{rev.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-500 fill-amber-500 text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold italic">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width) - Checkout Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xl space-y-5 sticky top-24">
            <div className="flex items-baseline justify-between border-b border-gray-50 pb-3">
              <div>
                <span className="font-extrabold text-xl text-gray-950">₹{experience.price}</span>
                <span className="text-xs text-gray-500 font-semibold"> / guest</span>
              </div>
              {experience.rating && (
                <div className="flex items-center space-x-0.5 text-xs text-gray-900 font-bold">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{experience.rating}</span>
                </div>
              )}
            </div>

            {/* Timezone label */}
            <div className="text-[10px] text-gray-500 font-extrabold bg-gray-50 border border-gray-150 p-2 rounded-xl text-center uppercase tracking-wider flex items-center justify-center space-x-1.5">
              <span>🕒 Times shown in local IST (UTC+5:30)</span>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              {/* Date Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-gray-900 uppercase tracking-wide">Select Date</label>
                <input 
                  type="date"
                  min={getTodayDate()}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-xs bg-gray-50 focus:outline-none focus:border-brand font-semibold text-gray-700 cursor-pointer"
                />
              </div>

              {/* Guest counter */}
              <div className="flex items-center justify-between border border-gray-150 rounded-xl p-3">
                <div>
                  <p className="font-extrabold text-xs text-gray-950">Guest Tickets</p>
                  <p className="text-[9px] text-gray-400 font-semibold">Max spots: {experience.maxGuests || 10}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => adjustGuests(false)}
                    className="w-7 h-7 rounded-full border border-gray-300 hover:border-gray-900 flex items-center justify-center text-gray-600 transition cursor-pointer disabled:opacity-50"
                    disabled={guestsCount <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs text-gray-900 min-w-[12px] text-center">{guestsCount}</span>
                  <button
                    type="button"
                    onClick={() => adjustGuests(true)}
                    className="w-7 h-7 rounded-full border border-gray-300 hover:border-gray-900 flex items-center justify-center text-gray-600 transition cursor-pointer disabled:opacity-50"
                    disabled={guestsCount >= (experience.maxGuests || 10)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Capacity Progress / Scarcity Meter */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                  <span>Capacity spots filled</span>
                  <span>{guestsCount} claimed / {experience.maxGuests || 10} total</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (guestsCount / (experience.maxGuests || 10)) * 100)}%` }}
                  />
                </div>
                {guestsCount >= (experience.maxGuests || 10) - 2 && (
                  <p className="text-[10px] text-brand font-extrabold animate-pulse">
                    🔥 Hurry! Only {(experience.maxGuests || 10) - guestsCount} spot(s) remaining for this session.
                  </p>
                )}
              </div>
            </div>

            {/* Total breakdown */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-600 font-semibold">
                <span>₹{experience.price} x {guestsCount} ticket{guestsCount > 1 && 's'}</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-semibold">
                <span>Service tax & fees</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm font-extrabold text-gray-950">
                <span>Total Amount</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleBook}
              disabled={bookingLoading}
              className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-300 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md hover:shadow-lg transition duration-200 cursor-pointer flex items-center justify-center space-x-2"
            >
              {bookingLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Processing Redirect...</span>
                </>
              ) : (
                <span>Reserve Spot & Pay</span>
              )}
            </button>

            <p className="text-[10px] text-center text-gray-400 font-bold">
              Payments are secured and processed using Stripe checkout sandbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceDetails;
