"use client";

import { mapAttentionPredictionToString, mapPredictionToString } from "@/utils";
import { useEffect, useState, useCallback } from "react";

interface ScoreTrackerProps {
  currentScore: number;
  gameMode: "3x3" | "4x4" | "chameleon" | "phonics";
  workingMemoryScore?: number;
  processingSpeedScore?: number;
  attentionScore?: number;
  auditoryProcessingScore?: number;
  userAge?: number;
  gamePhase?: string;
  onReset?: () => void;
  onAgeChange?: (age: number) => void;
}

interface ScoreRecord {
  score: number;
  mode: "3x3" | "4x4" | "chameleon" | "phonics";
  timestamp: number;
}

export default function ScoreTracker({
  currentScore,
  gameMode,
  workingMemoryScore = 0,
  processingSpeedScore = 0,
  attentionScore = 0,
  auditoryProcessingScore = 0,
  userAge = 0,
  gamePhase,
  onReset,
  onAgeChange,
}: ScoreTrackerProps) {
  const [bestScore, setBestScore] = useState(0);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const [ageInYears, setAgeInYears] = useState<number>(userAge || 0);

  const handleAgeChange = (age: number) => {
    setAgeInYears(age);
    onAgeChange?.(age);
  };

  useEffect(() => {
    if (userAge) {
      setAgeInYears(userAge);
    }
  }, [userAge]);
  const [cognitiveLevel, setCognitiveLevel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const getCognitiveAssessment = useCallback(async () => {
    if (
      ageInYears <= 0 ||
      (workingMemoryScore <= 0 &&
        processingSpeedScore <= 0 &&
        attentionScore <= 0 &&
        auditoryProcessingScore <= 0)
    ) {
      setCognitiveLevel(
        "Please enter valid age and complete at least one game"
      );
      return;
    }

    setIsLoading(true);
    try {
      const ageInMonths = ageInYears;
      const results: string[] = [];

      // Working Memory Assessment
      if (workingMemoryScore > 0) {
        try {
          const wmResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/working-memory",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: ageInMonths,
                WorkingMemory_Score: workingMemoryScore,
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
      if (processingSpeedScore > 0) {
        try {
          const psResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/processing-speed",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: ageInMonths,
                ProcessingSpeed_Score: processingSpeedScore,
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
      if (attentionScore > 0) {
        // Scale attention score from 0-100 to 35-0 (inverted: higher UI score = lower API value)
        const scaledAttentionScore = Math.round(
          35 - (attentionScore / 100) * 35
        );
        console.log(scaledAttentionScore);
        try {
          const attResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/attention",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: ageInMonths,
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
      if (auditoryProcessingScore > 0) {
        try {
          const apResponse = await fetch(
            "https://africogbe-production.up.railway.app/predict/auditory-processing",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Age: ageInMonths,
                AuditoryProcessing_Score: auditoryProcessingScore,
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
        setCognitiveLevel(results.join(" | "));
      } else {
        setCognitiveLevel("No assessments completed");
      }
    } catch (error) {
      setCognitiveLevel("Connection error - please ensure server is running");
    } finally {
      setIsLoading(false);
    }
  }, [
    ageInYears,
    workingMemoryScore,
    processingSpeedScore,
    attentionScore,
    auditoryProcessingScore,
  ]);

  // Automatically trigger cognitive assessment when all games are completed
  useEffect(() => {
    console.log("useEffect triggered. GamePhase:", gamePhase);
    console.log("Scores:", {
      workingMemoryScore,
      processingSpeedScore,
      attentionScore,
      auditoryProcessingScore,
    });

    if (
      gamePhase === "completed" &&
      workingMemoryScore > 0 &&
      processingSpeedScore > 0 &&
      attentionScore > 0 &&
      auditoryProcessingScore > 0 &&
      ageInYears > 0 &&
      !isLoading &&
      !cognitiveLevel
    ) {
      console.log("All conditions met, triggering cognitive assessment...");
      // Small delay to ensure UI has updated
      setTimeout(() => {
        getCognitiveAssessment();
      }, 1000);
    }
  }, [
    gamePhase,
    workingMemoryScore,
    processingSpeedScore,
    attentionScore,
    auditoryProcessingScore,
    ageInYears,
    isLoading,
    cognitiveLevel,
    getCognitiveAssessment,
  ]);

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

  const interpretation = getWorkingMemoryInterpretation(workingMemoryScore);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 min-w-64 text-black">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Performance Tracker
      </h3>

      <div className="space-y-4">
        <div className="text-center border-b pb-3 space-y-3">
          {(workingMemoryScore > 0 || gamePhase?.includes("ankara")) && (
            <div>
              <div className="text-xs text-gray-600">Working Memory Score</div>
              <div className="text-lg font-bold text-purple-600">
                {workingMemoryScore}/100
              </div>
              <div className={`text-xs font-medium ${interpretation.color}`}>
                {interpretation.label}
              </div>
            </div>
          )}
          {(processingSpeedScore > 0 || gamePhase?.includes("ankara")) && (
            <div>
              <div className="text-xs text-gray-600">
                Processing Speed Score
              </div>
              <div className="text-lg font-bold text-orange-600">
                {processingSpeedScore}/100
              </div>
              <div
                className={`text-xs font-medium ${
                  getWorkingMemoryInterpretation(processingSpeedScore).color
                }`}
              >
                {getWorkingMemoryInterpretation(processingSpeedScore).label}
              </div>
            </div>
          )}
          {(attentionScore > 0 || gamePhase === "game-2") && (
            <div>
              <div className="text-xs text-gray-600">Attention Score</div>
              <div className="text-lg font-bold text-green-600">
                {attentionScore}/100
              </div>
              <div
                className={`text-xs font-medium ${
                  getWorkingMemoryInterpretation(attentionScore).color
                }`}
              >
                {getWorkingMemoryInterpretation(attentionScore).label}
              </div>
            </div>
          )}
          {(auditoryProcessingScore > 0 || gamePhase === "game-3") && (
            <div>
              <div className="text-xs text-gray-600">
                Auditory Processing Score
              </div>
              <div className="text-lg font-bold text-blue-600">
                {auditoryProcessingScore}/100
              </div>
              <div
                className={`text-xs font-medium ${
                  getWorkingMemoryInterpretation(auditoryProcessingScore).color
                }`}
              >
                {getWorkingMemoryInterpretation(auditoryProcessingScore).label}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-b pb-3">
          {userAge ? (
            <div className="text-center">
              <div className="text-sm text-gray-600">Age: {userAge} years</div>
              {gamePhase && (
                <div className="text-xs text-blue-600 mt-1">
                  {gamePhase.includes("ankara")
                    ? "Game 1/3: Ankara Pattern"
                    : gamePhase === "game-2"
                    ? "Game 2/3: Chameleon Colors"
                    : gamePhase === "game-3"
                    ? "Game 3/3: Sound Spelling"
                    : gamePhase === "completed"
                    ? "✅ All Games Complete"
                    : ""}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <label className="block text-sm text-gray-600 mb-2">
                Age (Years)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={ageInYears || ""}
                onChange={(e) => handleAgeChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter age"
              />
            </div>
          )}

          <button
            onClick={getCognitiveAssessment}
            disabled={
              isLoading ||
              ageInYears <= 0 ||
              (workingMemoryScore <= 0 &&
                processingSpeedScore <= 0 &&
                attentionScore <= 0 &&
                auditoryProcessingScore <= 0)
            }
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Analyzing..." : "Get Cognitive Assessment"}
          </button>

          {cognitiveLevel && (
            <div className="text-center">
              <div className="text-sm text-gray-600">Cognitive Assessment</div>
              <div className="text-sm font-medium text-indigo-600 mt-1 leading-relaxed">
                {cognitiveLevel.split(" | ").map((assessment, index) => (
                  <div key={index} className="mb-1">
                    {assessment}
                  </div>
                ))}
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
