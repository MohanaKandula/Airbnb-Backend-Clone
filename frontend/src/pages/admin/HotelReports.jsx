import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarChart3, TrendingUp, IndianRupee, Calendar, Compass, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const HotelReports = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch managed properties list on mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axiosInstance.get('/admin/hotels');
        const data = response.data.data || response.data;
        const list = Array.isArray(data) ? data : [];
        setHotels(list);
        if (list.length > 0) {
          setSelectedHotelId(list[0].id);
        }
      } catch (err) {
        toast.error('Failed to load properties for reports dropdown.');
      }
    };
    fetchHotels();
  }, []);

  // Fetch reports details
  const fetchReportDetails = async () => {
    if (!selectedHotelId) return;
    setLoading(true);
    try {
      // Fetch report summary
      const reportRes = await axiosInstance.get(`/admin/hotels/${selectedHotelId}/reports`);
      const reportData = reportRes.data.data || reportRes.data;

      // Fetch all bookings for detailed analytics
      const bookingsRes = await axiosInstance.get(`/admin/hotels/${selectedHotelId}/bookings`);
      const bookingsList = bookingsRes.data.data || bookingsRes.data || [];

      // Calculate analytics dynamically
      const completed = bookingsList.filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'GUESTS_ADDED').length;
      const cancelled = bookingsList.filter(b => b.bookingStatus === 'CANCELLED').length;
      
      // Calculate monthly earnings dynamically (last 5 months)
      const monthlyData = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const last5Months = [];
      for (let i = 4; i >= 0; i--) {
        const m = (currentMonth - i + 12) % 12;
        last5Months.push(monthNames[m]);
        monthlyData[monthNames[m]] = 0;
      }

      bookingsList.forEach(b => {
        if (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'GUESTS_ADDED') {
          const date = new Date(b.createdAt || b.checkInDate);
          const mName = monthNames[date.getMonth()];
          if (monthlyData[mName] !== undefined) {
            monthlyData[mName] += b.amount || 0;
          }
        }
      });

      const earningsArray = last5Months.map(m => Math.round(monthlyData[m]));

      // Calculate room occupancy ratios
      const roomTypes = {};
      bookingsList.forEach(b => {
        const rType = b.roomType || 'Standard Room';
        if (!roomTypes[rType]) {
          roomTypes[rType] = { count: 0, revenue: 0 };
        }
        roomTypes[rType].count += b.roomsCount || 1;
        if (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'GUESTS_ADDED') {
          roomTypes[rType].revenue += b.amount || 0;
        }
      });

      const occupancyRatios = Object.keys(roomTypes).map(type => {
        const totalRooms = 20; // assumed total for percentage
        const ratio = Math.min(100, Math.round((roomTypes[type].count / totalRooms) * 100)) || 10;
        return {
          type,
          ratio,
          revenue: Math.round(roomTypes[type].revenue)
        };
      });

      const processedReport = {
        hotelName: hotels.find(h => h.id.toString() === selectedHotelId.toString())?.name || 'Grand Resort Stay',
        totalRevenue: Math.round(reportData.totalRevenue || 0),
        completedBookings: completed,
        cancelledBookings: cancelled,
        occupancyRate: bookingsList.length === 0 ? 0 : Math.round((completed / bookingsList.length) * 100),
        occupancyRatios: occupancyRatios.length > 0 ? occupancyRatios : [
          { type: 'Standard Room', ratio: 20, revenue: 0 }
        ],
        monthlyEarnings: earningsArray,
        monthlyLabels: last5Months
      };

      setReport(processedReport);
    } catch (err) {
      console.error('Failed to load performance reports:', err);
      toast.error('Failed to load dynamic performance reports.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [selectedHotelId]);

  if (loading && !report) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">Accommodations Performance Reports</h1>
          <p className="text-gray-500 text-sm">Select a hotel to query occupancy statistics, revenue summaries, and traveler cancellation analytics.</p>
        </div>

        <div>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="border border-gray-300 bg-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand cursor-pointer font-bold"
          >
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
            {hotels.length === 0 && (
              <option value="">No properties registered</option>
            )}
          </select>
        </div>
      </div>

      {report && !loading && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Summary KPIs Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Revenue</span>
                <span className="font-extrabold text-xl text-gray-900 block">₹{report.totalRevenue} INR</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Occupancy Ratio</span>
                <span className="font-extrabold text-xl text-gray-900 block">{report.occupancyRate}% Rate</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Completed stays</span>
                <span className="font-extrabold text-xl text-gray-900 block">{report.completedBookings} Guests</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Cancellations</span>
                <span className="font-extrabold text-xl text-gray-900 block">{report.cancelledBookings} sessions</span>
              </div>
            </div>
          </section>

          {/* Revenue Graph & Occupancy Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visual SVG Trend Graph (Col span 2) */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">Revenue Growth Trend</h3>
              
              {/* Premium HTML SVG Graphic representing trends */}
              <div className="h-64 relative flex items-end justify-between pt-6 px-4">
                <div className="absolute inset-0 flex flex-col justify-between py-6 text-[10px] text-gray-400 font-bold pointer-events-none select-none">
                  <span>₹{Math.round(Math.max(...(report.monthlyEarnings || []), 1000))}</span>
                  <span>₹{Math.round(Math.max(...(report.monthlyEarnings || []), 1000) * 0.66)}</span>
                  <span>₹{Math.round(Math.max(...(report.monthlyEarnings || []), 1000) * 0.33)}</span>
                  <span>₹0</span>
                </div>
                
                <svg className="w-full h-full absolute inset-0 pt-6 px-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d={(() => {
                      const earnings = report.monthlyEarnings || [0, 0, 0, 0, 0];
                      const maxVal = Math.max(...earnings, 1000);
                      const points = earnings.map((val, idx) => {
                        const x = (idx / (earnings.length - 1)) * 100;
                        const y = 90 - (val / maxVal) * 80;
                        return `${x},${y}`;
                      });
                      return points.reduce((acc, p, idx) => idx === 0 ? `M ${p}` : `${acc} L ${p}`, '');
                    })()}
                    fill="none"
                    stroke="#FF5A5F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={(() => {
                      const earnings = report.monthlyEarnings || [0, 0, 0, 0, 0];
                      const maxVal = Math.max(...earnings, 1000);
                      const points = earnings.map((val, idx) => {
                        const x = (idx / (earnings.length - 1)) * 100;
                        const y = 90 - (val / maxVal) * 80;
                        return `${x},${y}`;
                      });
                      const line = points.reduce((acc, p, idx) => idx === 0 ? `M ${p}` : `${acc} L ${p}`, '');
                      return `${line} L 100 100 L 0 100 Z`;
                    })()}
                    fill="url(#gradient)"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF5A5F" />
                      <stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Graph bottom month labels */}
                <div className="w-full flex justify-between text-[10px] text-gray-400 font-bold mt-2 pt-2 border-t border-gray-100">
                  {report.monthlyLabels?.map((m, idx) => (
                    <span key={idx}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Category Allocations (Col span 1) */}
            <div className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">Room Categories</h3>
              
              <div className="space-y-4">
                {report.occupancyRatios?.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-900">
                      <span>{item.type}</span>
                      <span>{item.ratio}% occupancy</span>
                    </div>
                    {/* Visual custom HTML meter */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.ratio}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Generated ₹{item.revenue} gross revenue</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelReports;
