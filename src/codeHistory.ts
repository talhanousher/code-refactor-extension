export interface CodeSnapshot {
  timestamp: number;
  content: string;
}

export class CodeHistory {
  private history: CodeSnapshot[] = [];
  private index: number = -1;

  recordChange(content: string) {
    const snapshot: CodeSnapshot = { timestamp: Date.now(), content };

    // Remove forward history if the user makes a new change
    this.history = this.history.slice(0, this.index + 1);
    this.history.push(snapshot);
    this.index++;
  }

  rewind(steps: number): string | null {
    this.index = Math.max(0, this.index - steps);
    return this.history[this.index]?.content || null;
  }

  fastForward(steps: number): string | null {
    this.index = Math.min(this.history.length - 1, this.index + steps);
    return this.history[this.index]?.content || null;
  }

  getHistory(): CodeSnapshot[] {
    return this.history;
  }
}
