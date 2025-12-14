'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ClientDetailsPage = ({ params }) => {
  const router = useRouter();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authentication token not found');
          router.push('/login');
          return;
        }

        const { id } = await params;

        const response = await fetch(`/api/client/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setClientData(data.client);
          setTotalVisits(data.totalVisits);
          setError(null);
        } else {
          setError(data.message || 'Failed to fetch client details');
        }
      } catch (err) {
        setError('Failed to fetch client details');
        console.error('Error fetching client details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [params, router]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeToAMPM = (timeString) => {
    if (!timeString) return '';

    try {
      const [hours, minutes] = timeString.split(':').map(num => parseInt(num));
      const hour = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg text-center">
          {error}
        </div>
      </div>
    );
  }

  if (!clientData) {
    return <div className="text-center p-3">No client data found</div>;
  }

  return (
    <div className="p-3">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 dark:text-blue-400 hover:underline"
      >
        &larr; Back to Clients
      </button>

      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{clientData.name}</h1>
          <p className="text-gray-600 dark:text-zinc-400">{clientData.phone}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Total Visits</h2>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalVisits}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-4">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Visit History</h2>

        {clientData.visitHistory && clientData.visitHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="px-6 py-3 border-b dark:border-zinc-700 text-left text-zinc-900 dark:text-zinc-50">Date</th>
                  <th className="px-6 py-3 border-b dark:border-zinc-700 text-left text-zinc-900 dark:text-zinc-50">Branch</th>
                  <th className="px-6 py-3 border-b dark:border-zinc-700 text-left text-zinc-900 dark:text-zinc-50">Massage Type</th>
                  <th className="px-6 py-3 border-b dark:border-zinc-700 text-left text-zinc-900 dark:text-zinc-50">Time Slot</th>
                  <th className="px-6 py-3 border-b dark:border-zinc-700 text-left text-zinc-900 dark:text-zinc-50">Price</th>
                  <th className="px-6 py-3 border-b dark:border-zinc-700 text-left text-zinc-900 dark:text-zinc-50">Other Payment</th>
                  <th className="px-6 py-3 border-b dark:border-zinc-700 text-left text-zinc-900 dark:text-zinc-50">Staff Name</th>
                </tr>
              </thead>
              <tbody>
                {clientData.visitHistory.map((visit) => (
                  <tr key={visit._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4 border-b dark:border-zinc-700 text-zinc-900 dark:text-zinc-50">
                      {formatDate(visit.massageDate)}
                    </td>
                    <td className="px-6 py-4 border-b dark:border-zinc-700 text-zinc-900 dark:text-zinc-50">
                      {visit.branch?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 border-b dark:border-zinc-700 text-zinc-900 dark:text-zinc-50">
                      {visit.massage?.name || visit.massageType}
                    </td>
                    <td className="px-6 py-4 border-b dark:border-zinc-700 text-zinc-900 dark:text-zinc-50">
                      {formatTimeToAMPM(visit.massageTime)} - {formatTimeToAMPM(visit.massageEndTime)}
                    </td>
                    <td className="px-6 py-4 border-b dark:border-zinc-700">
                      <span className="text-green-600 dark:text-green-400 font-medium">₹{visit.massagePrice}</span>
                    </td>
                    <td className="px-6 py-4 border-b dark:border-zinc-700">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">₹{visit.otherPayment || 0}</span>
                    </td>
                    <td className="px-6 py-4 border-b dark:border-zinc-700 text-zinc-900 dark:text-zinc-50">
                      {visit?.staffDetails?.name || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-zinc-400">No visit history available for this client.</p>
        )}
      </div>
    </div>
  );
};

export default ClientDetailsPage;
