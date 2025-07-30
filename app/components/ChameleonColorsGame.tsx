"use client";

import { useState, useEffect } from "react";
import { AttentionScorer, AttentionSession } from "./AttentionScorer";

const COLORS = {
  RED: "#EF4444",
  BLUE: "#3B82F6",
  GREEN: "#22C55E",
  YELLOW: "#EAB308",
  PURPLE: "#A855F7",
};

const COLOR_NAMES = Object.keys(COLORS) as (keyof typeof COLORS)[];

interface Trial {
  word: keyof typeof COLORS;
  inkColor: keyof typeof COLORS;
  isCongruent: boolean;
}

interface ChameleonColorsGameProps {
  onScoreChange?: (score: number) => void;
  onAttentionScoreChange?: (score: number) => void;
  onGameComplete?: () => void;
  userAge?: number;
}

export default function ChameleonColorsGame({
  onScoreChange,
  onAttentionScoreChange,
  onGameComplete,
  userAge,
}: ChameleonColorsGameProps) {
  const MAX_TRIALS = 5;
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialData, setCurrentTrialData] = useState<Trial | null>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showingWord, setShowingWord] = useState(false);
  const [attentionScorer] = useState(new AttentionScorer(MAX_TRIALS));
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect" | null;
    message: string;
  }>({ type: null, message: "" });

  const generateTrials = (): Trial[] => {
    const trials: Trial[] = [];

    // Generate mix of congruent and incongruent trials
    for (let i = 0; i < MAX_TRIALS; i++) {
      const word = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
      const isCongruent = Math.random() < 0.4; // 40% congruent, 60% incongruent for challenge

      let inkColor: keyof typeof COLORS;
      if (isCongruent) {
        inkColor = word;
      } else {
        // Pick a different color for incongruent trials
        const otherColors = COLOR_NAMES.filter((c) => c !== word);
        inkColor = otherColors[Math.floor(Math.random() * otherColors.length)];
      }

      trials.push({ word, inkColor, isCongruent });
    }

    return trials;
  };

  const startGame = () => {
    if (!userAge || userAge < 1) {
      alert("Please enter your age before starting the game.");
      return;
    }

    const newTrials = generateTrials();
    setTrials(newTrials);
    setCurrentTrial(0);
    setScore(0);
    setGameStarted(true);
    setGameComplete(false);
    setCurrentTrialData(newTrials[0]);
    attentionScorer.reset();
    onScoreChange?.(0);
    onAttentionScoreChange?.(0);
    startTrial(newTrials[0]);
  };

  const startTrial = (trial: Trial) => {
    setShowingWord(true);
    setTrialStartTime(Date.now());
    setFeedback({ type: null, message: "" });
  };

  const handleColorSelection = (selectedColor: keyof typeof COLORS) => {
    if (!currentTrialData || !showingWord) return;

    const responseTime = Date.now() - trialStartTime;
    const isCorrect = selectedColor === currentTrialData.inkColor;

    const session: AttentionSession = {
      isCongruent: currentTrialData.isCongruent,
      wordShown: currentTrialData.word,
      inkColor: currentTrialData.inkColor,
      selectedColor,
      isCorrect,
      responseTime,
      trialNumber: currentTrial + 1,
    };

    attentionScorer.addSession(session);

    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      onScoreChange?.(newScore);
      setFeedback({ type: "correct", message: "Correct!" });
    } else {
      setFeedback({
        type: "incorrect",
        message: `Incorrect. The word was ${currentTrialData.inkColor.toLowerCase()} ink.`,
      });
    }

    const newAttentionScore = attentionScorer.calculateAttentionScore();
    onAttentionScoreChange?.(newAttentionScore);

    setShowingWord(false);

    setTimeout(() => {
      proceedToNextTrial();
    }, 1500);
  };

  const proceedToNextTrial = () => {
    const nextTrial = currentTrial + 1;

    if (nextTrial >= MAX_TRIALS) {
      setGameComplete(true);
      setGameStarted(false);
      return;
    }

    setCurrentTrial(nextTrial);
    setCurrentTrialData(trials[nextTrial]);
    startTrial(trials[nextTrial]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameComplete(false);
    setCurrentTrial(0);
    setScore(0);
    setTrials([]);
    setCurrentTrialData(null);
    setShowingWord(false);
    setFeedback({ type: null, message: "" });
    onScoreChange?.(0);
    onAttentionScoreChange?.(0);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Chameleon Colors - Attention Assessment
        </h2>
        <p className="text-gray-600 mb-4">
          Tap the color patch that matches the ink color, not the word!
        </p>
        {gameStarted && (
          <div className="space-y-1">
            <p className="text-lg text-gray-600">
              Trial {currentTrial + 1} of {MAX_TRIALS}
            </p>
            <p className="text-sm text-gray-500">Correct: {score}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentTrial + 1) / MAX_TRIALS) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {!gameStarted && !gameComplete && (
        <div className="text-center space-y-4">
          {(!userAge || userAge < 1) && (
            <div className="text-red-600 font-medium">
              Please enter your age in the Performance Tracker before starting
            </div>
          )}
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-3">How to Play</h3>
            <ol className="text-sm text-gray-600 space-y-2 text-left">
              <li>1. You&apos;ll see a color name (like &quot;BLUE&quot;)</li>
              <li>2. The word will be printed in a different color ink</li>
              <li>3. Tap the color patch that matches the INK color</li>
              <li>4. Ignore what the word says - focus on the ink!</li>
              <li>5. Complete {MAX_TRIALS} trials as accurately as possible</li>
            </ol>
          </div>
          <button
            onClick={startGame}
            disabled={!userAge || userAge < 1}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Chameleon Colors
          </button>
        </div>
      )}

      {gameStarted && currentTrialData && (
        <div className="text-center space-y-6">
          <div className="bg-white rounded-lg p-8 shadow-lg min-h-[200px] flex flex-col justify-center">
            {showingWord ? (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-4">
                  What color is this word printed in?
                </div>
                <div
                  className="text-6xl font-bold mb-6"
                  style={{ color: COLORS[currentTrialData.inkColor] }}
                >
                  {currentTrialData.word}
                </div>
                <div className="text-sm text-gray-500">
                  Tap the color patch below that matches the ink color
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className={`text-lg font-medium mb-4 ${
                    feedback.type === "correct"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {feedback.message}
                </div>
                <div className="text-gray-600">
                  {currentTrial + 1 < MAX_TRIALS
                    ? "Next trial starting..."
                    : "Assessment complete!"}
                </div>
              </div>
            )}
          </div>

          {showingWord && (
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {COLOR_NAMES.map((colorName) => (
                <button
                  key={colorName}
                  onClick={() => handleColorSelection(colorName)}
                  className="w-20 h-20 rounded-lg border-2 border-gray-300 hover:border-gray-500 transition-all transform hover:scale-105 shadow-md"
                  style={{ backgroundColor: COLORS[colorName] }}
                  title={colorName}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {gameComplete && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-2xl font-semibold text-green-600">
            Assessment Complete!
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-lg text-gray-700 mb-2">Attention Score</div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {attentionScorer.calculateAttentionScore()}/100
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Completed {MAX_TRIALS}/{MAX_TRIALS} trials
              </div>
              <div>Correct responses: {score}</div>
              <div>
                Congruent accuracy: {attentionScorer.getCongruentAccuracy()}%
              </div>
              <div>
                Incongruent accuracy: {attentionScorer.getIncongruentAccuracy()}
                %
              </div>
              <div>
                Stroop interference: {attentionScorer.getStroopInterference()}%
              </div>
            </div>
          </div>
          <div className="space-x-4">
            {onGameComplete && (
              <button
                onClick={onGameComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Next Game →
              </button>
            )}
            <button
              onClick={startGame}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
            >
              Retake Assessment
            </button>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
