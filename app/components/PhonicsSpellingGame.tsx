"use client";

import { useState, useEffect, useRef } from "react";
import {
  AuditoryProcessingScorer,
  SpellingSession,
} from "./AuditoryProcessingScorer";

interface WordData {
  word: string;
  image: string; // Unicode emoji or icon
  description: string;
}

const WORD_BANK: WordData[] = [
  {
    word: "magazine",
    image: "📖",
    description: "A book with pictures and stories",
  },
  { word: "dinosaur", image: "🦕", description: "A big animal from long ago" },
  { word: "knife", image: "🔪", description: "A tool for cutting" },
  {
    word: "tape",
    image: "📼",
    description: "Something sticky that holds things together",
  },
  {
    word: "cave",
    image: "🕳️",
    description: "A hollow place in a rock or mountain",
  },
];

interface PhonicsSpellingGameProps {
  onScoreChange?: (score: number) => void;
  onAuditoryProcessingScoreChange?: (score: number) => void;
  onGameComplete?: () => void;
  userAge?: number;
}

export default function PhonicsSpellingGame({
  onScoreChange,
  onAuditoryProcessingScoreChange,
  onGameComplete,
  userAge,
}: PhonicsSpellingGameProps) {
  const MAX_TRIALS = 5;
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);
  const [userSpelling, setUserSpelling] = useState("");
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [auditoryScorer] = useState(new AuditoryProcessingScorer(MAX_TRIALS));
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showingWord, setShowingWord] = useState(false);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if Web Speech API is supported
  const isSpeechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const speakWord = (word: string) => {
    if (!isSpeechSupported) {
      alert(
        "Speech synthesis is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari."
      );
      return;
    }

    setIsPlaying(true);

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      console.error("Speech synthesis error");
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const getRandomWord = (): WordData => {
    const availableWords = WORD_BANK.filter((w) => !usedWords.includes(w.word));

    if (availableWords.length === 0) {
      // If all words have been used, reset and pick from all words
      setUsedWords([]);
      return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    }

    return availableWords[Math.floor(Math.random() * availableWords.length)];
  };

  const startGame = () => {
    if (!userAge || userAge < 1) {
      alert("Please enter your age before starting the game.");
      return;
    }

    if (!isSpeechSupported) {
      alert(
        "This game requires speech synthesis. Please use a modern browser like Chrome, Firefox, or Safari."
      );
      return;
    }

    setGameStarted(true);
    setGameComplete(false);
    setCurrentTrial(0);
    setScore(0);
    setUsedWords([]);
    auditoryScorer.reset();
    onScoreChange?.(0);
    onAuditoryProcessingScoreChange?.(0);
    startTrial();
  };

  const startTrial = () => {
    const word = getRandomWord();
    setCurrentWord(word);
    setUsedWords((prev) => [...prev, word.word]);
    setUserSpelling("");
    setFeedback({ type: null, message: "" });
    setShowingWord(true);
    setTrialStartTime(Date.now());

    // Automatically play the word after a brief delay
    setTimeout(() => {
      speakWord(word.word);
    }, 1000);
  };

  const calculatePhonemeAccuracy = (
    correctWord: string,
    userSpelling: string
  ): number => {
    const correct = correctWord.toLowerCase();
    const user = userSpelling.toLowerCase();

    if (correct === user) return 1.0;
    if (user.length === 0) return 0.0;

    let matches = 0;
    const maxLength = Math.max(correct.length, user.length);

    // Check for matching letters in similar positions (simplified phoneme analysis)
    for (let i = 0; i < Math.min(correct.length, user.length); i++) {
      if (correct[i] === user[i]) {
        matches++;
      }
    }

    return matches / maxLength;
  };

  const handleSpellingSubmit = () => {
    if (!currentWord || userSpelling.trim() === "") return;

    const responseTime = Date.now() - trialStartTime;
    const isCorrect =
      userSpelling.toLowerCase().trim() === currentWord.word.toLowerCase();
    const phonemeAccuracy = calculatePhonemeAccuracy(
      currentWord.word,
      userSpelling.trim()
    );

    const session: SpellingSession = {
      word: currentWord.word,
      userSpelling: userSpelling.trim(),
      isCorrect,
      partialCredit: isCorrect ? 1.0 : phonemeAccuracy,
      responseTime,
      trialNumber: currentTrial + 1,
      phonemeAccuracy,
    };

    auditoryScorer.addSession(session);

    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      onScoreChange?.(newScore);
      setFeedback({ type: "correct", message: "🎉 Perfect spelling!" });
    } else {
      const accuracy = Math.round(phonemeAccuracy * 100);
      setFeedback({
        type: "incorrect",
        message: `Not quite right. The word was "${currentWord.word}". You got ${accuracy}% of the sounds right!`,
      });
    }

    const newAuditoryScore = auditoryScorer.calculateAuditoryProcessingScore();
    onAuditoryProcessingScoreChange?.(newAuditoryScore);

    setShowingWord(false);

    setTimeout(() => {
      proceedToNextTrial();
    }, 3000);
  };

  const proceedToNextTrial = () => {
    const nextTrial = currentTrial + 1;

    if (nextTrial >= MAX_TRIALS) {
      setGameComplete(true);
      setGameStarted(false);
      return;
    }

    setCurrentTrial(nextTrial);
    startTrial();
  };

  const resetGame = () => {
    window.speechSynthesis.cancel();
    setGameStarted(false);
    setGameComplete(false);
    setCurrentTrial(0);
    setScore(0);
    setCurrentWord(null);
    setUserSpelling("");
    setUsedWords([]);
    setFeedback({ type: null, message: "" });
    setShowingWord(false);
    onScoreChange?.(0);
    onAuditoryProcessingScoreChange?.(0);
  };

  // Cleanup speech on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Sound Spelling - Auditory Processing Assessment
        </h2>
        <p className="text-gray-600 mb-4">
          Listen to the word and spell what you hear!
        </p>
        {gameStarted && (
          <div className="space-y-1">
            <p className="text-lg text-gray-600">
              Word {currentTrial + 1} of {MAX_TRIALS}
            </p>
            <p className="text-sm text-gray-500">Correct spellings: {score}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
          {!isSpeechSupported && (
            <div className="text-red-600 font-medium">
              Speech synthesis not supported. Please use Chrome, Firefox, or
              Safari.
            </div>
          )}
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-3">How to Play</h3>
            <ol className="text-sm text-gray-600 space-y-2 text-left">
              <li>1. You&apos;ll see a picture and hear a word</li>
              <li>2. Listen carefully to how the word sounds</li>
              <li>3. Type the spelling of the word you heard</li>
              <li>4. Click the speaker button to hear it again</li>
              <li>5. Submit your spelling when ready</li>
            </ol>
          </div>
          <button
            onClick={startGame}
            disabled={!userAge || userAge < 1 || !isSpeechSupported}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Sound Spelling
          </button>
        </div>
      )}

      {gameStarted && currentWord && showingWord && (
        <div className="text-center space-y-6">
          <div className="bg-white rounded-lg p-8 shadow-lg md:min-w-[400px]">
            <div className="text-8xl mb-4">{currentWord.image}</div>
            <div className="text-lg text-gray-600 mb-4">
              {currentWord.description}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => speakWord(currentWord.word)}
                disabled={isPlaying}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-all duration-200 flex items-center gap-2 mx-auto"
              >
                🔊 {isPlaying ? "Playing..." : "Play Word"}
              </button>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Type what you heard:
                </label>
                <input
                  type="text"
                  value={userSpelling}
                  onChange={(e) => setUserSpelling(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSpellingSubmit()
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Spell the word here..."
                  autoFocus
                />
              </div>

              <button
                onClick={handleSpellingSubmit}
                disabled={userSpelling.trim() === ""}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                Submit Spelling
              </button>
            </div>
          </div>
        </div>
      )}

      {!showingWord && feedback.message && (
        <div className="text-center">
          <div
            className={`text-lg font-medium mb-4 ${
              feedback.type === "correct" ? "text-green-600" : "text-orange-600"
            }`}
          >
            {feedback.message}
          </div>
          <div className="text-gray-600">
            {currentTrial + 1 < MAX_TRIALS
              ? "Next word coming up..."
              : "Assessment complete!"}
          </div>
        </div>
      )}

      {gameComplete && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-2xl font-semibold text-blue-600">
            Assessment Complete!
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-lg text-gray-700 mb-2">
              Auditory Processing Score
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {auditoryScorer.calculateAuditoryProcessingScore()}/100
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Perfect spellings: {score}/{MAX_TRIALS}
              </div>
              <div>
                Spelling accuracy: {auditoryScorer.getSpellingAccuracy()}%
              </div>
              <div>
                Phoneme accuracy: {auditoryScorer.getPhonemeAccuracy()}%
              </div>
              <div>
                Average response time:{" "}
                {(auditoryScorer.getAverageResponseTime() / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
          <div className="space-x-4">
            {onGameComplete && (
              <button
                onClick={onGameComplete}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
              >
                Complete Assessment →
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
    </div>
  );
}
