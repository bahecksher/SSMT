export class ScoreSystem {
  private unbanked = 0;
  private banked = 0;
  private best = 0;

  setBest(value: number): void {
    this.best = value;
  }

  addUnbanked(points: number): void {
    this.unbanked += points;
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
    this.banked += this.unbanked;
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

  destroy(): void {
    // No cleanup needed
  }
}
