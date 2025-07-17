export interface GameSession {
  gridSize: 3 | 4;
  sequenceLength: number;
  success: boolean;
  attempts: number;
  totalRounds: number;
}

export class WorkingMemoryScorer {
  private sessions: GameSession[] = [];
  private maxTrials: number = 15;

  constructor(maxTrials: number = 15) {
    this.maxTrials = maxTrials;
  }

  addSession(session: GameSession) {
    this.sessions.push(session);
  }

  calculateWorkingMemoryScore(): number {
    if (this.sessions.length === 0) return 0;

    // Simple equal-weight scoring: each trial worth (100 / maxTrials) points
    const pointsPerTrial = 100 / this.maxTrials;
    let totalScore = 0;

    // Sum up points for each successful trial
    for (const session of this.sessions) {
      if (session.success) {
        totalScore += pointsPerTrial;
      }
    }

    return Math.min(Math.max(Math.round(totalScore), 0), 100);
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
    successfulSessions: number;
    successRate: number;
    score: number;
    interpretation: string;
  } {
    const score = this.calculateWorkingMemoryScore();
    const successfulSessions = this.sessions.filter(s => s.success).length;
    const successRate = this.sessions.length > 0 ? (successfulSessions / this.sessions.length) * 100 : 0;

    return {
      totalSessions: this.sessions.length,
      successfulSessions,
      successRate: Math.round(successRate * 10) / 10,
      score,
      interpretation: this.getScoreInterpretation(score)
    };
  }

  reset() {
    this.sessions = [];
  }
}