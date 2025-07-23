"use client";

import { useEffect, useState } from "react";

interface ScoreTrackerProps {
  currentScore: number;
  gameMode: "3x3" | "4x4";
  workingMemoryScore?: number;
  onReset?: () => void;
}

interface ScoreRecord {
  score: number;
  mode: "3x3" | "4x4";
  timestamp: number;
}

export default function ScoreTracker({
  currentScore,
  gameMode,
  workingMemoryScore = 0,
  onReset,
}: ScoreTrackerProps) {
  const [bestScore, setBestScore] = useState(0);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const [ageInYears, setAgeInYears] = useState<number>(0);
  const [cognitiveLevel, setCognitiveLevel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedScores = localStorage.getItem("ankaraPatternScores");
    if (savedScores) {
      const scores: ScoreRecord[] = JSON.parse(savedScores);
      setRecentScores(scores);

      const modeScores = scores.filter((s) => s.mode === gameMode);
      const best = modeScores.reduce(
        (max, score) => (score.score > max ? score.score : max),
        0
      );
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
      timestamp: Date.now(),
    };

    const savedScores = localStorage.getItem("ankaraPatternScores");
    const existingScores: ScoreRecord[] = savedScores
      ? JSON.parse(savedScores)
      : [];

    const updatedScores = [newRecord, ...existingScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    localStorage.setItem("ankaraPatternScores", JSON.stringify(updatedScores));
    setRecentScores(updatedScores);
  };

  const handleReset = () => {
    if (currentScore > 0) {
      saveScore(currentScore);
    }
    onReset?.();
  };

  const getModeScores = () => {
    return recentScores.filter((s) => s.mode === gameMode).slice(0, 5);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getWorkingMemoryInterpretation = (score: number) => {
    if (score >= 90) return { label: "Exceptional", color: "text-purple-600" };
    if (score >= 80) return { label: "Superior", color: "text-green-600" };
    if (score >= 70) return { label: "Above Average", color: "text-blue-600" };
    if (score >= 60) return { label: "Average", color: "text-yellow-600" };
    if (score >= 50)
      return { label: "Below Average", color: "text-orange-600" };
    if (score >= 40) return { label: "Low", color: "text-red-600" };
    return { label: "Very Low", color: "text-red-800" };
  };

  const mapPredictionToString = (prediction: number): string => {
    const mapping: { [key: number]: string } = {
      0: "Very Low",
      1: "Low",
      2: "Below Average",
      3: "Average",
      4: "Above Average",
    };
    return mapping[prediction] || "Unknown";
  };

  const getCognitiveAssessment = async () => {
    if (ageInYears <= 0 || workingMemoryScore <= 0) {
      setCognitiveLevel("Please enter valid age and complete the game");
      return;
    }

    setIsLoading(true);
    try {
      const ageInMonths = ageInYears * 12;
      const response = await fetch(
        "https://africogbe-production.up.railway.app/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Age: ageInMonths,
            WorkingMemory_Score: workingMemoryScore,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const predictionString = mapPredictionToString(data.predicted);
        setCognitiveLevel(predictionString);
      } else {
        setCognitiveLevel("Error getting prediction");
      }
    } catch (error) {
      setCognitiveLevel("Connection error - please ensure server is running");
    } finally {
      setIsLoading(false);
    }
  };

  const interpretation = getWorkingMemoryInterpretation(workingMemoryScore);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 min-w-64 text-black">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Performance Tracker
      </h3>

      <div className="space-y-4">
        <div className="text-center border-b pb-3">
          <div className="text-sm text-gray-600">Working Memory Score</div>
          <div className="text-3xl font-bold text-purple-600">
            {workingMemoryScore}/100
          </div>
          <div className={`text-sm font-medium ${interpretation.color}`}>
            {interpretation.label}
          </div>
        </div>

        <div className="space-y-3 border-b pb-3">
          <div className="text-center">
            <label className="block text-sm text-gray-600 mb-2">
              Age (Years)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={ageInYears || ""}
              onChange={(e) => setAgeInYears(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter age"
            />
          </div>

          <button
            onClick={getCognitiveAssessment}
            disabled={isLoading || ageInYears <= 0 || workingMemoryScore <= 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Analyzing..." : "Get Cognitive Assessment"}
          </button>

          {cognitiveLevel && (
            <div className="text-center">
              <div className="text-sm text-gray-600">Cognitive Level</div>
              <div className="text-lg font-semibold text-indigo-600 mt-1">
                {cognitiveLevel}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600">Current Round</div>
          <div className="text-2xl font-bold text-blue-600">{currentScore}</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600">Best Round ({gameMode})</div>
          <div className="text-xl font-semibold text-green-600">
            {bestScore}
          </div>
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
                  <span className="text-gray-500">
                    {formatDate(record.timestamp)}
                  </span>
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
