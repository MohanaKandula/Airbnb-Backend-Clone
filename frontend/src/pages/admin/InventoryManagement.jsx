import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Database, ShieldAlert, Sparkles, Home, ArrowRight, Save, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const InventoryManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [surgeFactor, setSurgeFactor] = useState('1.0');
  const [closed, setClosed] = useState(false);

  // Fetch hotels list on mount to populate select dropdown
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
        toast.error('Failed to load hotels list.');
      }
    };
    fetchHotels();
  }, []);

  // Fetch rooms list when hotel changes
  useEffect(() => {
    if (!selectedHotelId) return;
    const fetchRooms = async () => {
      try {
        const response = await axiosInstance.get(`/admin/hotels/${selectedHotelId}/rooms`);
        const data = response.data.data || response.data;
        const list = Array.isArray(data) ? data : [];
        setRooms(list);
        if (list.length > 0) {
          setSelectedRoomId(list[0].id);
        } else {
          setSelectedRoomId('');
          setInventoryList([]);
        }
      } catch (err) {
        toast.error('Failed to load rooms list for selected hotel.');
      }
    };
    fetchRooms();
  }, [selectedHotelId]);

  // Query inventory logs when room changes
  const queryInventory = async () => {
    if (!selectedRoomId) {
      toast.warning('Please select a room category first.');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/admin/inventory/rooms/${selectedRoomId}`);
      const data = response.data.data || response.data;
      const list = Array.isArray(data) ? data : [];
      setInventoryList(list.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      console.error('Failed to query inventory:', err);
      toast.error('Failed to load inventory logs from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoomId) {
      queryInventory();
    }
  }, [selectedRoomId]);

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    
    setSaving(true);
    try {
      await axiosInstance.patch(`/admin/inventory/rooms/${selectedRoomId}`, {
        startDate: startDate,
        endDate: endDate,
        surgeFactor: parseFloat(surgeFactor) || 1.0,
        closed: closed
      });
      toast.success('Inventory settings patched successfully!');
      
      // Re-query inventory
      await queryInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update inventory logs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 margin-0">Inventory & Allotment Management</h1>
        <p className="text-gray-500 text-sm">Select a property, query specific room logs, and block or release active room allotments.</p>
      </div>

      {/* Query panel card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Select Hotel</label>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            className="w-full border border-gray-300 bg-white rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand cursor-pointer font-medium"
          >
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
            {hotels.length === 0 && (
              <option value="">No hotels registered</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Select Room Category</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={rooms.length === 0}
            className="w-full border border-gray-300 bg-white rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.type} Room</option>
            ))}
            {rooms.length === 0 && (
              <option value="">No room sizes registered</option>
            )}
          </select>
        </div>

        <button
          onClick={queryInventory}
          disabled={!selectedRoomId || loading}
          className="flex items-center justify-center space-x-2 bg-gray-900 hover:bg-brand text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Database className="w-4 h-4" />
          <span>{loading ? 'Querying...' : 'Query Inventory Logs'}</span>
        </button>
      </div>

      {/* Load Spinner */}
      {loading && (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="large" />
        </div>
      )}

      {/* Inventory controls */}
      {inventoryList.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
          
          {/* Inventory Table List (Col span 3) */}
          <div className="md:col-span-3 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-gray-900 text-base border-b border-gray-100 pb-2">Active Inventory Log (Next 30 Days)</h3>
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 font-bold uppercase border-b border-gray-150">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total Rooms</th>
                    <th className="px-4 py-3">Booked</th>
                    <th className="px-4 py-3">Reserved</th>
                    <th className="px-4 py-3">Surge Factor</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {inventoryList.slice(0, 30).map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/25">
                      <td className="px-4 py-3 font-bold">{inv.date}</td>
                      <td className="px-4 py-3">{inv.totalCount}</td>
                      <td className="px-4 py-3">{inv.bookedCount}</td>
                      <td className="px-4 py-3">{inv.reservedCount}</td>
                      <td className="px-4 py-3 font-mono">{inv.surgeFactor}x</td>
                      <td className="px-4 py-3 font-bold text-brand">${Math.round(inv.price)}</td>
                      <td className="px-4 py-3">
                        {inv.closed ? (
                          <span className="bg-red-50 text-red-700 border border-red-150 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">Closed / Blocked</span>
                        ) : (
                          <span className="bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form controls (Col span 3) */}
          <div className="md:col-span-3 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="font-extrabold text-gray-900 text-base">Adjust Allotments, Surge & Blocks</h3>

            <form onSubmit={handleUpdateInventory} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-brand font-semibold text-gray-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-brand font-semibold text-gray-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Surge Price Factor</label>
                <select
                  value={surgeFactor}
                  onChange={(e) => setSurgeFactor(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-brand cursor-pointer font-semibold"
                >
                  <option value="1.0">1.0x (Standard Price)</option>
                  <option value="1.2">1.2x (Slight Surge)</option>
                  <option value="1.5">1.5x (Medium Surge)</option>
                  <option value="1.8">1.8x (High Demand)</option>
                  <option value="2.0">2.0x (Peak Season)</option>
                  <option value="2.5">2.5x (Mega Holiday)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-150 p-4 rounded-xl self-end h-[50px]">
                <input
                  type="checkbox"
                  id="invClosed"
                  checked={closed}
                  onChange={(e) => setClosed(e.target.checked)}
                  className="w-4 h-4 text-brand border-gray-300 rounded-md focus:ring-brand cursor-pointer"
                />
                <label htmlFor="invClosed" className="text-xs font-bold text-gray-900 cursor-pointer uppercase tracking-wider">
                  Block Room bookings for this range
                </label>
              </div>

              <div className="sm:col-span-2 pt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Patching...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
