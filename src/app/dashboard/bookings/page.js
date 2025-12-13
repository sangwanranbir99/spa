'use client';

import { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';

const CreateBookingPage = () => {
  const { selectedBranch, getBranchId } = useBranch();

  // Helper function to get current date in YYYY-MM-DD format (IST)
  const getCurrentDate = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  // Helper function to get current time in HH:MM format (IST)
  const getCurrentTime = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    clientName: '',
    clientContact: '',
    massage: '',
    massageDate: getCurrentDate(),
    massageTime: getCurrentTime(),
    massageEndTime: '',
    sessionTime: '',
    massageType: '',
    massagePrice: 0,
    staffDetails: '',
    cash: 0,
    card: 0,
    upi: 0,
    otherPayment: 0,
    roomNumber: ''
  });

  const [employees, setEmployees] = useState([]);
  const [massages, setMassages] = useState([]);
  const [clientBookings, setClientBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedMassageData, setSelectedMassageData] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchMassages();
    fetchRooms();

    // Calculate end time when component mounts
    if (formData.sessionTime) {
      setFormData(prev => ({
        ...prev,
        massageEndTime: calculateEndTime(prev.massageTime, prev.sessionTime)
      }));
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (formData.clientContact.length === 10) {
      fetchClientBookings();
    } else {
      setClientBookings([]);
    }
  }, [formData.clientContact]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      // Get the branch ID for filtering
      let branchId = getBranchId();

      // For manager/employee, get their assigned branch
      if (role !== 'admin') {
        const branchesStr = localStorage.getItem('branches');
        if (branchesStr) {
          const branches = JSON.parse(branchesStr);
          if (branches && branches.length > 0) {
            branchId = branches[0]._id;
          }
        }
      }

      const branchParam = branchId ? `?branchId=${branchId}` : '';

      const response = await fetch(`/api/users${branchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        // Filter to only include users with role 'employee'
        const employeesOnly = data?.users?.filter(user =>
          user.role?.toLowerCase() === 'employee'
        ) || [];
        setEmployees(employeesOnly);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMassages = async () => {
    try {
      const token = localStorage.getItem('token');
      const branchId = getBranchId();
      const branchParam = branchId ? `?branchId=${branchId}` : '';

      const response = await fetch(`/api/massages${branchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMassages(data || []);
      }
    } catch (error) {
      console.error('Error fetching massages:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      let branchId = getBranchId();

      // For manager/employee, get their assigned branch
      if (role !== 'admin') {
        const branchesStr = localStorage.getItem('branches');
        if (branchesStr) {
          const branches = JSON.parse(branchesStr);
          if (branches && branches.length > 0) {
            branchId = branches[0]._id;
          }
        }
      }

      if (!branchId) {
        setRooms([]);
        return;
      }

      const response = await fetch(`/api/branches/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.roomCount) {
        // Generate room numbers based on roomCount
        const roomNumbers = Array.from({ length: data.roomCount }, (_, i) => String(i + 1));
        setRooms(roomNumbers);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const fetchClientBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      // IMPORTANT: This fetches from ALL branches (not filtered)
      const response = await fetch(`/api/bookings/client/${formData.clientContact}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setClientBookings(data?.bookings || []);
        if (data.bookings?.length > 0) {
          setFormData(prev => ({
            ...prev,
            clientName: data.bookings[0]?.clientName || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching client bookings:', error);
    }
  };

  const formatTime12Hour = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  const calculateEndTime = (time, sessionTime) => {
    try {
      if (!time || !sessionTime) return '';

      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);

      // Extract minutes from session time (e.g., "30MIN+15MIN" -> 45 total minutes)
      const matches = sessionTime.match(/(\d+)MIN/g);
      if (matches) {
        const totalMinutes = matches.reduce((sum, match) => {
          const mins = parseInt(match.match(/\d+/)[0]);
          return sum + mins;
        }, 0);
        date.setMinutes(date.getMinutes() + totalMinutes);
      }

      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating end time:', error);
      return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentError('');

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      if (name === 'massage') {
        const selectedMassage = massages.find(m => m._id === value);
        if (selectedMassage) {
          setSelectedMassageData(selectedMassage);
          // Set first session as default
          if (selectedMassage.time && selectedMassage.time.length > 0) {
            const firstSessionIndex = 0;
            newData.sessionTime = `${selectedMassage.time[firstSessionIndex]}MIN+15MIN`;
            newData.massageType = selectedMassage.name;
            newData.massagePrice = selectedMassage.discountedPrice[firstSessionIndex] || 0;
            newData.massageEndTime = calculateEndTime(newData.massageTime, newData.sessionTime);
          }
        } else {
          setSelectedMassageData(null);
        }
      }

      if (name === 'sessionTime' && selectedMassageData) {
        // Extract the massage duration from session time
        const durationMatch = value.match(/^(\d+)MIN/);
        if (durationMatch) {
          const duration = parseInt(durationMatch[1]);
          const sessionIndex = selectedMassageData.time.indexOf(duration);
          if (sessionIndex !== -1) {
            newData.massagePrice = selectedMassageData.discountedPrice[sessionIndex] || 0;
          }
        }
        newData.massageEndTime = calculateEndTime(newData.massageTime, value);
      }

      if (name === 'massageTime') {
        newData.massageEndTime = calculateEndTime(value, newData.sessionTime);
      }

      if (['massagePrice', 'cash', 'card', 'upi', 'otherPayment'].includes(name)) {
        newData[name] = parseFloat(value) || 0;
      }

      return newData;
    });
  };

  const validatePayment = () => {
    const totalPayment = parseFloat(formData.cash) + parseFloat(formData.card) + parseFloat(formData.upi);
    const expectedTotal = parseFloat(formData.massagePrice) + parseFloat(formData.otherPayment);

    if (Math.abs(totalPayment - expectedTotal) > 0.01) {
      setPaymentError(`Payment Error: Cash + Card + UPI (₹${totalPayment}) must equal Massage Price + Other Payment (₹${expectedTotal})`);
      return false;
    }

    setPaymentError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate payment
    if (!validatePayment()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userName = localStorage.getItem('name');
      const branchId = getBranchId() || (selectedBranch ? selectedBranch._id : null);

      if (!branchId) {
        setError('Please select a branch');
        return;
      }

      const bookingData = {
        ...formData,
        branch: branchId,
        createdBy: userName
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Booking created successfully!');
        // Reset form
        setFormData({
          clientName: '',
          clientContact: '',
          massage: '',
          massageDate: getCurrentDate(),
          massageTime: getCurrentTime(),
          massageEndTime: '',
          sessionTime: '',
          massageType: '',
          massagePrice: 0,
          staffDetails: '',
          cash: 0,
          card: 0,
          upi: 0,
          otherPayment: 0,
          roomNumber: ''
        });
        setClientBookings([]);
        setSelectedMassageData(null);

        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.message || 'Error creating booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Error creating booking');
    }
  };

  return (
    <div className="mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Create New Booking</h1>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {paymentError && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold">
          {paymentError}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Booking Details</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Client Contact *</label>
            <input
              type="tel"
              name="clientContact"
              value={formData.clientContact}
              onChange={handleInputChange}
              pattern="[0-9]{10}"
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Client Name *</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Massage *</label>
            <select
              name="massage"
              value={formData.massage}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              required
            >
              <option value="">Select Massage</option>
              {massages.map(massage => (
                <option key={massage._id} value={massage._id}>
                  {massage.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Session Time *</label>
            <select
              name="sessionTime"
              value={formData.sessionTime}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              required
              disabled={!selectedMassageData}
            >
              <option value="">Select Session</option>
              {selectedMassageData && selectedMassageData.time.map((time, index) => (
                <option key={index} value={`${time}MIN+15MIN`}>
                  {time}MIN+15MIN - ₹{selectedMassageData.discountedPrice[index]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Staff *</label>
            <select
              name="staffDetails"
              value={formData.staffDetails}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              required
            >
              <option value="">Select Staff</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Date *</label>
            <input
              type="date"
              name="massageDate"
              value={formData.massageDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Start Time *</label>
            <input
              type="time"
              name="massageTime"
              value={formData.massageTime}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">End Time</label>
            <input
              type="text"
              value={formData.massageEndTime ? formatTime12Hour(formData.massageEndTime) : ''}
              className="w-full p-2 border rounded bg-gray-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              disabled
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Room Number *</label>
            <select
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              
            >
              <option value="">Select Room</option>
              {rooms.map((room, index) => (
                <option key={index} value={room}>
                  Room {room}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Massage Price *</label>
            <input
              type="number"
              name="massagePrice"
              value={formData.massagePrice}
              onChange={handleInputChange}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Cash Payment</label>
            <input
              type="number"
              name="cash"
              value={formData.cash}
              onChange={handleInputChange}
              onBlur={validatePayment}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Card Payment</label>
            <input
              type="number"
              name="card"
              value={formData.card}
              onChange={handleInputChange}
              onBlur={validatePayment}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">UPI Payment</label>
            <input
              type="number"
              name="upi"
              value={formData.upi}
              onChange={handleInputChange}
              onBlur={validatePayment}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block mb-2 text-zinc-900 dark:text-zinc-50">Other Payment</label>
            <input
              type="number"
              name="otherPayment"
              value={formData.otherPayment}
              onChange={handleInputChange}
              onBlur={validatePayment}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              min="0"
              step="0.01"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Create Booking
            </button>
          </div>
        </form>
      </div>

      {/* Client Booking History */}
      {clientBookings.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Client Booking History (All Branches)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="p-2 text-left text-zinc-900 dark:text-zinc-50">Date</th>
                  <th className="p-2 text-left text-zinc-900 dark:text-zinc-50">Time</th>
                  <th className="p-2 text-left text-zinc-900 dark:text-zinc-50">Branch</th>
                  <th className="p-2 text-left text-zinc-900 dark:text-zinc-50">Room</th>
                  <th className="p-2 text-left text-zinc-900 dark:text-zinc-50">Massage</th>
                  <th className="p-2 text-left text-zinc-900 dark:text-zinc-50">Staff</th>
                  <th className="p-2 text-left text-zinc-900 dark:text-zinc-50">Price</th>
                </tr>
              </thead>
              <tbody>
                {clientBookings.map((booking, index) => (
                  <tr key={booking._id || index} className="border-b dark:border-zinc-700">
                    <td className="p-2 text-zinc-900 dark:text-zinc-50">{new Date(booking.massageDate).toLocaleDateString()}</td>
                    <td className="p-2 text-zinc-900 dark:text-zinc-50">{formatTime12Hour(booking.massageTime)}</td>
                    <td className="p-2 text-zinc-900 dark:text-zinc-50">{booking.branch?.name || 'N/A'}</td>
                    <td className="p-2 text-zinc-900 dark:text-zinc-50">{booking.roomNumber}</td>
                    <td className="p-2 text-zinc-900 dark:text-zinc-50">{booking.massageType}</td>
                    <td className="p-2 text-zinc-900 dark:text-zinc-50">{booking.staffDetails?.name || 'N/A'}</td>
                    <td className="p-2 text-zinc-900 dark:text-zinc-50">₹{booking.massagePrice}</td>
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

export default CreateBookingPage;
