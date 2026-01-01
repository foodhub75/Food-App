
import React, { useState, useEffect } from 'react';
import { Bike, Home, Navigation, Info } from 'lucide-react';

export const MapView: React.FC = () => {
  const [riderPos, setRiderPos] = useState({ x: 20, y: 80 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next > 100) return 0;
        
        // Simple linear interpolation for a path
        const t = next / 100;
        setRiderPos({
          x: 20 + t * 60,
          y: 80 - t * 60
        });
        
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 relative">
      <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-2xl shadow-lg border flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-full">
          <Bike className="text-orange-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Rider Status</p>
          <p className="font-bold text-slate-800">Heading your way...</p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 bg-white p-4 rounded-2xl shadow-lg border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Estimated Arrival</span>
          <span className="text-sm text-orange-600 font-bold">12 - 15 Mins</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden">
        {/* Simple Mock Grid/Map */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Road Path SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
           <path 
            d="M 20 80 Q 50 80 50 50 T 80 20" 
            fill="none" 
            stroke="#e2e8f0" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          <path 
            d="M 20 80 Q 50 80 50 50 T 80 20" 
            fill="none" 
            stroke="#fdba74" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - progress}
          />
        </svg>

        {/* Home Marker */}
        <div className="absolute" style={{ left: '80%', top: '20%', transform: 'translate(-50%, -50%)' }}>
          <div className="relative">
            <div className="absolute -inset-4 bg-orange-400 opacity-20 animate-ping rounded-full" />
            <div className="bg-white p-2 rounded-full shadow-lg border-2 border-orange-500">
              <Home className="text-orange-500" size={24} />
            </div>
          </div>
        </div>

        {/* Rider Marker */}
        <div 
          className="absolute transition-all duration-200" 
          style={{ left: `${riderPos.x}%`, top: `${riderPos.y}%`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-slate-800 text-white p-2 rounded-full shadow-2xl border-2 border-white">
            <Bike size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};
