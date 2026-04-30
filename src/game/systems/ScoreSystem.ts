export class ScoreSystem {
  private unbanked = 0;
  private banked = 0;
  private best = 0;
  private scoreMult = 1.0;

  setBest(value: number): void {
    this.best = value;
  }

  setScoreMult(value: number): void {
    this.scoreMult = value > 0 ? value : 1.0;
  }

  addUnbanked(points: number): void {
    this.unbanked += points;
  }

  setUnbanked(points: number): void {
    this.unbanked = Math.max(0, points);
  }

  getUnbanked(): number {
    return this.unbanked;
  }

  getBanked(): number {
    return this.banked;
  }

  getBest(): number {
    return this.best;
  }

  bankScore(): number {
    const multiplied = Math.round(this.unbanked * this.scoreMult);
    this.banked += multiplied;
    const total = this.banked;
    this.unbanked = 0;
    return total;
  }

  addBanked(amount: number): void {
    this.banked += amount;
  }

  clearUnbanked(): void {
    this.unbanked = 0;
  }

  reset(): void {
    this.unbanked = 0;
    this.banked = 0;
  }

  destroy(): void {
    // No cleanup needed
  }
}
