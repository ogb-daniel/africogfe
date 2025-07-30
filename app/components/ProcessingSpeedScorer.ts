export interface TimedSession {
  gridSize: 3 | 4;
  sequenceLength: number;
  success: boolean;
  completedOnTime: boolean;
  attempts: number;
  totalRounds: number;
  responseTime?: number;
  allowedTime: number;
}

export class ProcessingSpeedScorer {
  private sessions: TimedSession[] = [];
  private maxTrials: number = 5;
  private timeoutPenalty: number = 15;

  constructor(maxTrials: number = 5) {
    this.maxTrials = maxTrials;
  }

  addSession(session: TimedSession) {
    this.sessions.push(session);
  }

  calculateProcessingSpeedScore(): number {
    if (this.sessions.length === 0) return 0;

    const pointsPerTrial = 100 / this.maxTrials;
    let totalScore = 0;

    for (const session of this.sessions) {
      if (session.success) {
        let sessionScore = pointsPerTrial;
        
        if (!session.completedOnTime) {
          sessionScore -= this.timeoutPenalty;
        }
        
        totalScore += Math.max(sessionScore, 0);
      }
    }

    return Math.min(Math.max(Math.round(totalScore), 0), 100);
  }

  getTimeoutCount(): number {
    return this.sessions.filter(session => !session.completedOnTime).length;
  }

  setMaxTrials(maxTrials: number) {
    this.maxTrials = maxTrials;
  }

  setTimeoutPenalty(penalty: number) {
    this.timeoutPenalty = penalty;
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
    timeoutSessions: number;
    successRate: number;
    timeoutRate: number;
    score: number;
    interpretation: string;
  } {
    const score = this.calculateProcessingSpeedScore();
    const successfulSessions = this.sessions.filter(s => s.success).length;
    const timeoutSessions = this.sessions.filter(s => !s.completedOnTime).length;
    const successRate = this.sessions.length > 0 ? (successfulSessions / this.sessions.length) * 100 : 0;
    const timeoutRate = this.sessions.length > 0 ? (timeoutSessions / this.sessions.length) * 100 : 0;

    return {
      totalSessions: this.sessions.length,
      successfulSessions,
      timeoutSessions,
      successRate: Math.round(successRate * 10) / 10,
      timeoutRate: Math.round(timeoutRate * 10) / 10,
      score,
      interpretation: this.getScoreInterpretation(score)
    };
  }

  reset() {
    this.sessions = [];
  }
}