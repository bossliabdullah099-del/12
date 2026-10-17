// Web Audio API Procedural Synthesizer for Boss AI Song Maker

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentInterval: any = null;
  private analyser: AnalyserNode | null = null;
  private mediaDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public stop() {
    this.isPlaying = false;
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  // Play synthesized song with drums, bass, chords, and melody
  public playSong(
    genre: string = 'Synthwave',
    bpm: number = 124,
    scaleNotes: string[] = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
    onTick?: (step: number, totalBeats: number) => void,
    onFinish?: () => void,
    recordAudio: boolean = false
  ): Promise<Blob | null> {
    this.stop();
    const ctx = this.getContext();
    this.isPlaying = true;

    // Master bus
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;

    // Analyser for visualizer
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // Optional recorder
    let recordPromise: Promise<Blob | null> = Promise.resolve(null);
    if (recordAudio && window.MediaRecorder) {
      try {
        this.mediaDest = ctx.createMediaStreamDestination();
        masterGain.connect(this.mediaDest);
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(this.mediaDest.stream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.recordedChunks.push(e.data);
        };
        recordPromise = new Promise((resolve) => {
          if (!this.mediaRecorder) return resolve(null);
          this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            resolve(blob);
          };
          this.mediaRecorder.start();
        });
      } catch (e) {
        console.warn('Audio recording not supported:', e);
      }
    }

    const noteFreqs: Record<string, number> = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00,
    };

    const beatInterval = (60 / bpm) / 4; // 16th note in seconds
    let step = 0;
    const totalSteps = 16 * 16; // 16 bars = ~30s depending on bpm

    const playKick = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.35);
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.35);
    };

    const playSnare = (time: number) => {
      // Noise burst
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.15);
    };

    const playHihat = (time: number, accent: boolean = false) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(8000, time);
      gain.gain.setValueAtTime(accent ? 0.25 : 0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.05);
    };

    const playBass = (time: number, note: string) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = genre === 'Synthwave' ? 'sawtooth' : 'triangle';
      const freq = (noteFreqs[note] || 220) / 2;
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);

      gain.gain.setValueAtTime(0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.25);
    };

    const playLead = (time: number, note: string) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const freq = noteFreqs[note] || 440;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.32);
    };

    const chordNotes = ['C3', 'G3', 'A3', 'F3'];

    this.currentInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const now = ctx.currentTime;

      // 4/4 Kick on steps 0, 4, 8, 12
      if (step % 4 === 0) {
        playKick(now);
      }
      // Snare on steps 4, 12
      if (step % 8 === 4) {
        playSnare(now);
      }
      // Hi-hat on every 2nd 16th note
      if (step % 2 === 0) {
        playHihat(now, step % 4 === 2);
      }

      // Bass note matches 4-bar chord progression
      const barIndex = Math.floor(step / 16) % 4;
      const currentChordRoot = chordNotes[barIndex];
      if (step % 2 === 0) {
        playBass(now, currentChordRoot);
      }

      // Arpeggio Lead
      if (step % 2 === 1) {
        const leadNote = scaleNotes[step % scaleNotes.length];
        playLead(now, leadNote);
      }

      if (onTick) {
        onTick(step, totalSteps);
      }

      step++;
      if (step >= totalSteps) {
        this.stop();
        if (onFinish) onFinish();
      }
    }, beatInterval * 1000);

    return recordPromise;
  }
}

export const audioEngine = new AudioEngine();
