"use client";

import { useState } from "react";
import GameGrid from "./components/GameGrid";
import ScoreTracker from "./components/ScoreTracker";
import PatternDisplay from "./components/PatternDisplay";

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<3 | 4 | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [workingMemoryScore, setWorkingMemoryScore] = useState(0);

  const resetGame = () => {
    setSelectedMode(null);
    setCurrentScore(0);
  };

  const samplePatterns = [1, 2, 3, 4, 5, 6];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Ankara Pattern Recall
          </h1>
          <p className="text-gray-600 text-lg">
            Test your memory with beautiful African patterns
          </p>
        </header>

        {!selectedMode ? (
          <div className="flex flex-col items-center space-y-8">
            <PatternDisplay
              patterns={samplePatterns}
              title="Sample Ankara Patterns"
              className="max-w-md"
            />

            <div className="text-center space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Choose Your Challenge
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setSelectedMode(3)}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  3×3 Grid
                  <div className="text-sm opacity-90">Easy Mode</div>
                </button>

                <button
                  onClick={() => setSelectedMode(4)}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
                >
                  4×4 Grid
                  <div className="text-sm opacity-90">Hard Mode</div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-3 text-center">
                How to Play
              </h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Choose your grid size (3×3 or 4×4)</li>
                <li>2. Watch the pattern sequence carefully</li>
                <li>3. Click the squares in the same order</li>
                <li>4. Each round adds one more step</li>
                <li>5. Try to get the highest score possible!</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
            <div className="flex-1 flex justify-center">
              <GameGrid
                gridSize={selectedMode}
                onScoreChange={setCurrentScore}
                onWorkingMemoryScoreChange={setWorkingMemoryScore}
              />
            </div>

            <div className="flex-shrink-0">
              <ScoreTracker
                currentScore={currentScore}
                gameMode={selectedMode === 3 ? "3x3" : "4x4"}
                workingMemoryScore={workingMemoryScore}
                onReset={resetGame}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
