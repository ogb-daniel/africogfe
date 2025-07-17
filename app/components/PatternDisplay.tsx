'use client';

import PatternSquare from './PatternSquare';

interface PatternDisplayProps {
  patterns: number[];
  title: string;
  className?: string;
}

export default function PatternDisplay({ patterns, title, className = '' }: PatternDisplayProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {patterns.map((patternId, index) => (
          <PatternSquare
            key={index}
            patternId={patternId}
            isRevealed={true}
            className="w-12 h-12"
          />
        ))}
      </div>
    </div>
  );
}