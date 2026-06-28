import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistHotels, setWishlistHotels] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlistHotels([]);
      setWishlistIds(new Set());
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch full hotel wishlist
      const res = await axiosInstance.get('/wishlist');
      const data = res.data.data || res.data;
      setWishlistHotels(Array.isArray(data) ? data : []);

      // 2. Fetch list of wishlisted IDs
      const idsRes = await axiosInstance.get('/wishlist/ids');
      const ids = idsRes.data.data || idsRes.data;
      setWishlistIds(new Set(Array.isArray(ids) ? ids : []));
    } catch (err) {
      console.error('Failed to fetch wishlist details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (hotelId) => {
    if (!isAuthenticated) {
      toast.info('Please log in to add items to your wishlist!');
      return;
    }
    try {
      const res = await axiosInstance.post(`/wishlist/toggle/${hotelId}`);
      const isAdded = res.data.data ?? res.data;

      // Update ids and hotels state locally
      setWishlistIds(prev => {
        const copy = new Set(prev);
        if (copy.has(hotelId)) {
          copy.delete(hotelId);
          toast.success('Removed from Wishlist');
        } else {
          copy.add(hotelId);
          toast.success('Saved to Wishlist!');
        }
        return copy;
      });

      // Refetch the full wishlist details to keep it in sync
      fetchWishlist();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle wishlist.');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistHotels,
        wishlistIds,
        loading,
        toggleWishlist,
        fetchWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
