"use client";

import { useState, useEffect, useRef } from "react";
import PatternSquare from "./PatternSquare";
import { WorkingMemoryScorer } from "./WorkingMemoryScorer";
import { ProcessingSpeedScorer } from "./ProcessingSpeedScorer";

interface GameGridProps {
  gridSize: 3 | 4;
  onScoreChange?: (score: number) => void;
  onWorkingMemoryScoreChange?: (score: number) => void;
  onProcessingSpeedScoreChange?: (score: number) => void;
  onGameComplete?: () => void;
  userAge?: number;
}

export default function GameGrid({
  gridSize,
  onScoreChange,
  onWorkingMemoryScoreChange,
  onProcessingSpeedScoreChange,
  onGameComplete,
  userAge,
}: GameGridProps) {
  const [gameSequence, setGameSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(-1);
  const [gameStarted, setGameStarted] = useState(false);
  const MAX_TRIALS = 5; // Fixed number of trials for assessment
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [clickedSquares, setClickedSquares] = useState<number[]>([]);
  const [correctSquares, setCorrectSquares] = useState<number[]>([]);
  const [incorrectSquare, setIncorrectSquare] = useState<number | null>(null);
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [workingMemoryScorer] = useState(new WorkingMemoryScorer(MAX_TRIALS));
  const [processingSpeedScorer] = useState(
    new ProcessingSpeedScorer(MAX_TRIALS)
  );
  const [currentTrial, setCurrentTrial] = useState(0);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const [roundTimeLimit, setRoundTimeLimit] = useState<number>(10000);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalSquares = gridSize * gridSize;
  const patterns = Array.from({ length: totalSquares }, (_, i) => (i % 12) + 1);

  const getTimeLimit = (age: number = 25): number => {
    if (age >= 5 && age <= 7) {
      return Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000;
    } else {
      return Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    }
  };

  const generateNewSequence = () => {
    const currentSequence = [...gameSequence];
    let newStep;
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops

    // Ensure no consecutive duplicates and improve randomness
    do {
      // Use crypto.getRandomValues for better randomness if available
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        newStep = array[0] % totalSquares;
      } else {
        newStep = Math.floor(Math.random() * totalSquares);
      }
      attempts++;
    } while (
      attempts < maxAttempts &&
      currentSequence.length > 0 &&
      newStep === currentSequence[currentSequence.length - 1]
    );

    const newSequence = [...currentSequence, newStep];
    setGameSequence(newSequence);
    return newSequence;
  };

  const startGame = () => {
    if (!userAge || userAge < 1) {
      alert("Please enter your age before starting the game.");
      return;
    }

    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setGameSequence([]);
    setPlayerSequence([]);
    setClickedSquares([]);
    setCorrectSquares([]);
    setIncorrectSquare(null);
    setCurrentTrial(0);
    setAssessmentComplete(false);
    setTimedOut(false);
    setRoundStartTime(null);
    setTimeLeft(0);

    workingMemoryScorer.reset();
    processingSpeedScorer.reset();
    onWorkingMemoryScoreChange?.(0);
    onProcessingSpeedScoreChange?.(0);

    const firstStep = Math.floor(Math.random() * totalSquares);
    const firstSequence = [firstStep];
    setGameSequence(firstSequence);
    showSequence(firstSequence);
  };

  const startRoundTimer = () => {
    const timeLimit = getTimeLimit(userAge || 25);
    setRoundTimeLimit(timeLimit);
    setTimeLeft(timeLimit);
    setRoundStartTime(Date.now());
    setTimedOut(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft = prev - 100;
        return Math.max(newTimeLeft, 0);
      });
    }, 100);

    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      handleTimeout();
    }, timeLimit);
  };

  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleTimeout = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setTimedOut(true);
    setTimeLeft(0);
  };

  const showSequence = (sequence: number[]) => {
    setShowingSequence(true);
    setCurrentSequenceIndex(-1);
    setPlayerSequence([]);
    setClickedSquares([]);
    setCorrectSquares([]);
    setIncorrectSquare(null);
    setIsProcessingInput(false);
    setTimedOut(false);
    clearTimers();

    setTimeout(() => {
      sequence.forEach((step, index) => {
        setTimeout(() => {
          setCurrentSequenceIndex(step);
        }, index * 1000);

        setTimeout(() => {
          setCurrentSequenceIndex(-1);
        }, index * 1000 + 700);
      });

      setTimeout(() => {
        setShowingSequence(false);
        setCurrentSequenceIndex(-1);
        startRoundTimer();
      }, sequence.length * 1000 + 500);
    }, 300);
  };

  const handleSquareClick = (index: number) => {
    if (
      showingSequence ||
      assessmentComplete ||
      !gameStarted ||
      isProcessingInput
    )
      return;

    setIsProcessingInput(true);
    setClickedSquares((prev) => [...prev, index]);

    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);

    const currentStep = newPlayerSequence.length - 1;
    const responseTime = roundStartTime ? Date.now() - roundStartTime : 0;
    const completedOnTime = timeLeft > 0;

    if (gameSequence[currentStep] !== index) {
      setIncorrectSquare(index);
      clearTimers();

      workingMemoryScorer.addSession({
        gridSize,
        sequenceLength: gameSequence.length,
        success: false,
        attempts: 1,
        totalRounds: currentTrial + 1,
      });

      processingSpeedScorer.addSession({
        gridSize,
        sequenceLength: gameSequence.length,
        success: false,
        completedOnTime,
        attempts: 1,
        totalRounds: currentTrial + 1,
        responseTime,
        allowedTime: roundTimeLimit,
      });

      const newWorkingMemoryScore =
        workingMemoryScorer.calculateWorkingMemoryScore();
      const newProcessingSpeedScore =
        processingSpeedScorer.calculateProcessingSpeedScore();

      onWorkingMemoryScoreChange?.(newWorkingMemoryScore);
      onProcessingSpeedScoreChange?.(newProcessingSpeedScore);

      setTimeout(() => {
        proceedToNextTrial();
      }, 1200);
      return;
    }

    setCorrectSquares((prev) => [...prev, index]);

    setTimeout(() => {
      setIsProcessingInput(false);
    }, 200);

    if (newPlayerSequence.length === gameSequence.length) {
      clearTimers();
      const newScore = score + 1;
      setScore(newScore);
      onScoreChange?.(newScore);

      workingMemoryScorer.addSession({
        gridSize,
        sequenceLength: gameSequence.length,
        success: true,
        attempts: 1,
        totalRounds: currentTrial + 1,
      });

      processingSpeedScorer.addSession({
        gridSize,
        sequenceLength: gameSequence.length,
        success: true,
        completedOnTime,
        attempts: 1,
        totalRounds: currentTrial + 1,
        responseTime,
        allowedTime: roundTimeLimit,
      });

      const newWorkingMemoryScore =
        workingMemoryScorer.calculateWorkingMemoryScore();
      const newProcessingSpeedScore =
        processingSpeedScorer.calculateProcessingSpeedScore();

      onWorkingMemoryScoreChange?.(newWorkingMemoryScore);
      onProcessingSpeedScoreChange?.(newProcessingSpeedScore);

      setTimeout(() => {
        proceedToNextTrial();
      }, 1200);
    }
  };

  const proceedToNextTrial = () => {
    clearTimers();
    const nextTrial = currentTrial + 1;
    setCurrentTrial(nextTrial);

    if (nextTrial >= MAX_TRIALS) {
      setAssessmentComplete(true);
      setGameStarted(false);
      return;
    }

    setIncorrectSquare(null);
    setIsProcessingInput(false);
    setTimedOut(false);
    const nextSequence = generateNewSequence();
    showSequence(nextSequence);
  };

  const resetGame = () => {
    clearTimers();
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setGameSequence([]);
    setPlayerSequence([]);
    setShowingSequence(false);
    setCurrentSequenceIndex(-1);
    setClickedSquares([]);
    setCorrectSquares([]);
    setIncorrectSquare(null);
    setIsProcessingInput(false);
    setCurrentTrial(0);
    setAssessmentComplete(false);
    setTimedOut(false);
    setRoundStartTime(null);
    setTimeLeft(0);
    onScoreChange?.(0);
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {gridSize}×{gridSize} Grid - Working Memory Assessment
        </h2>
        {gameStarted && (
          <div className="space-y-1">
            <p className="text-lg text-gray-600">
              Trial {currentTrial + 1} of {MAX_TRIALS}
            </p>
            <p className="text-sm text-gray-500">
              Correct: {score} | Sequence Length: {gameSequence.length}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentTrial + 1) / MAX_TRIALS) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div
        className={`
          grid gap-2 sm:gap-3 
          ${gridSize === 3 ? "grid-cols-3 max-w-xs" : "grid-cols-4 max-w-sm"}
        `}
      >
        {Array.from({ length: totalSquares }).map((_, index) => (
          <PatternSquare
            key={index}
            patternId={patterns[index]}
            isActive={currentSequenceIndex === index}
            isRevealed={
              playerSequence.includes(index) || currentSequenceIndex === index
            }
            isCorrect={correctSquares.includes(index)}
            isIncorrect={incorrectSquare === index}
            isClicked={clickedSquares.includes(index)}
            onClick={() => handleSquareClick(index)}
            className="w-16 h-16 sm:w-20 sm:h-20"
          />
        ))}
      </div>

      <div className="flex flex-col items-center space-y-4">
        {!gameStarted && !assessmentComplete && (
          <div className="text-center space-y-4">
            {(!userAge || userAge < 1) && (
              <div className="text-red-600 font-medium">
                Please enter your age in the Performance Tracker before starting
              </div>
            )}
            <button
              onClick={startGame}
              disabled={!userAge || userAge < 1}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Assessment
            </button>
          </div>
        )}

        {assessmentComplete && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-2xl font-semibold text-green-600">
              Assessment Complete!
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="space-y-3">
                <div>
                  <div className="text-lg text-gray-700 mb-1">
                    Working Memory Score
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {workingMemoryScorer.calculateWorkingMemoryScore()}/100
                  </div>
                </div>
                <div>
                  <div className="text-lg text-gray-700 mb-1">
                    Processing Speed Score
                  </div>
                  <div className="text-3xl font-bold text-orange-600">
                    {processingSpeedScorer.calculateProcessingSpeedScore()}/100
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-3">
                Completed {currentTrial}/{MAX_TRIALS} trials
              </div>
              <div className="text-sm text-gray-600">
                Correct responses: {score}
              </div>
              <div className="text-sm text-gray-600">
                Timeouts: {processingSpeedScorer.getTimeoutCount()}
              </div>
            </div>
            <div className="space-x-4">
              {onGameComplete && (
                <button
                  onClick={onGameComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
                >
                  Next Game →
                </button>
              )}
              <button
                onClick={startGame}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
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

        {showingSequence && (
          <div className="text-lg text-blue-600 font-medium animate-pulse">
            Watch the sequence...
          </div>
        )}

        {gameStarted && !showingSequence && !assessmentComplete && (
          <div className="text-center space-y-2">
            <div className="text-lg font-medium">
              {timedOut ? (
                <span className="text-orange-600">
                  Time&apos;s up! Continue playing for reduced points
                </span>
              ) : isProcessingInput ? (
                <span className="text-blue-600">Processing...</span>
              ) : (
                <span className="text-green-600">Repeat the sequence!</span>
              )}
            </div>
            {timeLeft > 0 && (
              <div className="text-sm">
                <div className="text-gray-600 mb-1">
                  Time left: {(timeLeft / 1000).toFixed(1)}s
                </div>
                <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                  <div
                    className={`h-2 rounded-full transition-all duration-100 ${
                      timeLeft > roundTimeLimit * 0.3
                        ? "bg-green-500"
                        : timeLeft > roundTimeLimit * 0.1
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${(timeLeft / roundTimeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            {timedOut && (
              <div className="text-sm text-orange-600">
                Processing speed points reduced for this round
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
