import React, { useEffect, useState } from 'react';

const Readings = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/sensor-data/latest');
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Live Readings</h1>
      {data ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xl mb-4 text-gray-700"><strong>pH:</strong> {data.ph?.toFixed(2) ?? 'N/A'}</p>
            <p className="text-xl mb-4 text-gray-700"><strong>TDS:</strong> {data.tds?.toFixed(2) ?? 'N/A'} ppm</p>
            <p className="text-xl mb-4 text-gray-700"><strong>Turbidity:</strong> {data.turbidity?.toFixed(2) ?? 'N/A'} NTU</p>
            <p className="text-xl mb-4 text-gray-700"><strong>Temperature:</strong> {data.temperature?.toFixed(2) ?? 'N/A'} °C</p>
            <p className="mt-6 text-gray-400 text-sm">Last Updated: {new Date(data.timestamp).toLocaleString()}</p>
        </div>
      ) : (
        <p className="text-gray-500">Loading live readings...</p>
      )}
    </div>
  );
};

export default Readings;
