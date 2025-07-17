'use client';

import { useEffect, useState } from 'react';

interface ScoreTrackerProps {
  currentScore: number;
  gameMode: '3x3' | '4x4';
  workingMemoryScore?: number;
  onReset?: () => void;
}

interface ScoreRecord {
  score: number;
  mode: '3x3' | '4x4';
  timestamp: number;
}

export default function ScoreTracker({ currentScore, gameMode, workingMemoryScore = 0, onReset }: ScoreTrackerProps) {
  const [bestScore, setBestScore] = useState(0);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);

  useEffect(() => {
    const savedScores = localStorage.getItem('ankaraPatternScores');
    if (savedScores) {
      const scores: ScoreRecord[] = JSON.parse(savedScores);
      setRecentScores(scores);
      
      const modeScores = scores.filter(s => s.mode === gameMode);
      const best = modeScores.reduce((max, score) => 
        score.score > max ? score.score : max, 0);
      setBestScore(best);
    }
  }, [gameMode]);

  useEffect(() => {
    if (currentScore > bestScore) {
      setBestScore(currentScore);
    }
  }, [currentScore, bestScore]);

  const saveScore = (score: number) => {
    const newRecord: ScoreRecord = {
      score,
      mode: gameMode,
      timestamp: Date.now()
    };

    const savedScores = localStorage.getItem('ankaraPatternScores');
    const existingScores: ScoreRecord[] = savedScores ? JSON.parse(savedScores) : [];
    
    const updatedScores = [newRecord, ...existingScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    localStorage.setItem('ankaraPatternScores', JSON.stringify(updatedScores));
    setRecentScores(updatedScores);
  };

  const handleReset = () => {
    if (currentScore > 0) {
      saveScore(currentScore);
    }
    onReset?.();
  };

  const getModeScores = () => {
    return recentScores
      .filter(s => s.mode === gameMode)
      .slice(0, 5);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getWorkingMemoryInterpretation = (score: number) => {
    if (score >= 90) return { label: "Exceptional", color: "text-purple-600" };
    if (score >= 80) return { label: "Superior", color: "text-green-600" };
    if (score >= 70) return { label: "Above Average", color: "text-blue-600" };
    if (score >= 60) return { label: "Average", color: "text-yellow-600" };
    if (score >= 50) return { label: "Below Average", color: "text-orange-600" };
    if (score >= 40) return { label: "Low", color: "text-red-600" };
    return { label: "Very Low", color: "text-red-800" };
  };

  const interpretation = getWorkingMemoryInterpretation(workingMemoryScore);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 min-w-64">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Performance Tracker
      </h3>
      
      <div className="space-y-4">
        <div className="text-center border-b pb-3">
          <div className="text-sm text-gray-600">Working Memory Score</div>
          <div className="text-3xl font-bold text-purple-600">{workingMemoryScore}/100</div>
          <div className={`text-sm font-medium ${interpretation.color}`}>
            {interpretation.label}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600">Current Round</div>
          <div className="text-2xl font-bold text-blue-600">{currentScore}</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600">Best Round ({gameMode})</div>
          <div className="text-xl font-semibold text-green-600">{bestScore}</div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Recent {gameMode} Scores
          </div>
          <div className="space-y-1">
            {getModeScores().length > 0 ? (
              getModeScores().map((record, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">#{index + 1}</span>
                  <span className="font-medium">{record.score}</span>
                  <span className="text-gray-500">{formatDate(record.timestamp)}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-2">
                No scores yet
              </div>
            )}
          </div>
        </div>

        {currentScore > 0 && (
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Save & Reset
          </button>
        )}
      </div>
    </div>
  );
}