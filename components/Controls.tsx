import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Settings, Type, ChevronDown, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface ControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  text?: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onVoiceChange: (voiceName: string) => void;
  onHeightChange?: (height: number) => void;
  disabled?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  isPaused,
  speed,
  voices,
  selectedVoiceName,
  text,
  onPlay,
  onPause,
  onStop,
  onSpeedChange,
  onVoiceChange,
  onHeightChange,
  disabled = false,
}) => {
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const { t } = useTranslation();
  const controlsRef = useRef<HTMLDivElement>(null);

  // Report height changes to parent
  const reportHeight = useCallback(() => {
    if (controlsRef.current && onHeightChange) {
      const height = controlsRef.current.offsetHeight;
      onHeightChange(height);
    }
  }, [onHeightChange]);

  useEffect(() => {
    reportHeight();
    // Also report on window resize
    window.addEventListener('resize', reportHeight);
    return () => window.removeEventListener('resize', reportHeight);
  }, [reportHeight, showMobileSettings]);

  const handlePlay = () => {
    setShowMobileSettings(false);
    onPlay();
  };

  const toggleSettings = () => {
    setShowMobileSettings(prev => !prev);
  };

  // 生成分享链接并分享/复制
  const handleShare = async () => {
    if (!text?.trim()) return;

    const encodedText = encodeURIComponent(text);
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}#/?text=${encodedText}`;

    const shareData = {
      title: t('app.title'),
      text: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
      url: shareUrl,
    };

    // 优先使用 Web Share API（移动端）
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        // 用户取消分享或分享失败，回退到复制链接
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // 回退到复制链接
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast(t('home.share_copied'));
      setTimeout(() => setShareToast(null), 2000);
    } catch (e) {
      setShareToast(t('home.share_failed'));
      setTimeout(() => setShareToast(null), 2000);
    }
  };

  return (
    <div 
      ref={controlsRef}
      className="fixed bottom-0 left-0 right-0 bg-white/[0.98] backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] z-[100] supports-[backdrop-filter]:bg-white/95"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}
    >
      <div className="max-w-4xl mx-auto px-3 py-3 md:px-4 md:py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Playback Controls Row */}
          <div className="w-full md:w-auto flex items-center justify-center md:justify-start">
            {/* Playback Buttons */}
            <div className="flex items-center gap-3 md:gap-4">
              {!isPlaying && !isPaused ? (
                <button
                  onClick={handlePlay}
                  disabled={disabled}
                  className={clsx(
                    "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg transition-all",
                    disabled 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-brand text-white shadow-brand/30 hover:scale-105 active:scale-95"
                  )}
                  aria-label={t('controls.play', 'Play')}
                >
                  <Play fill="currentColor" size={24} className="md:w-7 md:h-7 ml-0.5" />
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={handlePlay}
                      disabled={disabled}
                      className={clsx(
                        "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg transition-all",
                        disabled 
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                          : "bg-brand text-white hover:scale-105"
                      )}
                      aria-label={t('controls.resume', 'Resume')}
                    >
                      <Play fill="currentColor" size={22} className="md:w-6 md:h-6 ml-0.5" />
                    </button>
                  ) : (
                    <button
                      onClick={onPause}
                      disabled={disabled}
                      className={clsx(
                        "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg transition-all",
                        disabled 
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                          : "bg-amber-400 text-white hover:scale-105"
                      )}
                      aria-label={t('controls.pause', 'Pause')}
                    >
                      <Pause fill="currentColor" size={22} className="md:w-6 md:h-6" />
                    </button>
                  )}
                  <button
                    onClick={onStop}
                    disabled={disabled}
                    className={clsx(
                      "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-colors",
                      disabled 
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                        : "bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-400"
                    )}
                    aria-label={t('controls.stop', 'Stop')}
                  >
                    <Square fill="currentColor" size={18} className="md:w-5 md:h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Share & Mobile Settings Toggle */}
            <div className="flex items-center gap-2 ml-auto md:ml-6">
              {/* Share Button */}
              {text && (
                <button 
                  onClick={handleShare}
                  className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-brand/10 hover:text-brand transition-all"
                  aria-label={t('home.share')}
                >
                  <Share2 size={18} />
                </button>
              )}
              
              {/* Mobile Settings Toggle */}
              <button 
                onClick={toggleSettings}
                className={clsx(
                  "md:hidden p-2.5 rounded-lg transition-all",
                  showMobileSettings 
                    ? "bg-brand/10 text-brand" 
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Settings Panel - Always visible on desktop, toggleable on mobile */}
          <div className={clsx(
            "w-full md:w-auto md:flex flex-col md:flex-row gap-2.5 md:gap-3 items-center bg-slate-50/80 rounded-xl border border-slate-100 p-2.5 md:p-3 transition-all duration-300 ease-out origin-top",
            showMobileSettings 
              ? "flex opacity-100 max-h-[500px] scale-y-100" 
              : "hidden md:flex md:opacity-100 md:max-h-none md:scale-y-100 opacity-0 max-h-0 scale-y-95"
          )}>
            
            {/* Mobile Header */}
            <div className="w-full flex justify-between items-center md:hidden pb-2 border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Settings size={10} /> {t('controls.options')}
              </span>
              <button 
                onClick={() => setShowMobileSettings(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            
            {/* Speed Control */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-white p-1.5 rounded-lg shadow-sm text-brand hidden md:block">
                <Settings size={16} />
              </div>
              <div className="flex items-center gap-1.5 flex-1 md:flex-none">
                <span className="text-[10px] md:text-xs font-bold text-slate-400 whitespace-nowrap">{t('controls.slow')}</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speed}
                  onInput={(e) => onSpeedChange(parseFloat((e.target as HTMLInputElement).value))}
                  className="w-full md:w-24 h-1.5 bg-slate-200 rounded-full cursor-pointer accent-brand"
                />
                <span className="text-[10px] md:text-xs font-bold text-slate-400 whitespace-nowrap">{t('controls.fast')}</span>
              </div>
              <span className="bg-white px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold font-mono text-brand border border-slate-100 min-w-[28px] text-center">
                {speed}x
              </span>
            </div>

            <div className="hidden md:block h-5 w-px bg-slate-200"></div>

            {/* Voice Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-white p-1.5 rounded-lg shadow-sm text-fun-pink hidden md:block">
                <Type size={16} />
              </div>
              <div className="relative flex-1 md:w-40">
                <select 
                  value={selectedVoiceName}
                  onChange={(e) => onVoiceChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg focus:ring-2 focus:ring-brand focus:border-brand p-2 pr-7 truncate cursor-pointer appearance-none"
                  disabled={voices.length === 0}
                >
                  {voices.length === 0 && <option>{t('controls.loading_voices')}</option>}
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name.replace(/Microsoft|Google|English|United States/g, '').trim() || v.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[101] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            {shareToast}
          </div>
        </div>
      )}
    </div>
  );
};