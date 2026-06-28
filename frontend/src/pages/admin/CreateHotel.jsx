import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Building, MapPin, Sparkles, ShieldAlert, Image, Save, ArrowLeft, Phone, Mail, Compass, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon bug in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true} 
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        }
      }} 
    />
  );
};

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

const CreateHotel = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState([15.2993, 74.1240]); // Default to Baga, Goa
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

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
        location: '15.2993, 74.1240',
      },
      isActive: true,
    },
  });

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPosition([lat, lon]);
        
        // Auto-populate city & state from addressdetails
        const addr = data[0].address;
        if (addr) {
          const cityVal = addr.city || addr.town || addr.village || addr.county || '';
          const stateVal = addr.state || '';
          if (cityVal) setValue('city', cityVal);
          if (stateVal) setValue('state', stateVal);
        }
        
        toast.success(`Location centered: ${data[0].display_name}`);
      } else {
        toast.warning('Location not found. Drag map pin manually.');
      }
    } catch (err) {
      console.error('Error finding address coordinates:', err);
      toast.error('Search failed. OpenStreetMap search timed out.');
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Parse photos text by comma
      const photosArray = data.photosText
        ? data.photosText.split(',').map(url => url.trim()).filter(Boolean)
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"];

      await axiosInstance.post('/admin/hotels', {
        name: data.name,
        city: data.city,
        state: data.state,
        photos: photosArray,
        amenities: data.amenities || [],
        contactInfo: {
          address: data.contactInfo.address,
          phoneNumber: data.contactInfo.phoneNumber,
          email: data.contactInfo.email,
          location: `${position[0]}, ${position[1]}`,
        },
        latitude: position[0],
        longitude: position[1],
        isActive: data.isActive,
      });

      toast.success('Hotel registered successfully! Add some rooms next.');
      navigate('/admin/hotels');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create hotel.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">Register New Property</h1>
        <p className="text-gray-500 text-sm">Add hotel attributes, geolocation, contact details, and custom amenities to launch hosting.</p>
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
                    placeholder="e.g. Royal Grand Plaza Resort"
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
                    placeholder="e.g. Goa"
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
                    placeholder="e.g. Goa"
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
                    placeholder="e.g. Benaulim Beach Road, Goa"
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
                    placeholder="e.g. +91 98765 43210"
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
                    placeholder="e.g. contact@hotel.com"
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

              <div className="sm:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">
                  Property Geolocation coordinates (Drag pin or click map)
                </label>
                
                {/* Search bar */}
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search street, city, or landmark to place pin..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand"
                    />
                  </div>
                  <button
                    onClick={handleSearchLocation}
                    disabled={searching}
                    className="bg-gray-900 hover:bg-black text-white px-5 rounded-xl font-bold text-xs cursor-pointer border-none shadow-xs"
                  >
                    {searching ? 'Locating...' : 'Locate'}
                  </button>
                </div>

                {/* Coordinates readouts */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-150 p-3.5 rounded-xl text-xs font-semibold text-gray-700">
                  <div>Latitude: <span className="font-mono text-brand font-bold">{position[0].toFixed(6)}</span></div>
                  <div>Longitude: <span className="font-mono text-brand font-bold">{position[1].toFixed(6)}</span></div>
                </div>

                {/* Leaflet Map picker */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs relative" style={{ height: '300px', zIndex: 10 }}>
                  <MapContainer 
                    center={position} 
                    zoom={13} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
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
              <p className="text-[10px] text-gray-400 mt-1">Leave blank to auto-inherit highly premium fallback resort photos.</p>
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
              Launch Property Active Instantly (Visible to Travelers)
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
              <span>{submitting ? 'Registering...' : 'Register Property'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateHotel;
