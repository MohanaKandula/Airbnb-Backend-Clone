import React, { createContext, useState, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

const HotelContext = createContext(null);

export const HotelProvider = ({ children }) => {
  const [hotels, setHotels] = useState([]);
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [searchParams, setSearchParams] = useState({
    city: '',
    checkInDate: '',
    checkOutDate: '',
    roomsCount: '',
    guestsCount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentHotel, setCurrentHotel] = useState(null);

  const searchHotels = async (params) => {
    setLoading(true);
    setError(null);
    const updatedParams = { ...searchParams, ...params };
    setSearchParams(updatedParams);

    const todayStr = getTodayString();
    const tomorrowStr = getTomorrowString();

    // Map and guarantee non-null valid date values to prevent ChronoUnit NullPointerException in Spring Boot
    const payload = {
      city: updatedParams.city?.trim() || 'Delhi',
      startDate: updatedParams.checkInDate || todayStr,
      endDate: updatedParams.checkOutDate || tomorrowStr,
      roomsCount: parseInt(updatedParams.roomsCount) || 1,
    };

    try {
      // Send parameters as standard URL query parameters
      const response = await axiosInstance.get('/hotels/search', {
        params: payload,
      });
      const data = response.data.data || response.data;
      const hotelList = Array.isArray(data) ? data : (data.content && Array.isArray(data.content) ? data.content : []);
      setHotels(hotelList);
      setLoading(false);
    } catch (err) {
      console.error('Search hotels failed:', err);
      setError(err.response?.data?.message || 'Failed to search hotels. Please try again.');
      setHotels([]);
      setLoading(false);
    }
  };

  const getHotelDetails = async (hotelId) => {
    setLoading(true);
    setError(null);
    const todayStr = getTodayString();
    const tomorrowStr = getTomorrowString();

    try {
      // Guarantee non-null date bounds for info retrieval
      const payload = {
        startDate: searchParams.checkInDate || todayStr,
        endDate: searchParams.checkOutDate || tomorrowStr,
        roomsCount: parseInt(searchParams.roomsCount) || 1,
      };

      const response = await axiosInstance.get(`/hotels/${hotelId}/info`, {
        params: payload,
      });
      const data = response.data.data || response.data;
      setCurrentHotel(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('Fetch hotel details failed:', err);
      setError(err.response?.data?.message || 'Failed to fetch hotel details.');
      setLoading(false);
      throw err;
    }
  };

  const clearSearch = () => {
    setHotels([]);
    setSearchParams({
      city: '',
      checkInDate: '',
      checkOutDate: '',
      roomsCount: 1,
      guestsCount: 1,
    });
  };

  const value = {
    hotels,
    searchParams,
    loading,
    error,
    currentHotel,
    searchHotels,
    getHotelDetails,
    clearSearch,
    setSearchParams,
    setHotels
  };

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
};

export const useHotels = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotels must be used within a HotelProvider');
  }
  return context;
};
