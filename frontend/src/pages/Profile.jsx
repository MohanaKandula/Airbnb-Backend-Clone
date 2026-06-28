import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldAlert, Award, FileText, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || user?.fullName || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await updateProfile({ name: data.name });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete('/users/profile');
      toast.info('Your account has been deleted successfully.', {
        position: "top-right",
        autoClose: 5000,
        theme: "colored"
      });
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getRoleLabel = () => {
    const userRoles = [user?.role, ...(user?.roles || [])].filter(Boolean);
    if (userRoles.includes('ROLE_HOTEL_MANAGER')) return 'Hotel Host Manager';
    return 'Traveler Guest';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">My Account Profile</h1>
        <p className="text-gray-500 text-sm">Review profile attributes, role permissions, and modify personal settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Card: Summary & Roles */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-3xl shadow-md border-4 border-white ring-4 ring-brand/10">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-lg leading-tight truncate max-w-[220px]">
              {user?.name || user?.fullName || 'User Profile'}
            </h3>
            <span className="inline-block bg-brand/10 text-brand font-bold text-[10px] px-3 py-1 rounded-full border border-brand/20 uppercase tracking-wider">
              {getRoleLabel()}
            </span>
          </div>

          <hr className="w-full border-gray-100" />

          <div className="w-full text-left space-y-3 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Email Status</span>
              <span className="text-green-600 flex items-center font-semibold">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Verified
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">System ID</span>
              <span className="text-gray-400 font-mono">#{user?.id || '28471'}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Fields Editing (Col-span 2) */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h3 className="font-extrabold text-gray-900 text-lg">Personal Settings</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mohana Kandula"
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: {
                      value: 3,
                      message: 'Name must be at least 3 characters',
                    },
                  })}
                  className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none ${
                    errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  disabled
                  {...register('email')}
                  className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-xl py-3 pl-11 pr-3 text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Contact administrators if you need to modify your primary email address.</p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-red-50/50 border border-red-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-lg">Danger Zone</h3>
            <p className="text-gray-500 text-sm">
              Permanently delete your account. This action cannot be undone, and you will lose access to all your settings, wishlists, and guest rosters.
            </p>
          </div>
        </div>
        <div className="pt-2 flex justify-start">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-gray-900">Are you absolutely sure?</h3>
                <p className="text-gray-500 text-sm">
                  This action is irreversible. All your profile settings, saved wishlists, and registered companion rosters will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
