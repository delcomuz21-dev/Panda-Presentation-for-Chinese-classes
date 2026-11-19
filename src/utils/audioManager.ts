import type { ChapterId } from '../types/panda';

class DocumentaryAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private isPlayingAmbience = false;
  private isMuted = false;
  private birdTimer: number | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private streamNode: AudioBufferSourceNode | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.value = 0.0;
      this.ambienceGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createFilteredNoise(
    ctx: AudioContext,
    filterType: BiquadFilterType,
    frequency: number,
    q: number,
    gainLevel: number,
  ): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 2.4;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.value = gainLevel;

    source.connect(filter);
    filter.connect(gain);
    if (this.ambienceGain) {
      gain.connect(this.ambienceGain);
    }
    source.start();
    return source;
  }

  public startAmbience(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.isPlayingAmbience || !this.ambienceGain) return;

    this.isPlayingAmbience = true;
    // Gentle bamboo wind
    this.windNode = this.createFilteredNoise(ctx, 'bandpass', 360, 1.4, 0.28);
    // Mountain stream water
    this.streamNode = this.createFilteredNoise(ctx, 'lowpass', 720, 0.7, 0.14);

    this.ambienceGain.gain.cancelScheduledValues(ctx.currentTime);
    this.ambienceGain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 1.4);

    // Subtle mountain bird calls
    this.birdTimer = window.setInterval(() => {
      if (!this.isPlayingAmbience || this.isMuted) return;
      if (Math.random() < 0.55) {
        this.playBirdChirp();
      }
    }, 5200);
  }

  public stopAmbience(): void {
    if (!this.isPlayingAmbience) return;
    this.isPlayingAmbience = false;

    if (this.birdTimer !== null) {
      clearInterval(this.birdTimer);
      this.birdTimer = null;
    }
    if (this.ctx && this.ambienceGain) {
      this.ambienceGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.ambienceGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
    }
    window.setTimeout(() => {
      try {
        this.windNode?.stop();
        this.streamNode?.stop();
      } catch {
        // Ignore already stopped nodes
      }
      this.windNode = null;
      this.streamNode = null;
    }, 450);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    const ctx = this.ensureContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, ctx.currentTime, 0.08);
    }
    if (!this.isMuted && !this.isPlayingAmbience) {
      this.startAmbience();
    }
    if (this.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isMuted = !enabled;
    if (enabled) {
      const ctx = this.ensureContext();
      if (ctx && this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0.7, ctx.currentTime, 0.08);
      }
      this.startAmbience();
    } else {
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }

  private playBirdChirp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const base = 1850 + Math.random() * 550;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.28, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(base * 0.94, now + 0.19);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playTransitionCue(chapterId: ChapterId): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Chinese pentatonic scale (C D E G A)
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
    const freq = pentatonic[(chapterId - 1) % pentatonic.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  public speakMandarin(text: string, onEnd?: () => void): void {
    // Always provide a gentle acoustic confirmation chime if unmuted
    if (!this.isMuted) {
      const ctx = this.ensureContext();
      if (ctx && this.masterGain) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.24);
      }
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.88;
      utterance.pitch = 1.02;

      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('zh-cn') ||
          v.lang.toLowerCase().includes('zh_cn') ||
          v.lang.toLowerCase().startsWith('zh'),
      );
      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }
}

export const audioManager = new DocumentaryAudioManager();
