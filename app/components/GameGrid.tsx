"use client";

import { useState, useEffect } from "react";
import PatternSquare from "./PatternSquare";
import { WorkingMemoryScorer } from "./WorkingMemoryScorer";

interface GameGridProps {
  gridSize: 3 | 4;
  onScoreChange?: (score: number) => void;
  onWorkingMemoryScoreChange?: (score: number) => void;
}

export default function GameGrid({
  gridSize,
  onScoreChange,
  onWorkingMemoryScoreChange,
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
  const [currentTrial, setCurrentTrial] = useState(0);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  const totalSquares = gridSize * gridSize;
  const patterns = Array.from({ length: totalSquares }, (_, i) => (i % 12) + 1);

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

    // Reset working memory scorer and score
    workingMemoryScorer.reset();
    onWorkingMemoryScoreChange?.(0);

    // Generate truly random first sequence
    const firstStep = Math.floor(Math.random() * totalSquares);
    const firstSequence = [firstStep];
    setGameSequence(firstSequence);
    showSequence(firstSequence);
  };

  const showSequence = (sequence: number[]) => {
    setShowingSequence(true);
    setCurrentSequenceIndex(-1);
    setPlayerSequence([]);
    setClickedSquares([]);
    setCorrectSquares([]);
    setIncorrectSquare(null);
    setIsProcessingInput(false);

    // Initial delay before starting the sequence
    setTimeout(() => {
      // Show each step in the sequence with highlighting
      sequence.forEach((step, index) => {
        setTimeout(() => {
          setCurrentSequenceIndex(step);
        }, index * 1000);

        setTimeout(() => {
          setCurrentSequenceIndex(-1);
        }, index * 1000 + 700);
      });

      // End the sequence display
      setTimeout(() => {
        setShowingSequence(false);
        setCurrentSequenceIndex(-1);
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

    if (gameSequence[currentStep] !== index) {
      setIncorrectSquare(index);

      // Record failed session
      workingMemoryScorer.addSession({
        gridSize,
        sequenceLength: gameSequence.length,
        success: false,
        attempts: 1,
        totalRounds: currentTrial + 1,
      });

      // Update working memory score
      const newWorkingMemoryScore =
        workingMemoryScorer.calculateWorkingMemoryScore();
      onWorkingMemoryScoreChange?.(newWorkingMemoryScore);

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
      const newScore = score + 1;
      setScore(newScore);
      onScoreChange?.(newScore);

      // Record successful session
      workingMemoryScorer.addSession({
        gridSize,
        sequenceLength: gameSequence.length,
        success: true,
        attempts: 1,
        totalRounds: currentTrial + 1,
      });

      // Update working memory score
      const newWorkingMemoryScore =
        workingMemoryScorer.calculateWorkingMemoryScore();
      onWorkingMemoryScoreChange?.(newWorkingMemoryScore);

      setTimeout(() => {
        proceedToNextTrial();
      }, 1200);
    }
  };

  const proceedToNextTrial = () => {
    const nextTrial = currentTrial + 1;
    setCurrentTrial(nextTrial);

    if (nextTrial >= MAX_TRIALS) {
      // Assessment complete
      setAssessmentComplete(true);
      setGameStarted(false);
      return;
    }

    // Continue to next trial
    setIncorrectSquare(null);
    setIsProcessingInput(false);
    const nextSequence = generateNewSequence();
    showSequence(nextSequence);
  };

  const resetGame = () => {
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
    onScoreChange?.(0);
  };

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
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            Start Assessment
          </button>
        )}

        {assessmentComplete && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-2xl font-semibold text-green-600">
              Assessment Complete!
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-lg text-gray-700 mb-2">
                Working Memory Score
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {workingMemoryScorer.calculateWorkingMemoryScore()}/100
              </div>
              <div className="text-sm text-gray-600">
                Completed {currentTrial}/{MAX_TRIALS} trials
              </div>
              <div className="text-sm text-gray-600">
                Correct responses: {score}
              </div>
            </div>
            <div className="space-x-4">
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
          <div className="text-lg text-green-600 font-medium">
            {isProcessingInput ? "Processing..." : "Repeat the sequence!"}
          </div>
        )}
      </div>
    </div>
  );
}
