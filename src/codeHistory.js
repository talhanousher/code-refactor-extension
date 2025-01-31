"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeHistory = void 0;
class CodeHistory {
    history = [];
    index = -1;
    recordChange(content) {
        const snapshot = { timestamp: Date.now(), content };
        // Remove forward history if the user makes a new change
        this.history = this.history.slice(0, this.index + 1);
        this.history.push(snapshot);
        this.index++;
    }
    rewind(steps) {
        this.index = Math.max(0, this.index - steps);
        return this.history[this.index]?.content || null;
    }
    fastForward(steps) {
        this.index = Math.min(this.history.length - 1, this.index + steps);
        return this.history[this.index]?.content || null;
    }
    getHistory() {
        return this.history;
    }
}
exports.CodeHistory = CodeHistory;
//# sourceMappingURL=codeHistory.js.map