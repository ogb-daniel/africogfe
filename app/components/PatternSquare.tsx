"use client";

import Image from "next/image";

interface PatternSquareProps {
  patternId: number;
  isActive?: boolean;
  isRevealed?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  isClicked?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function PatternSquare({
  patternId,
  isActive = false,
  isRevealed = false,
  isCorrect = false,
  isIncorrect = false,
  isClicked = false,
  onClick,
  className = "",
}: PatternSquareProps) {
  return (
    <div
      className={`
        relative aspect-square cursor-pointer rounded-lg overflow-hidden
        transition-all duration-300 ease-in-out transform
        ${
          isActive
            ? "ring-4 ring-yellow-400 ring-opacity-90 scale-110 shadow-xl"
            : ""
        }
        ${isCorrect ? "ring-4 ring-green-500 ring-opacity-90 scale-105" : ""}
        ${isIncorrect ? "ring-4 ring-red-500 ring-opacity-90 scale-95" : ""}
        ${isClicked ? "scale-95" : ""}
        ${isRevealed ? "opacity-100" : "opacity-60 hover:opacity-85"}
        hover:scale-110 hover:shadow-lg
        ${className}
      `}
      onClick={onClick}
    >
      <Image
        src={`/pattern-${patternId}.jpg`}
        alt={`Ankara pattern ${patternId}`}
        fill
        className={`
          object-cover transition-all duration-300
          ${isActive ? "brightness-125" : ""}
          ${isCorrect ? "brightness-110" : ""}
          ${isIncorrect ? "brightness-75 saturate-50" : ""}
        `}
        sizes="(max-width: 768px) 100px, 120px"
      />

      {!isRevealed && (
        <div
          className={`
          absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center
          transition-all duration-300
          ${isActive ? "bg-opacity-20" : ""}
        `}
        >
          <div
            className={`
            w-4 h-4 bg-white rounded-full opacity-50
            transition-all duration-300
            ${isActive ? "scale-150 opacity-80" : ""}
          `}
          ></div>
        </div>
      )}
    </div>
  );
}
