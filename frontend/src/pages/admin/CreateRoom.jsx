import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Bed, IndianRupee, Users, Sparkles, ShieldAlert, Save, ArrowLeft, Image, Layers } from 'lucide-react';
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

const CreateRoom = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Parse photos text by comma
      const photosArray = data.photosText
        ? data.photosText.split(',').map(url => url.trim()).filter(Boolean)
        : [];

      await axiosInstance.post(`/admin/hotels/${hotelId}/rooms`, {
        type: data.type,
        basePrice: parseFloat(data.basePrice),
        capacity: parseInt(data.capacity),
        totalCount: parseInt(data.totalCount),
        photos: photosArray,
        amenities: data.amenities || [],
      });
      toast.success('Room category added to property successfully!');
      navigate(`/admin/hotels/${hotelId}/rooms`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add room category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate(`/admin/hotels/${hotelId}/rooms`)}
        className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition cursor-pointer border-none bg-transparent"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Property Rooms</span>
      </button>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">Add Room Category</h1>
        <p className="text-gray-500 text-sm">Register lodging options, nightly rates, total inventory, and amenities.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Room Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Room Category Type</label>
            <div className="relative">
              <Bed className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <select
                {...register('type')}
                className="w-full border border-gray-300 bg-white rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="Standard">Standard Room</option>
                <option value="Deluxe">Deluxe Room</option>
                <option value="Suite">Premium Suite</option>
                <option value="Presidential">Presidential Villa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Nightly Price */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Nightly Price (₹ INR)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 145"
                  {...register('basePrice', {
                    required: 'Nightly price is required',
                    min: { value: 1, message: 'Price must be greater than 0' }
                  })}
                  className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
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
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Rooms Available (Inventory)</label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="e.g. 10"
                  {...register('totalCount', {
                    required: 'Total rooms count is required',
                    min: { value: 1, message: 'Count must be at least 1' }
                  })}
                  className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
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

            {/* Capacity Limit */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Max Traveler Capacity</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <select
                  {...register('capacity')}
                  className="w-full border border-gray-300 bg-white rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand cursor-pointer"
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
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Photo URLs (Comma-separated list)</label>
            <div className="relative">
              <Image className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <textarea
                rows={2}
                placeholder="https://example.com/room1.jpg, https://example.com/room2.jpg"
                {...register('photosText')}
                className="w-full border border-gray-300 rounded-xl py-2.5 pl-11 pr-3 text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Leave blank to auto-inherit stunning fallback resort room photos.</p>
          </div>

          {/* Amenities checklist */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Select Amenities Offered</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-gray-50 border border-gray-150 p-5 rounded-2xl">
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

          {/* Guidelines Info */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-xs text-gray-600 space-y-1">
            <p className="font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              Dynamic Room Launch
            </p>
            <p className="leading-relaxed">Adding a room category will automatically sync the inventory logs for this property, letting visitors query search locations immediately.</p>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/admin/hotels/${hotelId}/rooms`)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-5 py-3 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Registering...' : 'Register Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
