import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useForm } from 'react-hook-form';
import { PlusCircle, Edit, Trash2, ArrowLeft, Bed, IndianRupee, Users, Save, ShieldAlert, Image, Layers } from 'lucide-react';
import { toast } from 'react-toastify';

const ROOM_AMENITIES_OPTIONS = [
  "Free WiFi",
  "Air Conditioning",
  "Flat-screen TV",
  "Mini Bar",
  "Coffee Maker",
  "In-room Safe",
  "Desk Workspace",
  "Luxury Bathtub",
  "Balcony View"
];

const RoomList = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [hotelName, setHotelName] = useState('Property Stays');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: 'Standard',
      basePrice: '',
      totalCount: 5,
      capacity: 2,
      photosText: '',
      amenities: [],
    },
  });

  const fetchRoomsAndHotelInfo = async () => {
    setLoading(true);
    try {
      // 1. Fetch Rooms List
      const roomsResponse = await axiosInstance.get(`/admin/hotels/${hotelId}/rooms`);
      const roomsData = roomsResponse.data.data || roomsResponse.data;
      setRooms(Array.isArray(roomsData) ? roomsData : []);

      // 2. Fetch Hotel Name for header
      const hotelRes = await axiosInstance.get(`/admin/hotels/${hotelId}`);
      const hotelData = hotelRes.data.data || hotelRes.data;
      setHotelName(hotelData.name);
    } catch (err) {
      console.error('Failed to load property rooms:', err);
      toast.error('Failed to load rooms list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndHotelInfo();
  }, [hotelId]);

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room category? All associated inventories will be removed.')) {
      try {
        await axiosInstance.delete(`/admin/hotels/${hotelId}/rooms/${roomId}`);
        toast.success('Room category deleted successfully!');
        fetchRoomsAndHotelInfo();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete room.');
      }
    }
  };

  const handleOpenEditModal = (room) => {
    setEditingRoom(room);
    setValue('type', room.type);
    setValue('basePrice', room.basePrice);
    setValue('totalCount', room.totalCount || 5);
    setValue('capacity', room.capacity);
    setValue('photosText', room.photos ? room.photos.join(', ') : '');
    setValue('amenities', room.amenities || []);
    setIsEditModalOpen(true);
  };

  const onSubmitUpdate = async (data) => {
    try {
      const photosArray = data.photosText
        ? data.photosText.split(',').map(url => url.trim()).filter(Boolean)
        : [];

      await axiosInstance.put(`/admin/hotels/${hotelId}/rooms/${editingRoom.id}`, {
        type: data.type,
        basePrice: parseFloat(data.basePrice),
        capacity: parseInt(data.capacity),
        totalCount: parseInt(data.totalCount),
        photos: photosArray,
        amenities: data.amenities || [],
      });
      toast.success('Room details updated successfully!');
      setIsEditModalOpen(false);
      fetchRoomsAndHotelInfo();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update room details.');
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back to Hotels */}
      <button
        onClick={() => navigate('/admin/hotels')}
        className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition cursor-pointer border-none bg-transparent"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hotels List</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">{hotelName} • Room Categories</h1>
          <p className="text-gray-500 text-sm">Review registered room sizes, nightly rates, total inventory, and amenities.</p>
        </div>

        <Link
          to={`/admin/hotels/${hotelId}/rooms/create`}
          className="flex items-center justify-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Room Category</span>
        </Link>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8 max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-gray-150 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <Bed className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">No rooms categories found</h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
              Before travelers can check out, you must register at least one room category with rates.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to={`/admin/hotels/${hotelId}/rooms/create`}
              className="inline-flex items-center space-x-1.5 bg-gray-950 hover:bg-brand text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Room Category</span>
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
                  <th className="px-6 py-4">Room Category</th>
                  <th className="px-6 py-4">Nightly Price</th>
                  <th className="px-6 py-4">Total Inventory</th>
                  <th className="px-6 py-4">Max Capacity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">#{room.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{room.type} Room</td>
                    <td className="px-6 py-4 font-semibold text-brand">₹{room.basePrice} / night</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{room.totalCount || 5} Rooms</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{room.capacity} Travelers max</td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="inline-flex items-center space-x-1 text-gray-700 hover:bg-gray-150 border border-gray-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        title="Update Room Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="inline-flex items-center space-x-1 text-red-600 hover:bg-red-50 border border-red-200 font-bold text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        title="Delete Room Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Room Category Details"
      >
        <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
          {/* Room Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Room Category Type</label>
            <div className="relative">
              <Bed className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <select
                {...register('type')}
                className="w-full border border-gray-300 bg-white rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="Standard">Standard Room</option>
                <option value="Deluxe">Deluxe Room</option>
                <option value="Suite">Premium Suite</option>
                <option value="Presidential">Presidential Villa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Nightly Price (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  {...register('basePrice', {
                    required: 'Price is required',
                    min: { value: 1, message: 'Price must be greater than 0' }
                  })}
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand ${
                    errors.basePrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.basePrice && (
                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  {errors.basePrice.message}
                </p>
              )}
            </div>

            {/* Total Count */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Inventory (Rooms)</label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="Inventory"
                  {...register('totalCount', {
                    required: 'Rooms count is required',
                    min: { value: 1, message: 'Count must be at least 1' }
                  })}
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand ${
                    errors.totalCount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.totalCount && (
                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  {errors.totalCount.message}
                </p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Max Capacity</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <select
                  {...register('capacity')}
                  className="w-full border border-gray-300 bg-white rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Traveler' : 'Travelers'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Photo URLs */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Photo URLs (Comma-separated)</label>
            <div className="relative">
              <Image className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <textarea
                rows={2}
                placeholder="https://example.com/room1.jpg, https://example.com/room2.jpg"
                {...register('photosText')}
                className="w-full border border-gray-300 rounded-xl py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Amenities selection */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Select Amenities Offered</label>
            <div className="grid grid-cols-2 gap-2.5 bg-gray-50 border border-gray-150 p-4 rounded-xl">
              {ROOM_AMENITIES_OPTIONS.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    value={amenity}
                    {...register('amenities')}
                    className="w-4 h-4 text-brand border-gray-300 rounded-md focus:ring-brand cursor-pointer"
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Room</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomList;
