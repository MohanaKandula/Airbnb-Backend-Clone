import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHotels } from '../context/HotelContext';
import { 
  Menu, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Briefcase, 
  Globe, 
  Search, 
  MapPin, 
  Home, 
  Minus, 
  Plus,
  Heart
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { searchParams, setSearchParams, searchHotels } = useHotels();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(location.pathname === '/');
  const [activeSegment, setActiveSegment] = useState('anywhere'); // anywhere, anyweek, guests
  const [searchType, setSearchType] = useState('stays'); // stays, experiences, online

  // Local state for expanded search inputs
  const [city, setCity] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [roomsCount, setRoomsCount] = useState(1);
  const [guestsCount, setGuestsCount] = useState(1);

  const dropdownRef = useRef(null);
  const searchBarRef = useRef(null);

  // Popular seeded locations
  const popularCities = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal'
  ];

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const urlCity = queryParams.get('city') || '';
  const urlDate = queryParams.get('date') || '';
  const urlGuests = queryParams.get('guestsCount') || '';

  const getPillCity = () => {
    const isOnlineExp = queryParams.get('isOnline') === 'true';
    if (isOnlineExp) return 'Online';
    return urlCity || 'Anywhere';
  };

  const getPillDate = () => {
    return urlDate ? 'Date Selected' : 'Any week';
  };

  const getPillGuests = () => {
    return urlGuests ? `${urlGuests} Guests` : 'Add guests';
  };

  // Initialize search fields when expanded or when path/URL changes
  useEffect(() => {
    if (isSearchExpanded) {
      const qp = new URLSearchParams(location.search);
      setCity(qp.get('city') || '');
      setCheckInDate(qp.get('date') || '');
      setGuestsCount(parseInt(qp.get('guestsCount')) || 1);
      const isOnlineExp = qp.get('isOnline') === 'true';
      if (location.pathname === '/experiences') {
        setSearchType(isOnlineExp ? 'online' : 'experiences');
      } else {
        setSearchType('stays');
      }
    }
  }, [isSearchExpanded, location.search, location.pathname]);

  // Expand/collapse search banner based on active page route
  useEffect(() => {
    if (location.pathname === '/') {
      setIsSearchExpanded(true);
      setSearchType('stays'); // default home page header to stays
    } else if (location.pathname === '/experiences') {
      setIsSearchExpanded(true);
      const qp = new URLSearchParams(location.search);
      const isOnlineExp = qp.get('isOnline') === 'true';
      setSearchType(isOnlineExp ? 'online' : 'experiences');
    } else {
      setIsSearchExpanded(false);
    }
  }, [location.pathname, location.search]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        if (!event.target.closest('.flatpickr-calendar')) {
          setIsSearchExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectCity = (selectedCity) => {
    setCity(selectedCity);
    setActiveSegment('anyweek');
  };

  const adjustCount = (type, increment) => {
    if (type === 'rooms') {
      setRoomsCount(prev => Math.max(1, prev + (increment ? 1 : -1)));
    } else if (type === 'guests') {
      setGuestsCount(prev => Math.max(1, prev + (increment ? 1 : -1)));
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchType === 'stays') {
      const params = {
        city,
        checkInDate,
        checkOutDate,
        roomsCount: parseInt(roomsCount) || 1,
        guestsCount: parseInt(guestsCount) || 1,
      };
      setSearchParams(params);
      searchHotels(params);
      setIsSearchExpanded(false);
      navigate('/search');
    } else if (searchType === 'experiences') {
      setIsSearchExpanded(false);
      navigate(`/experiences?city=${city}&date=${checkInDate}&guestsCount=${guestsCount}&isOnline=false`);
    } else if (searchType === 'online') {
      setIsSearchExpanded(false);
      navigate(`/experiences?date=${checkInDate}&guestsCount=${guestsCount}&isOnline=true`);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="relative">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-brand">
            <Globe className="w-8 h-8 animate-pulse" />
            <span className="font-extrabold text-xl tracking-tight hidden sm:block">
              airbnb<span className="text-gray-900 text-sm align-super font-semibold">clone</span>
            </span>
          </Link>

          {/* Middle Section: Stays Tabs */}
          {isSearchExpanded && (
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => {
                  setSearchType('stays');
                  setIsSearchExpanded(true);
                  navigate('/');
                }}
                className={`text-xs font-bold pb-1 cursor-pointer uppercase tracking-wider ${
                  searchType === 'stays' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-950'
                }`}
              >
                Stays
              </button>
              <button 
                onClick={() => {
                  setSearchType('experiences');
                  setIsSearchExpanded(true);
                  navigate('/experiences');
                }}
                className={`text-xs font-bold pb-1 cursor-pointer uppercase tracking-wider ${
                  searchType === 'experiences' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-950'
                }`}
              >
                Experiences
              </button>
              <button 
                onClick={() => {
                  setSearchType('online');
                  setIsSearchExpanded(true);
                  navigate('/experiences?isOnline=true');
                }}
                className={`text-xs font-bold pb-1 cursor-pointer uppercase tracking-wider ${
                  searchType === 'online' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-950'
                }`}
              >
                Online Experiences
              </button>
            </div>
          )}

          {/* Right Section - Profile and Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <Link
                to={location.pathname.startsWith('/admin') ? '/' : (isAdmin ? '/admin' : '/my-bookings')}
                className="hidden lg:block text-sm font-semibold text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-full transition"
              >
                {location.pathname.startsWith('/admin') ? 'Switch to Traveling' : (isAdmin ? 'Switch to Hosting' : 'My Trips')}
              </Link>
            )}

            {/* Dropdown Menu Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 border border-gray-200 rounded-full p-2 hover:shadow-md transition focus:outline-none bg-white"
              >
                <Menu className="w-5 h-5 text-gray-500" />
                {isAuthenticated ? (
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs">
                    {getInitials(user.name || user.fullName)}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu Panel */}
              {isOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 text-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-bold text-sm text-gray-900 truncate">
                          Hi, {user.name || user.fullName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-semibold text-brand hover:bg-gray-50"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        to="/my-bookings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                        My Bookings
                      </Link>
                      <Link
                        to="/wishlists"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        <Heart className="w-4 h-4 mr-3 text-gray-500" />
                        My Wishlists
                      </Link>
                      <Link
                        to="/my-guests"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        <Users className="w-4 h-4 mr-3 text-gray-500" />
                        My Guests
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        <Briefcase className="w-4 h-4 mr-3 text-gray-500" />
                        My Profile
                      </Link>

                      <hr className="my-1 border-gray-100" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2 text-sm font-semibold hover:bg-gray-50 text-gray-900"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-500"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
