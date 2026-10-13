export class Sound {
  constructor() { this.enabled = true; this.context = null; }
  unlock() { try { this.context ||= new (window.AudioContext || window.webkitAudioContext)(); this.context.resume().catch(() => {}); } catch { this.enabled = false; } }
  tone(frequency, duration, type = 'sine', volume = .04, end = frequency) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(frequency, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(20, end), ctx.currentTime + duration);
    g.gain.setValueAtTime(volume, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + duration);
  }
  play(event) {
    if (event === 'shot') this.tone(130, .09, 'sawtooth', .035, 35);
    else if (event === 'hurt') this.tone(90, .18, 'triangle', .09, 35);
    else if (event === 'alarm' || event === 'lose') { this.tone(220, .6, 'sawtooth', .04, 110); }
    else if (event === 'reload') this.tone(400, .08, 'square', .013, 250);
    else if (['loot', 'craft', 'heal', 'relay', 'dawn', 'win'].includes(event)) { this.tone(540, .12, 'sine', .04, 780); setTimeout(() => this.tone(event === 'relay' ? 1100 : 850, .24, 'sine', .025), 120); }
  }
}
