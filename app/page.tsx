"use client";

import { useState } from "react";
import GameGrid from "./components/GameGrid";
import ScoreTracker from "./components/ScoreTracker";
import PatternDisplay from "./components/PatternDisplay";
import ChameleonColorsGame from "./components/ChameleonColorsGame";
import PhonicsSpellingGame from "./components/PhonicsSpellingGame";
import { mapAttentionPredictionToString, mapPredictionToString } from "@/utils";

type GamePhase =
  | "age-entry"
  | "game-selection"
  | "ankara-3x3"
  | "ankara-4x4"
  | "game-2"
  | "game-3"
  | "completed";

interface GameScore {
  workingMemory: number;
  processingSpeed: number;
  attention: number;
  auditoryProcessing: number;
}

export default function Home() {
  const [gamePhase, setGamePhase] = useState<GamePhase>("age-entry");
  const [userAge, setUserAge] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameScores, setGameScores] = useState<GameScore>({
    workingMemory: 0,
    processingSpeed: 0,
    attention: 0,
    auditoryProcessing: 0,
  });
  const [currentGridSize, setCurrentGridSize] = useState<3 | 4>(3);
  const [cogResults, setCogResults] = useState<string>("");
  const handleAgeSubmit = (age: number) => {
    setUserAge(age);
    setGamePhase("game-selection");
  };

  const startAnkaraGame = (gridSize: 3 | 4) => {
    setCurrentGridSize(gridSize);
    setGamePhase(gridSize === 3 ? "ankara-3x3" : "ankara-4x4");
    setCurrentScore(0);
  };

  const handleAnkaraComplete = () => {
    setGamePhase("game-2");
  };

  const handleWorkingMemoryScoreChange = (score: number) => {
    setGameScores((prev) => ({ ...prev, workingMemory: score }));
  };

  const handleProcessingSpeedScoreChange = (score: number) => {
    setGameScores((prev) => ({ ...prev, processingSpeed: score }));
  };

  const handleAttentionScoreChange = (score: number) => {
    setGameScores((prev) => ({ ...prev, attention: score }));
  };

  const handleChameleonComplete = () => {
    setGamePhase("game-3");
  };

  const handleAuditoryProcessingScoreChange = (score: number) => {
    setGameScores((prev) => ({ ...prev, auditoryProcessing: score }));
  };

  const handlePhonicsComplete = async () => {
    await triggerCognitiveAssessment();
    setGamePhase("completed");
  };

  const triggerCognitiveAssessment = async () => {
    // This will be called by the ScoreTracker when all games are complete
    // The ScoreTracker will automatically run the assessment
    const results: string[] = [];
    try {
      const { workingMemory, processingSpeed, attention, auditoryProcessing } =
        gameScores;
      // Working Memory Assessment
      if (workingMemory > 0) {
        try {
          const wmResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/working-memory",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: userAge,
                WorkingMemory_Score: workingMemory,
              }),
            }
          );
          if (wmResponse.ok) {
            const wmData = await wmResponse.json();
            results.push(
              `Working Memory: ${mapPredictionToString(wmData.predicted)}`
            );
          }
        } catch (error) {
          results.push("Working Memory: Error");
        }
      }

      // Processing Speed Assessment
      if (processingSpeed > 0) {
        try {
          const psResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/processing-speed",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: userAge,
                ProcessingSpeed_Score: processingSpeed,
              }),
            }
          );
          if (psResponse.ok) {
            const psData = await psResponse.json();
            results.push(
              `Processing Speed: ${mapPredictionToString(psData.predicted)}`
            );
          }
        } catch (error) {
          results.push("Processing Speed: Error");
        }
      }
      // Attention Assessment
      if (attention > 0) {
        // Scale attention score from 0-100 to 35-0 (inverted: higher UI score = lower API value)
        const scaledAttentionScore = Math.round(35 - (attention / 100) * 35);
        console.log(scaledAttentionScore);
        try {
          const attResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/attention",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: userAge,
                Attention_Score: scaledAttentionScore,
              }),
            }
          );
          console.log(attResponse);
          if (attResponse.ok) {
            const attData = await attResponse.json();
            results.push(
              `Attention: ${mapAttentionPredictionToString(attData.predicted)}`
            );
          }
        } catch (error) {
          results.push("Attention: Error");
        }
      }

      // Auditory Processing Assessment
      if (auditoryProcessing > 0) {
        try {
          const apResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/auditory-processing",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: userAge,
                AuditoryProcessing_Score: auditoryProcessing,
              }),
            }
          );
          if (apResponse.ok) {
            const apData = await apResponse.json();
            results.push(
              `Auditory Processing: ${mapPredictionToString(apData.predicted)}`
            );
          }
        } catch (error) {
          results.push("Auditory Processing: Error");
        }
      }

      if (results.length > 0) {
        setCogResults(results.join(" | "));
      } else {
        console.log("No assessments completed");
      }
    } catch (error) {
      console.log("Connection error - please ensure server is running");
    } finally {
    }
  };

  const resetAllGames = () => {
    setGamePhase("age-entry");
    setUserAge(0);
    setCurrentScore(0);
    setGameScores({
      workingMemory: 0,
      processingSpeed: 0,
      attention: 0,
      auditoryProcessing: 0,
    });
  };

  const samplePatterns = [1, 2, 3, 4, 5, 6];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 sm:p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            {gamePhase === "game-2"
              ? "Chameleon Colors"
              : "Cognitive Assessment"}
          </h1>
          <p className="text-gray-600 text-lg">
            {gamePhase === "game-2"
              ? "Test your attention with the Stroop color-word task"
              : "Test your cognitive abilities with interactive games"}
          </p>
        </header>

        {gamePhase === "age-entry" ? (
          <div className="flex flex-col items-center space-y-8">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
                Welcome to Cognitive Assessment
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                You&apos;ll play 3 games that test different cognitive
                abilities. Let&apos;s start by entering your age.
              </p>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 text-center">
                  Enter your age (years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={userAge || ""}
                  onChange={(e) => setUserAge(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age"
                />
                <button
                  onClick={() => handleAgeSubmit(userAge)}
                  disabled={!userAge || userAge < 1}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          </div>
        ) : gamePhase === "game-selection" ? (
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

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-600">
                    Age: {userAge} years
                  </div>
                  <div className="text-sm text-gray-600">
                    Game 1 of 3: Ankara Pattern (Working Memory & Processing
                    Speed)
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => startAnkaraGame(3)}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  3×3 Grid
                  <div className="text-sm opacity-90">Easy Mode</div>
                </button>

                <button
                  onClick={() => startAnkaraGame(4)}
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
        ) : gamePhase === "ankara-3x3" || gamePhase === "ankara-4x4" ? (
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center lg:items-start">
            <div className="flex-1 flex justify-center">
              <GameGrid
                gridSize={currentGridSize}
                onScoreChange={setCurrentScore}
                onWorkingMemoryScoreChange={handleWorkingMemoryScoreChange}
                onProcessingSpeedScoreChange={handleProcessingSpeedScoreChange}
                onGameComplete={handleAnkaraComplete}
                userAge={userAge}
              />
            </div>

            <div className="flex-shrink-0">
              <ScoreTracker
                currentScore={currentScore}
                gameMode={currentGridSize === 3 ? "3x3" : "4x4"}
                workingMemoryScore={gameScores.workingMemory}
                processingSpeedScore={gameScores.processingSpeed}
                userAge={userAge}
                gamePhase={gamePhase}
                onReset={resetAllGames}
              />
            </div>
          </div>
        ) : gamePhase === "game-2" ? (
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
            <div className="flex-1 flex justify-center">
              <ChameleonColorsGame
                onScoreChange={setCurrentScore}
                onAttentionScoreChange={handleAttentionScoreChange}
                onGameComplete={handleChameleonComplete}
                userAge={userAge}
              />
            </div>
            <div className="flex-shrink-0">
              <ScoreTracker
                currentScore={currentScore}
                gameMode="chameleon"
                workingMemoryScore={gameScores.workingMemory}
                processingSpeedScore={gameScores.processingSpeed}
                attentionScore={gameScores.attention}
                userAge={userAge}
                gamePhase={gamePhase}
                onReset={resetAllGames}
              />
            </div>
          </div>
        ) : gamePhase === "game-3" ? (
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
            <div className="flex-1 flex justify-center">
              <PhonicsSpellingGame
                onScoreChange={setCurrentScore}
                onAuditoryProcessingScoreChange={
                  handleAuditoryProcessingScoreChange
                }
                onGameComplete={handlePhonicsComplete}
                userAge={userAge}
              />
            </div>
            <div className="flex-shrink-0">
              <ScoreTracker
                currentScore={currentScore}
                gameMode="phonics"
                workingMemoryScore={gameScores.workingMemory}
                processingSpeedScore={gameScores.processingSpeed}
                attentionScore={gameScores.attention}
                auditoryProcessingScore={gameScores.auditoryProcessing}
                userAge={userAge}
                gamePhase={gamePhase}
                onReset={resetAllGames}
              />
            </div>
          </div>
        ) : gamePhase === "completed" ? (
          <div className="flex flex-col items-center space-y-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-lg">
              <h2 className="text-3xl font-semibold mb-4 text-green-600">
                🎉 Assessment Complete! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                Congratulations! You&apos;ve completed all three cognitive
                assessment games. Here are your final scores:
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Working Memory</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {gameScores.workingMemory}/100
                    {cogResults && (
                      <div className="text-sm text-gray-500 mt-1">
                        {cogResults.includes("Working Memory")
                          ? cogResults.split(" | ")[0]
                          : "No result"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Processing Speed</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {gameScores.processingSpeed}/100
                    {cogResults && (
                      <div className="text-sm text-gray-500 mt-1">
                        {cogResults.includes("Processing Speed")
                          ? cogResults.split(" | ")[1]
                          : "No result"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Attention</div>
                  <div className="text-2xl font-bold text-green-600">
                    {gameScores.attention}/100
                    {cogResults && (
                      <div className="text-sm text-gray-500 mt-1">
                        {cogResults.includes("Attention")
                          ? cogResults.split(" | ")[2]
                          : "No result"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Auditory Processing
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {gameScores.auditoryProcessing}/100
                    {cogResults && (
                      <div className="text-sm text-gray-500 mt-1">
                        {cogResults.includes("Auditory Processing")
                          ? cogResults.split(" | ")[3]
                          : "No result"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold mb-4">
                Overall Assessment:
                <span className="text-blue-600">
                  {Math.round(
                    (gameScores.workingMemory +
                      gameScores.processingSpeed +
                      gameScores.attention +
                      gameScores.auditoryProcessing) /
                      4
                  )}
                  /100
                </span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={resetAllGames}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  Take Assessment Again
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
