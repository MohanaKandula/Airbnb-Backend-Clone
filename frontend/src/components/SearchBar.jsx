import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHotels } from '../context/HotelContext';
import { Search, MapPin, Calendar, Users, Home, Video, Compass } from 'lucide-react';

const SearchBar = ({ onSearchSubmit }) => {
  const { searchParams, setSearchParams, searchHotels } = useHotels();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchType, setSearchType] = useState('stays'); // stays, experiences, online

  // Local inputs
  const [city, setCity] = useState(searchParams.city || '');
  const [checkInDate, setCheckInDate] = useState(searchParams.checkInDate || '');
  const [checkOutDate, setCheckOutDate] = useState(searchParams.checkOutDate || '');
  const [roomsCount, setRoomsCount] = useState(searchParams.roomsCount || 1);
  const [guestsCount, setGuestsCount] = useState(searchParams.guestsCount || 1);

  // Sync inputs with global searchParams when they change
  useEffect(() => {
    setCity(searchParams.city || '');
    setCheckInDate(searchParams.checkInDate || '');
    setCheckOutDate(searchParams.checkOutDate || '');
    setRoomsCount(searchParams.roomsCount || 1);
    setGuestsCount(searchParams.guestsCount || 1);
  }, [searchParams]);

  // Read URL params and sync inputs on mount or path/query parameter updates
  useEffect(() => {
    if (location.pathname === '/experiences') {
      const queryParams = new URLSearchParams(location.search);
      const isOnlineExp = queryParams.get('isOnline') === 'true';
      setSearchType(isOnlineExp ? 'online' : 'experiences');
      setCity(queryParams.get('city') || '');
      setCheckInDate(queryParams.get('date') || '');
      setGuestsCount(parseInt(queryParams.get('guestsCount')) || 1);
    }
  }, [location.search, location.pathname]);

  const handleSubmit = (e) => {
    e.preventDefault();
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
      if (onSearchSubmit) {
        onSearchSubmit(params);
      } else if (location.pathname !== '/search') {
        navigate('/search');
      }
    } else if (searchType === 'experiences') {
      navigate(`/experiences?city=${city}&date=${checkInDate}&guestsCount=${guestsCount}&isOnline=false`);
    } else if (searchType === 'online') {
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
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Main Search Panel Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition duration-300 p-2 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-200"
      >
        {/* Destination Location */}
        {searchType !== 'online' ? (
          <div className="flex-1.5 w-full px-6 py-2.5 flex items-center space-x-3 text-left">
            <MapPin className="text-brand w-5 h-5 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-xs font-extrabold text-gray-950 uppercase tracking-wide">Destination</label>
              <input
                type="text"
                placeholder="Where are you going?"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-700 font-semibold focus:outline-none placeholder-gray-400 mt-0.5"
                required={searchType !== 'online'}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1.5 w-full px-6 py-2.5 flex items-center space-x-3 text-left bg-gray-50/50 rounded-l-full cursor-not-allowed opacity-70">
            <Video className="text-gray-400 w-5 h-5 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wide">Destination</label>
              <span className="text-sm text-gray-500 font-semibold mt-0.5 block">Online (Virtual Session)</span>
            </div>
          </div>
        )}

        {/* Dates selection */}
        {searchType === 'stays' ? (
          <>
            <div className="flex-1 w-full px-6 py-2.5 flex items-center space-x-3 text-left">
              <Calendar className="text-brand-secondary w-5 h-5 flex-shrink-0" />
              <div className="w-full">
                <label className="block text-xs font-extrabold text-gray-950 uppercase tracking-wide">Check-in</label>
                <input
                  type="date"
                  min={getTodayDate()}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-700 focus:outline-none mt-0.5 cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="flex-1 w-full px-6 py-2.5 flex items-center space-x-3 text-left">
              <Calendar className="text-brand-secondary w-5 h-5 flex-shrink-0" />
              <div className="w-full">
                <label className="block text-xs font-extrabold text-gray-955 uppercase tracking-wide">Check-out</label>
                <input
                  type="date"
                  min={checkInDate || getTodayDate()}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-700 focus:outline-none mt-0.5 cursor-pointer"
                  required
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 w-full px-6 py-2.5 flex items-center space-x-3 text-left">
            <Calendar className="text-brand-secondary w-5 h-5 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-xs font-extrabold text-gray-950 uppercase tracking-wide">Date</label>
              <input
                type="date"
                min={getTodayDate()}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none mt-0.5 cursor-pointer"
                required
              />
            </div>
          </div>
        )}

        {/* Travelers & Rooms */}
        <div className="flex-1 w-full px-6 py-2.5 flex items-center space-x-3 text-left">
          <Users className="text-indigo-500 w-5 h-5 flex-shrink-0" />
          <div className="w-full flex justify-between items-center">
            {searchType === 'stays' && (
              <div>
                <label className="block text-xs font-extrabold text-gray-950 uppercase tracking-wide">Rooms</label>
                <select
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none mt-0.5 cursor-pointer font-bold"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Room' : 'Rooms'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-extrabold text-gray-950 uppercase tracking-wide">Guests</label>
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none mt-0.5 cursor-pointer font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-2 w-full md:w-auto flex justify-center">
          <button
            type="submit"
            className="w-full md:w-auto bg-brand hover:bg-brand-hover text-white rounded-full p-4 flex items-center justify-center space-x-2 font-bold shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span className="md:hidden font-bold">Search</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
