import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Building, MapPin, Sparkles, ShieldAlert, Image, Save, ArrowLeft, Phone, Mail, Compass } from 'lucide-react';
import { toast } from 'react-toastify';

const AMENITIES_OPTIONS = [
  "Free WiFi",
  "Air Conditioning",
  "Swimming Pool",
  "Fitness Center",
  "Spa Therapy",
  "Valet Parking",
  "Fine Dining",
  "Lounge Bar",
  "Sky Bar"
];

const UpdateHotel = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      city: '',
      photosText: '',
      amenities: [],
      contactInfo: {
        address: '',
        phoneNumber: '',
        email: '',
        location: '',
      },
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchHotelDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/admin/hotels/${hotelId}`);
        const data = response.data.data || response.data;
        
        // Populate fields
        setValue('name', data.name);
        setValue('city', data.city);
        setValue('photosText', data.photos ? data.photos.join(', ') : '');
        setValue('amenities', data.amenities || []);
        setValue('contactInfo.address', data.contactInfo?.address || '');
        setValue('contactInfo.phoneNumber', data.contactInfo?.phoneNumber || '');
        setValue('contactInfo.email', data.contactInfo?.email || '');
        setValue('contactInfo.location', data.contactInfo?.location || '');
        setValue('isActive', data.isActive ?? true);
      } catch (err) {
        toast.error('Failed to load hotel profile for editing.');
        navigate('/admin/hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId, setValue, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const photosArray = data.photosText
        ? data.photosText.split(',').map(url => url.trim()).filter(Boolean)
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"];

      await axiosInstance.put(`/admin/hotels/${hotelId}`, {
        name: data.name,
        city: data.city,
        photos: photosArray,
        amenities: data.amenities || [],
        contactInfo: {
          address: data.contactInfo.address,
          phoneNumber: data.contactInfo.phoneNumber,
          email: data.contactInfo.email,
          location: data.contactInfo.location || '0.0, 0.0',
        },
        isActive: data.isActive,
      });

      toast.success('Hotel profile updated successfully!');
      navigate('/admin/hotels');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update hotel.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/hotels')}
        className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition cursor-pointer border-none bg-transparent"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hotels List</span>
      </button>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">Update Property Details</h1>
        <p className="text-gray-500 text-sm">Modify lodging parameters, geolocations, contact information, and listed amenities.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* section 1: General Info */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-2">Property Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Hotel / Property Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Hotel Name"
                    {...register('name', {
                      required: 'Hotel name is required',
                      minLength: { value: 3, message: 'Name must be at least 3 characters' }
                    })}
                    className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
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

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">City Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City"
                    {...register('city', { required: 'City location is required' })}
                    className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.city && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">State Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="State"
                    {...register('state', { required: 'State location is required' })}
                    className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.state && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    {errors.state.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* section 2: Contact Info */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-2">Contact & Geolocation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Address"
                    {...register('contactInfo.address', { required: 'Street address is required' })}
                    className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
                      errors.contactInfo?.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.contactInfo?.address && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    {errors.contactInfo.address.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Phone number"
                    {...register('contactInfo.phoneNumber', { required: 'Phone number is required' })}
                    className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
                      errors.contactInfo?.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.contactInfo?.phoneNumber && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    {errors.contactInfo.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Contact Email"
                    {...register('contactInfo.email', { 
                      required: 'Contact email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
                      errors.contactInfo?.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.contactInfo?.email && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    {errors.contactInfo.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">GPS Coordinates (Latitude, Longitude)</label>
                <div className="relative">
                  <Compass className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. 15.2489, 73.9278"
                    {...register('contactInfo.location', { required: 'GPS Coordinates are required' })}
                    className={`w-full border rounded-xl py-3 pl-11 pr-3 text-sm focus:outline-none focus:border-brand ${
                      errors.contactInfo?.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.contactInfo?.location && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    {errors.contactInfo.location.message}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* section 3: Amenities & Photos */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-2">Photos & Amenities</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Photo URLs (Comma-separated list)</label>
              <div className="relative">
                <Image className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <textarea
                  rows={2}
                  placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                  {...register('photosText')}
                  className="w-full border border-gray-300 rounded-xl py-2.5 pl-11 pr-3 text-sm focus:outline-none focus:border-brand"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Leave blank to auto-inherit high-resolution fallback photos.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Select Amenities Offered</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-gray-50 border border-gray-150 p-5 rounded-2xl">
                {AMENITIES_OPTIONS.map((amenity) => (
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
          </div>

          {/* Active status */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-150 p-4 rounded-xl">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 text-brand border-gray-300 rounded-md focus:ring-brand cursor-pointer"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-gray-900 cursor-pointer uppercase tracking-wider">
              Keep Property Active (Visible to Travelers)
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/hotels')}
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
              <span>{submitting ? 'Updating...' : 'Update Property'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UpdateHotel;
