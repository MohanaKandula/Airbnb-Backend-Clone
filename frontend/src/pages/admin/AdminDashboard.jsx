import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { 
  Building, 
  CalendarDays, 
  IndianRupee, 
  Sparkles, 
  Compass, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle,
  XCircle,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const AdminDashboard = () => {
  const { user, verifyHost } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [confirmingBooking, setConfirmingBooking] = useState(null);
  
  // Analytics summary statistics
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0,
    occupancyRate: 0
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch managed hotels
      const hotelRes = await axiosInstance.get('/admin/hotels');
      const hotelList = Array.isArray(hotelRes.data.data) ? hotelRes.data.data : (Array.isArray(hotelRes.data) ? hotelRes.data : []);
      setHotels(hotelList);

      // 2. Fetch bookings for all managed hotels dynamically
      let allBookings = [];
      for (const hotel of hotelList) {
        try {
          const bookingsRes = await axiosInstance.get(`/admin/hotels/${hotel.id}/bookings`);
          const bookingsData = bookingsRes.data.data || bookingsRes.data;
          if (Array.isArray(bookingsData)) {
            // Format each booking to map status and price
            const formatted = bookingsData.map(b => ({
              ...b,
              hotelName: hotel.name,
              roomType: b.room?.type || 'Deluxe Room',
              totalPrice: b.amount,
              status: b.bookingStatus
            }));
            allBookings.push(...formatted);
          }
        } catch (bookingErr) {
          console.error(`Failed to fetch bookings for hotel ${hotel.id}:`, bookingErr);
        }
      }

      // Sort bookings by creation date descending
      allBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRecentBookings(allBookings);

      // 3. Fetch analytics from backend HostAnalyticsController
      try {
        const analyticsRes = await axiosInstance.get('/admin/analytics');
        const analytics = analyticsRes.data.data || analyticsRes.data;
        setStats({
          totalHotels: hotelList.length,
          totalBookings: analytics.totalBookings,
          totalRevenue: Math.round(analytics.totalRevenue),
          activeBookings: analytics.pendingBookings,
          occupancyRate: analytics.occupancyRate
        });
      } catch (analyticsErr) {
        console.warn("Failed to load host analytics API, falling back to manual calculations:", analyticsErr);
        const totalBookings = allBookings.length;
        const completedBookingsList = allBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'GUESTS_ADDED');
        const totalRevenue = completedBookingsList.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
        const activeBookings = allBookings.filter(b => b.status === 'PENDING' || b.status === 'INITIAL' || b.status === 'RESERVED' || b.status === 'PAYMENTS_PENDING').length;
        setStats({
          totalHotels: hotelList.length,
          totalBookings: totalBookings,
          totalRevenue: Math.round(totalRevenue),
          activeBookings: activeBookings,
          occupancyRate: 0
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      toast.error('Could not populate dashboard overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCompleteVerification = async () => {
    setVerifying(true);
    try {
      await verifyHost();
      toast.success('Identity verified successfully! Payouts are now unlocked.');
      setShowVerificationModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to complete verification.');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (booking) => {
    const status = booking.bookingStatus || booking.status;
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Confirmed</span>;
      case 'CANCELLED':
        return <span className="bg-red-50 border border-red-200 text-red-600 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Cancelled</span>;
      case 'PAYMENTS_PENDING':
        if (booking.paymentSessionId === 'CASH') {
          return <span className="bg-amber-50 border border-amber-250 text-amber-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Pending Cash</span>;
        }
        return <span className="bg-amber-50 border border-amber-200 text-amber-605 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase animate-pulse">Stripe Pending</span>;
      default:
        return <span className="bg-slate-50 border border-slate-200 text-slate-650 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Reserved</span>;
    }
  };

  const handleConfirmCashSubmit = async () => {
    if (!confirmingBooking) return;
    try {
      await axiosInstance.post(`/bookings/${confirmingBooking.id}/confirm-cash`);
      toast.success(`Cash payment of ₹${confirmingBooking.totalPrice} verified successfully!`);
      setConfirmingBooking(null);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm cash receipt.');
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
    <div className="space-y-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">Host Manager Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of listed accommodations, total companion reservations, and financial logs.</p>
        </div>

        <Link
          to="/admin/hotels/create"
          className="flex items-center justify-center space-x-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Property</span>
        </Link>
      </div>

      {!user?.isVerifiedHost && (
        <div className="bg-amber-50 border border-amber-250 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 margin-0">Payouts Locked (Identity Verification Required)</h4>
              <p className="text-gray-500 text-xs mt-1 margin-0">
                You have active guest bookings! To comply with host safety regulations and unlock earnings, please complete a quick progressive verification check.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowVerificationModal(true)}
            className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer border-none"
          >
            Verify Identity Now
          </button>
        </div>
      )}

      {/* Analytics KPI row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">My Stays</span>
            <span className="font-extrabold text-2xl text-gray-900 block">{stats.totalHotels} Properties</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Bookings</span>
            <span className="font-extrabold text-2xl text-gray-900 block">{stats.totalBookings} Reservs</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Gross Revenue</span>
            <span className="font-extrabold text-2xl text-gray-900 block">₹{stats.totalRevenue} INR</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Pending Payment</span>
            <span className="font-extrabold text-2xl text-gray-900 block">{stats.activeBookings} Sessions</span>
          </div>
        </div>

        {/* Metric 5: Occupancy Rate */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-55 bg-opacity-10 text-teal-600 flex items-center justify-center flex-shrink-0 bg-teal-50">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Occupancy Rate</span>
            <span className="font-extrabold text-2xl text-gray-900 block">{stats.occupancyRate || 0}% Avg</span>
          </div>
        </div>
      </section>

      {/* Tables layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings (Col-span 2) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-extrabold text-gray-900 text-base">Recent Room Reservations</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/20 text-gray-500 font-bold text-xs uppercase border-b border-gray-150">
                  <th className="px-6 py-3.5">Stay</th>
                  <th className="px-6 py-3.5">Travelers</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/25 transition">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-gray-950">{b.hotelName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{b.roomType} • {b.checkInDate} to {b.checkOutDate}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-500">
                      {b.guests?.map(g => g.name).join(', ') || 'Primary Guest'}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">₹{b.totalPrice}</td>
                    <td className="px-6 py-3.5">{getStatusBadge(b)}</td>
                    <td className="px-6 py-3.5">
                      {b.status === 'PAYMENTS_PENDING' && b.paymentSessionId === 'CASH' && (
                        <button
                          onClick={() => setConfirmingBooking(b)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer border-none"
                        >
                          Confirm Cash
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                      No customer reservations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stays catalog (Col-span 1) */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-gray-900 text-base">My Properties</h3>
            <Link to="/admin/hotels" className="text-brand hover:underline text-xs font-bold flex items-center">
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-1">
            {hotels.slice(0, 4).map((hotel) => (
              <div key={hotel.id} className="py-3 flex items-center justify-between text-xs gap-2">
                <div className="space-y-0.5 max-w-[60%]">
                  <p className="font-bold text-gray-950 truncate">{hotel.name}</p>
                  <p className="text-gray-400">{hotel.city}</p>
                </div>
                <div className="flex items-center space-x-1.5">
                  {(hotel.latitude && hotel.longitude) && (
                    <button
                      onClick={() => setSelectedHotel(hotel)}
                      className="bg-transparent hover:bg-gray-100 border border-gray-250 rounded-lg text-[9px] font-bold py-1 px-2 cursor-pointer text-gray-600 transition"
                    >
                      Map
                    </button>
                  )}
                  <span className={`font-bold text-[9px] px-2 py-0.5 rounded-full border uppercase ${
                    hotel.isActive
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-600'
                  }`}>
                    {hotel.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
            {hotels.length === 0 && (
              <p className="text-gray-400 italic text-center py-8">No hotels active.</p>
            )}
          </div>
        </div>
      </div>

      {/* Progressive Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <h3 className="text-lg font-extrabold text-gray-950 margin-0">Complete Identity Verification</h3>
            <p className="text-gray-500 text-xs margin-0">
              To verify your identity as a trusted property host, please complete a mock KYC upload. This simulation represents Stripe Identity verification.
            </p>
            
            <div className="border border-dashed border-gray-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2.5">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
              <div className="text-xs font-bold text-gray-900">Upload Government-issued Photo ID</div>
              <p className="text-[10px] text-gray-400 max-w-[200px]">Supports PNG, JPG, or PDF format up to 5MB.</p>
              <input type="file" className="hidden" id="verifiedDocInput" onChange={() => toast.success('Mock ID uploaded successfully!')} />
              <label htmlFor="verifiedDocInput" className="bg-gray-150 hover:bg-gray-200 text-gray-800 font-extrabold text-[10px] py-2 px-3.5 rounded-lg transition cursor-pointer">
                Choose File
              </label>
            </div>

            <div className="flex justify-end gap-3.5">
              <button
                onClick={() => setShowVerificationModal(false)}
                className="bg-transparent hover:bg-gray-50 text-gray-600 border border-gray-250 rounded-xl font-bold text-xs py-2.5 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteVerification}
                disabled={verifying}
                className="bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs py-2.5 px-5 cursor-pointer shadow-md"
              >
                {verifying ? 'Verifying...' : 'Complete Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Preview Modal */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold text-gray-950 margin-0">{selectedHotel.name}</h3>
                <p className="text-gray-500 text-xs mt-1 margin-0">
                  {selectedHotel.contactInfo?.address || 'No street address'}, {selectedHotel.city}, {selectedHotel.state}
                </p>
              </div>
              <span className={`font-bold text-[9px] px-2 py-0.5 rounded-full border uppercase ${
                selectedHotel.isActive
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {selectedHotel.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Leaflet Map view */}
            <div className="border border-gray-250 rounded-2xl overflow-hidden shadow-xs relative" style={{ height: '350px', zIndex: 10 }}>
              <MapContainer 
                center={[selectedHotel.latitude || 15.2993, selectedHotel.longitude || 74.1240]} 
                zoom={14} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[selectedHotel.latitude || 15.2993, selectedHotel.longitude || 74.1240]}>
                  <Popup>
                    <span className="font-bold text-xs">{selectedHotel.name}</span>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="flex justify-end gap-3.5">
              <button
                onClick={() => setSelectedHotel(null)}
                className="bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs py-2.5 px-5 cursor-pointer shadow-md border-none"
              >
                Close Map Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cash Receipt Modal */}
      {confirmingBooking && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-gray-950 margin-0">Confirm Cash Payment</h3>
              <p className="text-gray-500 text-xs mt-1 margin-0">Verify physical receipt of traveler cash before locking stay inventory.</p>
            </div>

            <div className="bg-gray-50 border border-gray-150 p-4.5 rounded-2xl text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Guest stay</span>
                <span className="font-extrabold text-gray-950 truncate max-w-[60%]">{confirmingBooking.hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Dates</span>
                <span className="font-semibold text-gray-800">{confirmingBooking.checkInDate} to {confirmingBooking.checkOutDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Room type</span>
                <span className="font-semibold text-gray-800">{confirmingBooking.roomType}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-extrabold text-sm">
                <span className="text-gray-950">Cash Amount Due</span>
                <span className="text-emerald-600">₹{confirmingBooking.totalPrice} INR</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              ⚠️ <strong>Important:</strong> Ensure you have physically received ₹{confirmingBooking.totalPrice} in cash from the guest. Confirming will mark this booking as **CONFIRMED** and update your hotel occupancy inventory logs immediately.
            </p>

            <div className="flex justify-end gap-3.5">
              <button
                onClick={() => setConfirmingBooking(null)}
                className="bg-transparent hover:bg-gray-50 text-gray-650 border border-gray-250 rounded-xl font-bold text-xs py-2.5 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCashSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs py-2.5 px-5 cursor-pointer shadow-md border-none"
              >
                Confirm Payment Received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
