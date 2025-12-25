
import React from 'react';
import { Point } from '../types';

interface Props {
  image: string;
  landmarks: Point[];
}

const LandmarkOverlay: React.FC<Props> = ({ image, landmarks }) => {
  return (
    <div className="relative w-full aspect-auto rounded-xl overflow-hidden shadow-2xl bg-black">
      <img src={image} alt="Uploaded for analysis" className="w-full h-auto opacity-70" />
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        {/* Draw lines between landmarks to form a skeleton */}
        {landmarks.length >= 2 && (
          <g stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" opacity="0.6">
            {/* Find specific landmarks to connect */}
            {(() => {
              const find = (l: string) => landmarks.find(p => p.label.toLowerCase().includes(l.toLowerCase()));
              const head = find('vertex');
              const chin = find('chin');
              const shoulders = landmarks.filter(p => p.label.toLowerCase().includes('shoulder'));
              const hips = landmarks.filter(p => p.label.toLowerCase().includes('hip'));
              const knees = landmarks.filter(p => p.label.toLowerCase().includes('knee'));
              const ankles = landmarks.filter(p => p.label.toLowerCase().includes('ankle'));

              return (
                <>
                  {head && chin && <line x1={head.x} y1={head.y} x2={chin.x} y2={chin.y} />}
                  {shoulders.length === 2 && <line x1={shoulders[0].x} y1={shoulders[0].y} x2={shoulders[1].x} y2={shoulders[1].y} />}
                  {hips.length === 2 && <line x1={hips[0].x} y1={hips[0].y} x2={hips[1].x} y2={hips[1].y} />}
                  {/* Connect spine */}
                  {chin && hips.length > 0 && <line x1={chin.x} y1={chin.y} x2={(hips[0].x + (hips[1]?.x || hips[0].x)) / 2} y2={(hips[0].y + (hips[1]?.y || hips[0].y)) / 2} />}
                </>
              );
            })()}
          </g>
        )}

        {/* Draw dots */}
        {landmarks.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#3b82f6"
              className="animate-pulse"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
            />
            <text
              x={point.x + 15}
              y={point.y + 5}
              fill="white"
              fontSize="14"
              className="font-bold drop-shadow-md select-none"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default LandmarkOverlay;
