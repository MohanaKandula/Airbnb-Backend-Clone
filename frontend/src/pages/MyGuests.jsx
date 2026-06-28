import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import GuestCard from '../components/GuestCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { Plus, Users, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

const MyGuests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      age: '',
      gender: 'MALE',
      isPrimary: false,
    },
  });

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/users/guests');
      const data = response.data.data || response.data;
      setGuests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch guests:', err);
      toast.error('Failed to load guest list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleOpenAdd = () => {
    setEditingGuest(null);
    reset({
      name: '',
      age: '',
      gender: 'MALE',
      isPrimary: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (guest) => {
    setEditingGuest(guest);
    setValue('name', guest.name);
    setValue('age', guest.age);
    setValue('gender', guest.gender);
    setValue('isPrimary', guest.isPrimary);
    setIsModalOpen(true);
  };

  const handleDelete = async (guestId) => {
    if (window.confirm('Are you sure you want to delete this traveler profile?')) {
      try {
        await axiosInstance.delete(`/users/guests/${guestId}`);
        toast.success('Traveler deleted successfully!');
        fetchGuests();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete traveler.');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        age: parseInt(data.age),
        gender: data.gender,
        isPrimary: data.isPrimary,
      };

      if (editingGuest) {
        // Update Guest
        await axiosInstance.put(`/users/guests/${editingGuest.id}`, payload);
        toast.success('Traveler profile updated successfully!');
      } else {
        // Create Guest
        await axiosInstance.post('/users/guests', payload);
        toast.success('Traveler registered successfully!');
      }
      setIsModalOpen(false);
      fetchGuests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save traveler profile.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">My Travelers & Guests</h1>
          <p className="text-gray-500 text-sm">Register your travel companion profiles here to expedite room reservations.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Guest</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="large" />
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">No travelers registered</h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
              Save guest details once and instantly register them during checkout. Perfect for family vacations or group stays!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 bg-gray-900 hover:bg-brand hover:text-white border border-gray-300 text-gray-700 font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition duration-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register First Guest</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guests.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Register/Edit Traveler Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGuest ? 'Update Traveler Details' : 'Register New Traveler'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Guest Name */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Srikari Kandula"
              {...register('name', {
                required: 'Full name is required',
                minLength: { value: 3, message: 'Name must be at least 3 characters' }
              })}
              className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                <ShieldAlert className="w-3 h-3 mr-1" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Guest Age */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Age</label>
              <input
                type="number"
                placeholder="e.g. 24"
                {...register('age', {
                  required: 'Age is required',
                  min: { value: 1, message: 'Age must be greater than 0' },
                  max: { value: 120, message: 'Invalid age range' }
                })}
                className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.age && (
                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  {errors.age.message}
                </p>
              )}
            </div>

            {/* Guest Gender */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Gender</label>
              <select
                {...register('gender')}
                className="w-full border border-gray-300 bg-white rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Is Primary Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isPrimary"
              {...register('isPrimary')}
              className="w-4 h-4 text-brand border-gray-300 rounded-md focus:ring-brand cursor-pointer"
            />
            <label htmlFor="isPrimary" className="text-xs font-bold text-gray-950 cursor-pointer uppercase tracking-wider">
              Mark as Primary Traveler Profile
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand hover:bg-brand-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              {editingGuest ? 'Update Profile' : 'Register Guest'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyGuests;
