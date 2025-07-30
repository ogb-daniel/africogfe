export interface AttentionSession {
  isCongruent: boolean;
  wordShown: string;
  inkColor: string;
  selectedColor: string;
  isCorrect: boolean;
  responseTime: number;
  trialNumber: number;
}

export class AttentionScorer {
  private sessions: AttentionSession[] = [];
  private maxTrials: number = 5;

  constructor(maxTrials: number = 5) {
    this.maxTrials = maxTrials;
  }

  addSession(session: AttentionSession) {
    this.sessions.push(session);
  }

  calculateAttentionScore(): number {
    if (this.sessions.length === 0) return 0;

    const pointsPerTrial = 100 / this.maxTrials;
    let totalScore = 0;

    // Calculate base score from correct responses
    const correctSessions = this.sessions.filter((s) => s.isCorrect);
    totalScore = correctSessions.length * pointsPerTrial;

    // Bonus for handling incongruent trials well (Stroop interference)
    const incongruent = this.sessions.filter((s) => !s.isCongruent);
    const incongruentCorrect = incongruent.filter((s) => s.isCorrect);

    if (incongruent.length > 0) {
      const incongruentAccuracy =
        incongruentCorrect.length / incongruent.length;
      // Bonus up to 5 points for excellent incongruent performance
      const incongruentBonus = Math.max(0, (incongruentAccuracy - 0.5) * 10);
      totalScore += incongruentBonus;
    }

    // Penalty for slow responses (if we track response time)
    const avgResponseTime =
      this.sessions.reduce((sum, s) => sum + s.responseTime, 0) /
      this.sessions.length;
    if (avgResponseTime > 3000) {
      // Slower than 3 seconds average
      const timePenalty = Math.min(10, (avgResponseTime - 3000) / 500);
      totalScore -= timePenalty;
    }

    return Math.min(Math.max(Math.round(totalScore), 0), 100);
  }

  getCongruentAccuracy(): number {
    const congruent = this.sessions.filter((s) => s.isCongruent);
    if (congruent.length === 0) return 0;
    const correct = congruent.filter((s) => s.isCorrect).length;
    return Math.round((correct / congruent.length) * 100);
  }

  getIncongruentAccuracy(): number {
    const incongruent = this.sessions.filter((s) => !s.isCongruent);
    if (incongruent.length === 0) return 0;
    const correct = incongruent.filter((s) => s.isCorrect).length;
    return Math.round((correct / incongruent.length) * 100);
  }

  getStroopInterference(): number {
    const congruentAcc = this.getCongruentAccuracy();
    const incongruentAcc = this.getIncongruentAccuracy();
    return Math.max(0, congruentAcc - incongruentAcc);
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
    correctSessions: number;
    accuracy: number;
    congruentAccuracy: number;
    incongruentAccuracy: number;
    stroopInterference: number;
    score: number;
    interpretation: string;
  } {
    const score = this.calculateAttentionScore();
    const correctSessions = this.sessions.filter((s) => s.isCorrect).length;
    const accuracy =
      this.sessions.length > 0
        ? (correctSessions / this.sessions.length) * 100
        : 0;

    return {
      totalSessions: this.sessions.length,
      correctSessions,
      accuracy: Math.round(accuracy * 10) / 10,
      congruentAccuracy: this.getCongruentAccuracy(),
      incongruentAccuracy: this.getIncongruentAccuracy(),
      stroopInterference: this.getStroopInterference(),
      score,
      interpretation: this.getScoreInterpretation(score),
    };
  }

  reset() {
    this.sessions = [];
  }
}
