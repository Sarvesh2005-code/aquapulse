import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, HeartPulse } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function HealthInsights() {
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health/predict`, { method: 'POST' });
        if (res.ok) {
          setAnalysis(await res.json());
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAnalysis();
  }, []);

  if (!analysis) {
    return <div className="flex justify-center items-center h-full"><p className="text-gray-500 font-medium">Loading health insights...</p></div>;
  }

  const isSafeSkin = analysis.skin_risk.includes('Safe');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 bg-rose-50 rounded-lg">
          <HeartPulse className="h-6 w-6 text-rose-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Possible Skin & Hair Concerns</h2>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800 leading-relaxed">
          This system provides educational information on potential water-related risk/association based on current sensor readings. It is not a medical diagnosis tool. Any disease or treatment information is general educational content.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="mb-8 border-b border-gray-100 pb-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Possible Issue</h3>
          <div className="flex items-center space-x-3">
            {!isSafeSkin ? (
              <AlertTriangle className="h-7 w-7 text-orange-500" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            )}
            <p className="text-2xl font-semibold text-gray-900">{analysis.skin_risk}</p>
          </div>
          {analysis.probability && !isSafeSkin && (
            <p className="text-sm text-gray-500 mt-2">
              Water-related risk association level: {(analysis.probability * 100).toFixed(0)}%
            </p>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Why?</h3>
            <div className="bg-gray-50 p-5 rounded-2xl space-y-2 text-gray-700">
              {analysis.influencing_features && analysis.influencing_features.length > 0 ? (
                analysis.influencing_features.map((feature: string, idx: number) => (
                  <p key={idx} className="leading-relaxed flex items-start">
                    <span className="mr-2 opacity-50">•</span>
                    {feature}
                  </p>
                ))
              ) : (
                <p>The current water parameters are within expected ranges for normal use.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">What you can do</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="bg-teal-50 p-1.5 rounded-full mr-3 mt-0.5"><div className="w-2 h-2 bg-teal-500 rounded-full"></div></div>
                <span className="text-gray-700">Use gentle, pH-balanced cleansers to protect your skin barrier.</span>
              </li>
              <li className="flex items-start">
                <div className="bg-teal-50 p-1.5 rounded-full mr-3 mt-0.5"><div className="w-2 h-2 bg-teal-500 rounded-full"></div></div>
                <span className="text-gray-700">Moisturize skin immediately after washing to lock in hydration.</span>
              </li>
              <li className="flex items-start">
                <div className="bg-teal-50 p-1.5 rounded-full mr-3 mt-0.5"><div className="w-2 h-2 bg-teal-500 rounded-full"></div></div>
                <span className="text-gray-700">Avoid overly long or very hot showers to prevent stripping natural oils.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">How to improve the water</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="bg-blue-50 p-1.5 rounded-full mr-3 mt-0.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div></div>
                <span className="text-gray-700"><strong>Filtration:</strong> Consider installing a shower filter with activated carbon to reduce chlorine and impurities.</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-50 p-1.5 rounded-full mr-3 mt-0.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div></div>
                <span className="text-gray-700"><strong>Water Softening:</strong> If TDS/hardness is consistently high, a water softening system may help protect hair and skin.</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-50 p-1.5 rounded-full mr-3 mt-0.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div></div>
                <span className="text-gray-700"><strong>Sediment Filtration:</strong> If turbidity is high, check your water source and consider sediment pre-filters.</span>
              </li>
            </ul>
          </div>

          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">When to seek medical help</h3>
            <p className="text-gray-700 leading-relaxed">
              Clearly state when persistent, severe, painful, infected, or worsening symptoms occur, they should be evaluated by a qualified healthcare professional. Do not rely solely on water modifications if medical conditions persist.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
