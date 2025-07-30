export interface SpellingSession {
  word: string;
  userSpelling: string;
  isCorrect: boolean;
  partialCredit: number; // 0-1 based on how close the spelling was
  responseTime: number;
  trialNumber: number;
  phonemeAccuracy: number; // How many phonemes were correctly identified
}

export class AuditoryProcessingScorer {
  private sessions: SpellingSession[] = [];
  private maxTrials: number = 5;

  constructor(maxTrials: number = 5) {
    this.maxTrials = maxTrials;
  }

  addSession(session: SpellingSession) {
    this.sessions.push(session);
  }

  // Calculate phoneme similarity between two words
  private calculatePhonemeAccuracy(correctWord: string, userSpelling: string): number {
    const correct = correctWord.toLowerCase();
    const user = userSpelling.toLowerCase();
    
    if (correct === user) return 1.0;
    if (user.length === 0) return 0.0;

    // Simple phoneme matching based on letter similarity
    // This is a simplified approach - in production you'd use proper phoneme analysis
    let matches = 0;
    const maxLength = Math.max(correct.length, user.length);
    
    // Check for matching letters in similar positions
    for (let i = 0; i < Math.min(correct.length, user.length); i++) {
      if (correct[i] === user[i]) {
        matches++;
      }
    }
    
    // Check for letters present but in wrong positions
    const correctLetters = correct.split('').sort();
    const userLetters = user.split('').sort();
    let commonLetters = 0;
    
    for (const letter of correctLetters) {
      const userIndex = userLetters.indexOf(letter);
      if (userIndex !== -1) {
        commonLetters++;
        userLetters.splice(userIndex, 1);
      }
    }
    
    // Combine positional accuracy and letter presence
    const positionalAccuracy = matches / maxLength;
    const letterAccuracy = commonLetters / correct.length;
    
    return (positionalAccuracy * 0.7) + (letterAccuracy * 0.3);
  }

  // Calculate partial credit for near-correct spellings
  private calculatePartialCredit(correctWord: string, userSpelling: string): number {
    if (correctWord.toLowerCase() === userSpelling.toLowerCase()) return 1.0;
    
    const phonemeAcc = this.calculatePhonemeAccuracy(correctWord, userSpelling);
    
    // Award partial credit based on phoneme accuracy
    if (phonemeAcc > 0.8) return 0.8;
    if (phonemeAcc > 0.6) return 0.6;
    if (phonemeAcc > 0.4) return 0.4;
    if (phonemeAcc > 0.2) return 0.2;
    return 0.0;
  }

  calculateAuditoryProcessingScore(): number {
    if (this.sessions.length === 0) return 0;

    const basePointsPerTrial = 100 / this.maxTrials;
    let totalScore = 0;

    for (const session of this.sessions) {
      if (session.isCorrect) {
        // Full points for perfect spelling
        totalScore += basePointsPerTrial;
      } else {
        // Partial points based on phonemic accuracy
        const partialCredit = this.calculatePartialCredit(session.word, session.userSpelling);
        totalScore += basePointsPerTrial * partialCredit;
      }

      // Bonus for good phoneme recognition even if spelling isn't perfect
      const phonemeBonus = session.phonemeAccuracy * 5; // Up to 5 bonus points
      totalScore += phonemeBonus;
    }

    // Speed bonus for quick responses (less than 10 seconds)
    const avgResponseTime = this.sessions.reduce((sum, s) => sum + s.responseTime, 0) / this.sessions.length;
    if (avgResponseTime < 10000) {
      const speedBonus = Math.max(0, (10000 - avgResponseTime) / 1000); // Up to 10 bonus points
      totalScore += speedBonus;
    }

    return Math.min(Math.max(Math.round(totalScore), 0), 100);
  }

  getPhonemeAccuracy(): number {
    if (this.sessions.length === 0) return 0;
    const totalAccuracy = this.sessions.reduce((sum, s) => sum + s.phonemeAccuracy, 0);
    return Math.round((totalAccuracy / this.sessions.length) * 100);
  }

  getSpellingAccuracy(): number {
    if (this.sessions.length === 0) return 0;
    const correctSpellings = this.sessions.filter(s => s.isCorrect).length;
    return Math.round((correctSpellings / this.sessions.length) * 100);
  }

  getAverageResponseTime(): number {
    if (this.sessions.length === 0) return 0;
    const totalTime = this.sessions.reduce((sum, s) => sum + s.responseTime, 0);
    return Math.round(totalTime / this.sessions.length);
  }

  setMaxTrials(maxTrials: number) {
    this.maxTrials = maxTrials;
  }

  getScoreInterpretation(score: number): string {
    if (score >= 90) return "Exceptional";
    if (score >= 80) return "Superior";
    if (score >= 70) return "Above Average";
    if (score >= 60) return "Average";
    if (score >= 50) return "Below Average";
    if (score >= 40) return "Low";
    return "Very Low";
  }

  getDetailedAnalysis(): {
    totalSessions: number;
    perfectSpellings: number;
    spellingAccuracy: number;
    phonemeAccuracy: number;
    averageResponseTime: number;
    score: number;
    interpretation: string;
  } {
    const score = this.calculateAuditoryProcessingScore();
    const perfectSpellings = this.sessions.filter(s => s.isCorrect).length;
    
    return {
      totalSessions: this.sessions.length,
      perfectSpellings,
      spellingAccuracy: this.getSpellingAccuracy(),
      phonemeAccuracy: this.getPhonemeAccuracy(),
      averageResponseTime: this.getAverageResponseTime(),
      score,
      interpretation: this.getScoreInterpretation(score)
    };
  }

  reset() {
    this.sessions = [];
  }
}