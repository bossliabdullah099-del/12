import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Sparkles,
  Play,
  Pause,
  Square,
  Download,
  Disc3,
  Sliders,
  Radio,
  FileText,
} from 'lucide-react';
import { SongJob } from '../types';
import { audioEngine } from '../utils/audioSynth';

interface SongMakerViewProps {
  initialPrompt?: string;
  isDarkMode: boolean;
}

export const SongMakerView: React.FC<SongMakerViewProps> = ({
  initialPrompt = '',
  isDarkMode,
}) => {
  const [prompt, setPrompt] = useState(
    initialPrompt || 'Upbeat energetic synthwave anthem with heavy bassline, cyber drums, and cosmic synthesizers'
  );
  const [genre, setGenre] = useState('Synthwave');
  const [mood, setMood] = useState('Energetic');
  const [isComposing, setIsComposing] = useState(false);
  const [currentSong, setCurrentSong] = useState<SongJob | null>(null);

  // Playback & visualizer states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.stop();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  const genres = [
    'Synthwave',
    'Cyberpunk EDM',
    'Hip Hop / Lo-Fi',
    'Cinematic Orchestral',
    'Pop / Dance',
    'Rock / Metal',
  ];

  const moods = ['Energetic', 'Euphoric', 'Chill & Relaxed', 'Dark & Mysterious', 'Epic & Heroic'];

  // Compose Song
  const handleComposeSong = async () => {
    if (!prompt.trim() || isComposing) return;
    setIsComposing(true);
    audioEngine.stop();
    setIsPlaying(false);

    try {
      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genre, mood }),
      });

      const data = await res.json();
      const songData = data.song || {};

      const newSong: SongJob = {
        id: `song_${Date.now()}`,
        title: songData.title || `Boss AI ${genre} Track`,
        prompt,
        genre: songData.genre || genre,
        mood: songData.mood || mood,
        bpm: songData.bpm || 124,
        key: songData.key || 'C Major',
        durationSeconds: 30,
        lyrics: songData.lyrics || 'Generated song lyrics by Boss AI',
        createdAt: Date.now(),
      };

      setCurrentSong(newSong);
    } catch (err) {
      console.error('Song creation error:', err);
    } finally {
      setIsComposing(false);
    }
  };

  // Play / Pause Audio Engine with Visualizer
  const togglePlay = async () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      return;
    }

    if (!currentSong) return;

    setIsPlaying(true);
    startVisualizer();

    const audioBlob = await audioEngine.playSong(
      currentSong.genre,
      currentSong.bpm,
      ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
      (step, total) => {
        setPlaybackProgress((step / total) * 100);
      },
      () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      },
      true // Record audio
    );

    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  // Canvas Audio Visualizer
  const startVisualizer = () => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameIdRef.current = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;

      if (analyser && audioEngine.getIsPlaying()) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(dataArray[i] - 4, 0);
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Draw Equalizer Bars
      const barWidth = (width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.85;

        const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = grad;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  // Download song track
  const handleDownloadSong = () => {
    if (!audioUrl && !isPlaying) {
      alert('Play the song once to record and generate the audio file for download!');
      return;
    }
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `${(currentSong?.title || 'Boss_AI_Song').replace(/\s+/g, '_')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-500/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Music className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-display font-bold">AI Song & Music Maker</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Web Audio Synthesizer
              </span>
            </div>
            <p className="text-xs opacity-70 mt-1">
              Create complete original music tracks with multi-track synthesizers, rhythmic beats, and custom lyrics.
            </p>
          </div>
        </div>

        {/* Configuration Box */}
        <div className={`p-5 rounded-3xl border shadow-sm ${
          isDarkMode ? 'bg-[#1e1f20] border-[#333537]' : 'bg-white border-gray-200'
        }`}>
          {/* Prompt */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold opacity-70 mb-1.5">
              Song Prompt & Concept
            </label>
            <textarea
              id="song-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what your song is about (theme, instruments, tempo, vibe)..."
              rows={2}
              className={`w-full p-4 rounded-2xl text-sm outline-none resize-none border transition-all focus:ring-2 focus:ring-emerald-500/40 ${
                isDarkMode
                  ? 'bg-[#131314] border-[#37393b] text-white placeholder-gray-500'
                  : 'bg-[#f8fafc] border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Genre & Mood Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1.5">
                Music Genre
              </label>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs border font-medium transition-all ${
                      genre === g
                        ? 'bg-emerald-500 text-black border-emerald-500 font-bold'
                        : isDarkMode
                        ? 'bg-[#131314] border-[#37393b] text-gray-300 hover:text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1.5">
                Emotional Mood
              </label>
              <div className="flex flex-wrap gap-1.5">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs border font-medium transition-all ${
                      mood === m
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 font-bold'
                        : isDarkMode
                        ? 'bg-[#131314] border-[#37393b] text-gray-400 hover:text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-black'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-500/10">
            <span className="text-xs opacity-60">
              Generates verse-chorus lyrics, melody, bassline, and drum groove.
            </span>

            <button
              id="compose-song-btn"
              onClick={handleComposeSong}
              disabled={isComposing || !prompt.trim()}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                isComposing
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-bold hover:brightness-110 active:scale-98'
              }`}
            >
              {isComposing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Composing Audio & Lyrics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compose Song (Free)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Audio Player & Visualizer */}
        {currentSong && (
          <div className={`p-6 rounded-3xl border shadow-lg space-y-5 animate-in fade-in ${
            isDarkMode ? 'bg-[#1e1f20] border-[#333537]' : 'bg-white border-gray-200'
          }`}>
            {/* Song Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-500/10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[2px] flex items-center justify-center ${
                  isPlaying ? 'animate-spin' : ''
                }`}>
                  <div className="w-full h-full rounded-[14px] bg-[#131314] flex items-center justify-center text-emerald-400">
                    <Disc3 className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{currentSong.title}</h2>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <span className="text-emerald-400 font-semibold">{currentSong.genre}</span>
                    <span>•</span>
                    <span>{currentSong.bpm} BPM</span>
                    <span>•</span>
                    <span>Key: {currentSong.key}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSong}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Audio</span>
                </button>
              </div>
            </div>

            {/* Live Audio Spectrum Visualizer */}
            <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-black/60 border border-gray-500/20 p-2 flex items-center justify-center">
              <canvas
                ref={visualizerCanvasRef}
                width={800}
                height={120}
                className="w-full h-full object-cover"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-gray-300 font-medium">
                  Press Play to trigger live Web Audio synthesizer
                </div>
              )}
            </div>

            {/* Playback Controls & Progress */}
            <div className="space-y-2">
              <div className="w-full h-2 rounded-full bg-gray-500/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-100"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    id="play-song-btn"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <button
                    onClick={handleStop}
                    className={`p-2.5 rounded-full hover:bg-gray-500/20 transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs font-mono opacity-70">
                  {Math.round((playbackProgress / 100) * 30)}s / 30s Loop
                </div>
              </div>
            </div>

            {/* Lyrics Section */}
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
              isDarkMode ? 'bg-[#131314] border-[#2e2f33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400 text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                Song Lyrics (Generated by Boss AI)
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs opacity-90 leading-relaxed max-h-60 overflow-y-auto">
                {currentSong.lyrics}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
