import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PlusCircle, Edit, Trash2, Home, Power, Eye, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

const HotelList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/hotels');
      const data = response.data.data || response.data;
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch admin hotels:', err);
      toast.error('Failed to load hotels list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleToggleActivate = async (hotelId, currentStatus) => {
    try {
      await axiosInstance.patch(`/admin/hotels/${hotelId}/activate`);
      toast.success(`Property ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      fetchHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status toggle failed.');
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (window.confirm('WARNING: Deleting this hotel will also delete all associated room inventories. Proceed?')) {
      try {
        await axiosInstance.delete(`/admin/hotels/${hotelId}`);
        toast.success('Hotel and associated inventories deleted.');
        fetchHotels();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete hotel.');
      }
    }
  };

  if (loading && hotels.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">My Listed Properties</h1>
          <p className="text-gray-500 text-sm">Review hosting attributes, inventory status, and add room category packages.</p>
        </div>

        <Link
          to="/admin/hotels/create"
          className="flex items-center justify-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Property</span>
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8 max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-gray-150 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <Home className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">No properties registered</h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
              Launch your hosting career today. Register your villa, hotel, or suite property and start receiving guests.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/admin/hotels/create"
              className="inline-flex items-center space-x-1.5 bg-gray-900 hover:bg-brand text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Property</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-150">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Property Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {hotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">#{hotel.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{hotel.name}</td>
                    <td className="px-6 py-4">{hotel.city}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 font-bold text-[10px] px-2.5 py-1 rounded-full border uppercase ${
                        hotel.isActive
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-600'
                      }`}>
                        <span>{hotel.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      {/* View Rooms */}
                      <Link
                        to={`/admin/hotels/${hotel.id}/rooms`}
                        className="inline-flex items-center space-x-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 font-bold text-xs px-2.5 py-1.5 rounded-lg transition"
                        title="Manage Room Categories"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Rooms</span>
                      </Link>

                      {/* Edit */}
                      <Link
                        to={`/admin/hotels/${hotel.id}/edit`}
                        className="inline-flex items-center space-x-1 text-gray-700 hover:bg-gray-100 border border-gray-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition"
                        title="Edit Property Info"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>

                      {/* Power Toggle */}
                      <button
                        onClick={() => handleToggleActivate(hotel.id, hotel.isActive)}
                        className={`inline-flex items-center space-x-1 font-bold text-xs px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                          hotel.isActive
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                        title={hotel.isActive ? 'Deactivate Listing' : 'Activate Listing'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteHotel(hotel.id)}
                        className="inline-flex items-center space-x-1 text-red-600 hover:bg-red-50 border border-red-200 font-bold text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        title="Delete Property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelList;
