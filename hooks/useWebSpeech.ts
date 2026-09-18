import { useState, useEffect, useRef, useCallback } from 'react';
import { WordToken, DebugInfo } from '../types';

interface UseWebSpeechProps {
  text: string;
  speed: number;
  tokens: WordToken[];
  selectedVoice: SpeechSynthesisVoice | null;
  onEnd: () => void;
}

// Detect iOS for platform-specific workarounds
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if SpeechSynthesis is available
export const isSpeechAvailable = () => {
  return typeof window !== 'undefined' && 
    'speechSynthesis' in window && 
    'SpeechSynthesisUtterance' in window;
};

export const useWebSpeech = ({ text, speed, tokens, selectedVoice, onEnd }: UseWebSpeechProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    charIndex: -1,
    matchedTokenText: '-',
    isSpeaking: false,
    totalTokens: 0,
    lastEventTime: '-',
    playbackState: 'idle',
    voiceName: '',
    isLocalVoice: false
  });
  
  // Use a ref to store the utterance to prevent garbage collection
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const tokensRef = useRef<WordToken[]>(tokens);
  
  // iOS workaround: track pause position for manual resume
  const pausePositionRef = useRef<number>(0);
  const boundaryReceivedRef = useRef<boolean>(false);
  const highlightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Keep tokens ref in sync
  useEffect(() => {
    tokensRef.current = tokens;
    setDebugInfo(prev => ({ ...prev, totalTokens: tokens.length }));
  }, [tokens]);

  const getSynth = () => window.speechSynthesis;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isSpeechAvailable()) return;
      const synth = getSynth();
      synth.cancel();
      if ((window as any).__ttsUtterance) {
        delete (window as any).__ttsUtterance;
      }
      // Clear highlight timer
      if (highlightTimerRef.current) {
        clearInterval(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, []);

  // Store current state in refs to avoid stale closures
  const isSpeakingRef = useRef(isSpeaking);
  const isPausedRef = useRef(isPaused);
  
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    isPausedRef.current = isPaused;
  }, [isSpeaking, isPaused]);

  // Handle settings changes (Auto-restart) - use refs to avoid dependency issues
  useEffect(() => {
    if (!isSpeechAvailable()) return;
    
    if (isSpeakingRef.current && !isPausedRef.current) {
       const currentText = utteranceRef.current?.text;
       // Only restart if the text is consistent and matches the main story
       // (Don't auto restart if we are reading a single selected word)
       if (currentText && currentText === text) {
          const synth = getSynth();
          synth.cancel();
          const timer = setTimeout(() => {
            // Trigger play through a fresh call
            playRef.current?.();
          }, 50);
          return () => clearTimeout(timer);
       }
    }
  }, [speed, selectedVoice?.name, text]); 

  const handleError = (e: SpeechSynthesisErrorEvent) => {
    if (e.error === 'canceled' || e.error === 'interrupted') return;
    console.error("SpeechSynthesis error:", e.error, e);
    setIsSpeaking(false);
    setIsPaused(false);
    setDebugInfo(prev => ({ ...prev, playbackState: `Error: ${e.error}` }));
  };

  const updateDebug = (charIndex: number, tokenText: string, state: string) => {
    setDebugInfo(prev => ({
        ...prev,
        charIndex,
        matchedTokenText: tokenText,
        lastEventTime: new Date().toISOString().split('T')[1].slice(0, 12),
        playbackState: state,
        isSpeaking: true,
        voiceName: selectedVoice?.name,
        isLocalVoice: selectedVoice?.localService
    }));
  };

  // Stop highlight fallback timer
  const stopHighlightTimer = useCallback(() => {
    if (highlightTimerRef.current) {
      clearInterval(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }, []);

  // Start highlight fallback timer for iOS (time-based estimation)
  const startHighlightFallback = useCallback(() => {
    if (!isIOS()) return;
    
    stopHighlightTimer();
    startTimeRef.current = Date.now();
    
    // Estimate ~150ms per word at 1x speed, adjust by rate
    const msPerWord = 150 / speed;
    
    highlightTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentTokens = tokensRef.current;
      
      // Only use fallback if boundary events haven't fired
      if (!boundaryReceivedRef.current && currentTokens.length > 0) {
        const estimatedIndex = Math.min(
          Math.floor(elapsed / msPerWord),
          currentTokens.length - 1
        );
        setHighlightIndex(estimatedIndex);
      }
    }, msPerWord);
  }, [speed, stopHighlightTimer]);

  const stop = useCallback(() => {
    if (!isSpeechAvailable()) return;
    
    const synth = getSynth();
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setHighlightIndex(-1);
    utteranceRef.current = null;
    pausePositionRef.current = 0;
    stopHighlightTimer();
    setDebugInfo(prev => ({ ...prev, playbackState: 'Stopped', isSpeaking: false }));
  }, [stopHighlightTimer]);

  const speakText = useCallback((arbitraryText: string) => {
      if (!isSpeechAvailable()) return;
      
      const synth = getSynth();
      synth.cancel(); 
      setIsPaused(false);
      setIsSpeaking(true);
      setHighlightIndex(-1);
      stopHighlightTimer();
      
      const utterance = new SpeechSynthesisUtterance(arbitraryText);
      (window as any).__ttsUtterance = utterance; 
      utteranceRef.current = utterance;

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = speed;
      
      utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
      };
      utterance.onerror = handleError;
      synth.speak(utterance);
  }, [selectedVoice, speed, stopHighlightTimer]);

  const play = useCallback(() => {
    if (!isSpeechAvailable()) return;
    
    const synth = getSynth();

    // iOS workaround: native pause/resume is unreliable, so we track position manually
    if (isPaused && !isIOS()) {
      synth.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      setDebugInfo(prev => ({ ...prev, playbackState: 'Resumed' }));
      return;
    }

    synth.cancel();
    setHighlightIndex(-1);
    boundaryReceivedRef.current = false;
    stopHighlightTimer();
    
    setDebugInfo(prev => ({ 
        ...prev, 
        playbackState: 'Starting...', 
        totalTokens: tokensRef.current.length,
        voiceName: selectedVoice?.name,
        isLocalVoice: selectedVoice?.localService
    }));

    const utterance = new SpeechSynthesisUtterance(text);
    // CRITICAL: Attach to window to prevent Garbage Collection
    (window as any).__ttsUtterance = utterance;
    utteranceRef.current = utterance;

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = speed;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      pausePositionRef.current = 0;
      setDebugInfo(prev => ({ ...prev, playbackState: 'Speaking' }));
      
      // Start fallback timer for iOS where boundary events may not fire
      if (isIOS()) {
        startHighlightFallback();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setHighlightIndex(-1);
      stopHighlightTimer();
      setDebugInfo(prev => ({ ...prev, playbackState: 'Finished', isSpeaking: false }));
      onEnd();
    };

    utterance.onerror = handleError;

    // --- Core Highlighting Logic ---
    utterance.onboundary = (event) => {
      // Mark that we're receiving boundary events (disable fallback)
      boundaryReceivedRef.current = true;
      stopHighlightTimer();
      
      const charIndex = event.charIndex;
      pausePositionRef.current = charIndex; // Track position for iOS resume
      const currentTokens = tokensRef.current;
      
      if (typeof charIndex === 'number' && currentTokens.length > 0) {
        
        // 1. Direct Match
        let matchIndex = currentTokens.findIndex(t => 
            charIndex >= t.startIndex && charIndex < t.endIndex
        );

        // 2. Sticky/Closest Logic
        if (matchIndex === -1) {
            let lastTokenIndex = -1;
            for (let i = currentTokens.length - 1; i >= 0; i--) {
                if (currentTokens[i].startIndex < charIndex) {
                    lastTokenIndex = i;
                    break;
                }
            }
            if (lastTokenIndex !== -1) {
                matchIndex = lastTokenIndex;
            }
        }

        if (matchIndex !== -1) {
            setHighlightIndex(matchIndex);
            updateDebug(charIndex, currentTokens[matchIndex].text, 'Speaking (Match)');
        } else {
            updateDebug(charIndex, 'No Token', 'Speaking (Gap)');
        }
      }
    };

    synth.speak(utterance);
  }, [text, speed, selectedVoice, isPaused, onEnd, stopHighlightTimer, startHighlightFallback]); 

  const pause = useCallback(() => {
    if (!isSpeechAvailable()) return;
    
    const synth = getSynth();
    if (synth.speaking && !synth.paused) {
      // iOS workaround: pause() is unreliable, just cancel and track position
      if (isIOS()) {
        synth.cancel();
        setIsPaused(true);
        setIsSpeaking(false);
        stopHighlightTimer();
        setDebugInfo(prev => ({ ...prev, playbackState: 'Paused (iOS)' }));
      } else {
        synth.pause();
        setIsPaused(true);
        setIsSpeaking(false);
        setDebugInfo(prev => ({ ...prev, playbackState: 'Paused' }));
      }
    }
  }, [stopHighlightTimer]);

  const speakSingleWord = useCallback((word: string) => {
    if (!isSpeechAvailable()) return;
    
    const synth = getSynth();
    synth.cancel();
    setIsSpeaking(true);
    setHighlightIndex(-1);
    stopHighlightTimer();
    
    const utterance = new SpeechSynthesisUtterance(word);
    (window as any).__ttsUtterance = utterance;
    
    utteranceRef.current = utterance;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = Math.max(0.6, speed * 0.8);
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = handleError;
    
    synth.speak(utterance);
  }, [selectedVoice, speed, stopHighlightTimer]);

  // Store play function in ref for settings change handler
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  return {
    isSpeaking,
    isPaused,
    highlightIndex,
    debugInfo,
    play,
    pause,
    stop,
    speakSingleWord,
    speakText,
    isAvailable: isSpeechAvailable()
  };
};