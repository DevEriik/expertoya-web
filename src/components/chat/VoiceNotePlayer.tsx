import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface Props {
  audioUrl: string;
  isCurrentUser: boolean;
  isDark?: boolean;
}

export const VoiceNotePlayer: React.FC<Props> = ({
  audioUrl,
  isCurrentUser,
  isDark = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isPlaying) {
        setCurrentTime(audio.currentTime);
      }
      if (!duration && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
          setDuration(audioRef.current.duration);
        }
        animId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Error al reproducir audio:', err));
    }
  };

  const seekToPosition = useCallback((fraction: number) => {
    if (audioRef.current && duration > 0) {
      const clamped = Math.max(0, Math.min(1, fraction));
      const targetTime = clamped * duration;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  }, [duration]);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = clickX / rect.width;
    seekToPosition(fraction);
  };

  const handleSeekRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleSpeed = () => {
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      className={`flex items-center gap-2.5 py-1 px-1 rounded-xl min-w-[210px] sm:min-w-[250px] ${isCurrentUser ? 'text-white' : isDark ? 'text-gray-100' : 'text-[#283593]'
        }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs cursor-pointer ${isCurrentUser
            ? 'bg-white text-[#FF8C00] hover:bg-white/95'
            : 'bg-[#FF8C00] text-white hover:bg-[#E67E00]'
          }`}
        title={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 select-none">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative flex items-center w-full h-4 cursor-pointer group"
        >
          <div
            className={`w-full h-1.5 rounded-full overflow-hidden ${isCurrentUser
                ? 'bg-white/30'
                : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
              }`}
          >
            <div
              className={`h-full rounded-full transition-none ${isCurrentUser ? 'bg-white' : 'bg-[#FF8C00]'
                }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-md pointer-events-none transition-none group-hover:scale-125 ${isCurrentUser
                ? 'bg-white shadow-black/25'
                : 'bg-[#FF8C00] ring-2 ring-white dark:ring-gray-800 shadow-orange-500/40'
              }`}
            style={{
              left: `${progressPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />

          <input
            type="range"
            min={0}
            max={duration || 100}
            step="any"
            value={currentTime}
            onChange={handleSeekRange}
            disabled={!duration}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto [appearance:none] [&::-webkit-slider-thumb]:[appearance:none] [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-moz-range-thumb]:[appearance:none] [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:h-0"
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              background: 'transparent',
            }}
            aria-label="Reproducir mensaje de voz"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-semibold opacity-90 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 opacity-60" />
            {duration > 0 ? formatTime(duration) : 'Audio'}
          </span>
        </div>
      </div>

      {/* Botón de Velocidad 1x / 1.5x / 2x */}
      <button
        type="button"
        onClick={toggleSpeed}
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${isCurrentUser
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        title="Cambiar velocidad de reproducción"
      >
        {playbackRate}x
      </button>
    </div>
  );
};
