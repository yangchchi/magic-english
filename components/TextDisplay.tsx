import React, { useMemo, useState, useEffect, useRef } from 'react';
import { WordToken } from '../types';
import clsx from 'clsx';
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TextDisplayProps {
  rawText: string;
  highlightIndex: number;
  onTokensGenerated: (tokens: WordToken[]) => void;
  onWordClick: (word: string) => void;
  onTextSelected: (text: string) => void;
}

export const TextDisplay: React.FC<TextDisplayProps> = ({ 
  rawText, 
  highlightIndex, 
  onTokensGenerated,
  onWordClick,
  onTextSelected
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const [selectionPopup, setSelectionPopup] = useState<{x: number, y: number, text: string, showBelow: boolean} | null>(null);
  const { t } = useTranslation();

  // Parse text into tokens
  const tokens = useMemo(() => {
    const t: WordToken[] = [];
    // Robust regex: capture any sequence of non-whitespace characters
    // This groups "word" and "word," as single tokens, which aligns with how most people read text chunks.
    const regex = /([^\s]+)/g; 
    let match;
    
    while ((match = regex.exec(rawText)) !== null) {
      t.push({
        id: `word-${match.index}`,
        text: match[0],
        cleanText: match[0].replace(/[^\w\s']/g, ""),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    return t;
  }, [rawText]);

  // Report tokens back to parent
  useEffect(() => {
    onTokensGenerated(tokens);
  }, [tokens, onTokensGenerated]);

  // Auto-scroll to active word
  useEffect(() => {
    if (highlightIndex !== -1 && activeWordRef.current) {
        activeWordRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
    }
  }, [highlightIndex]);

  // Handle Text Selection (supports both mouse and touch)
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current?.contains(selection.anchorNode)) {
        setSelectionPopup(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Calculate position with viewport boundary detection
        const viewportWidth = window.innerWidth;
        const popupWidth = 150; // Approximate popup width
        let x = rect.left + (rect.width / 2);
        
        // Ensure popup doesn't overflow left/right edges
        x = Math.max(popupWidth / 2 + 10, x);
        x = Math.min(viewportWidth - popupWidth / 2 - 10, x);
        
        // Ensure popup doesn't go above viewport
        let y = rect.top - 10;
        let showBelow = false;
        if (y < 60) {
          // Show below selection if too close to top
          y = rect.bottom + 10;
          showBelow = true;
        }
        
        setSelectionPopup({ x, y, text, showBelow });
      }
    };

    // Debounce for touch events to avoid premature triggers
    let touchTimer: ReturnType<typeof setTimeout>;
    const handleTouchEnd = () => {
      // Small delay to let selection finalize on mobile
      touchTimer = setTimeout(handleSelectionChange, 100);
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
      document.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(touchTimer);
    };
  }, []);

  if (!rawText) return null;

  return (
    <>
        <div 
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
            className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl p-4 md:p-12 min-h-[25vh] md:min-h-[40vh] landscape:min-h-[35vh] leading-[2.2] md:leading-[2.8] text-lg md:text-3xl font-sans text-slate-700 relative border-b-4 md:border-b-8 border-brand-light text-display-area"
        >
        <div className="flex flex-wrap gap-x-2 gap-y-2 md:gap-x-[14px] md:gap-y-[12px]">
            {tokens.map((token, index) => {
            const isActive = index === highlightIndex;
            return (
                <span
                key={token.id}
                ref={isActive ? activeWordRef : null}
                onClick={(e) => {
                    e.stopPropagation();
                    onWordClick(token.cleanText);
                }}
                className={clsx(
                    "cursor-pointer rounded-md md:rounded-lg px-2 py-1 md:px-3 md:py-1.5 transition-all duration-200 border-2 select-text relative",
                    isActive 
                    ? "bg-blue-600 text-white border-blue-600 scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1 font-bold shadow-lg md:shadow-xl shadow-blue-500/40 z-10" 
                    : "border-transparent text-slate-700 hover:bg-sky-50 hover:text-sky-600 hover:scale-105 active:bg-sky-100 active:scale-95"
                )}
                >
                {token.text}
                </span>
            );
            })}
        </div>
        </div>

        {/* Floating Play Button for Selection */}
        {selectionPopup && (
            <div 
                className={clsx(
                    "fixed z-[102] transform -translate-x-1/2 animate-fade-in",
                    selectionPopup.showBelow ? "" : "-translate-y-full"
                )}
                style={{ left: selectionPopup.x, top: selectionPopup.y }}
            >
                {/* Arrow pointing up when popup is below selection */}
                {selectionPopup.showBelow && (
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-slate-900 rotate-45 mx-auto mb-[-6px] md:mb-[-8px]"></div>
                )}
                <button
                    onClick={() => {
                        onTextSelected(selectionPopup.text);
                        setSelectionPopup(null);
                        window.getSelection()?.removeAllRanges();
                    }}
                    className={clsx(
                        "flex items-center gap-1.5 md:gap-2 bg-slate-900 text-white px-3.5 py-2 md:px-5 md:py-2.5 rounded-full shadow-xl hover:bg-black transition-transform hover:scale-105 font-bold text-xs md:text-sm whitespace-nowrap border-2 border-white/20",
                        selectionPopup.showBelow ? "mt-2 md:mt-3" : "mb-2 md:mb-3"
                    )}
                >
                    <Volume2 size={16} className="md:w-[18px] md:h-[18px]" />
                    {t('text_display.read_selection')}
                </button>
                {/* Arrow pointing down when popup is above selection */}
                {!selectionPopup.showBelow && (
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-slate-900 rotate-45 mx-auto -mt-4 md:-mt-5"></div>
                )}
            </div>
        )}
    </>
  );
};