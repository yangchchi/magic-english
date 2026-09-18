/**
 * ImageChoice 组件
 * 听音辨图题型 - 听音频选择正确的图片
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { QuizItem, QuizOption } from '@/db';
import { ttsService } from '@/services/ttsService';
import styles from './ImageChoice.module.css';

interface ImageChoiceProps {
  question: QuizItem;
  onAnswer: (answer: string) => void;
  onHint: () => void;
}

/** 判断是否为图片资源路径（而非 emoji） */
export const isImageUrl = (value: string): boolean =>
  /^(https?:\/\/|\/|data:image\/)/i.test(value) ||
  /\.(webp|png|jpe?g|gif|svg)(\?|$)/i.test(value);

const OptionVisual: React.FC<{ option: QuizOption }> = ({ option }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = option.image;
  const fallbackLabel = option.text || option.value;

  if (image && isImageUrl(image) && !imageFailed) {
    return (
      <div className={styles.optionImage}>
        <img
          className={styles.optionImg}
          src={image}
          alt={fallbackLabel}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  if (image && !isImageUrl(image)) {
    return (
      <div className={styles.optionImage}>
        <span className={styles.emoji}>{image}</span>
      </div>
    );
  }

  return <div className={styles.optionText}>{fallbackLabel}</div>;
};

export const ImageChoice: React.FC<ImageChoiceProps> = ({
  question,
  onAnswer,
  onHint,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 判断 audioQuestion 是否为可播放的音频文件路径
  const isAudioUrl = (value: string) =>
    /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(value) || value.startsWith('/assets/audio');

  /**
   * 播放听音内容。
   * 注意：Chrome 要求 speechSynthesis 在用户手势的同步调用栈内触发。
   * 因此不能先 await 音频文件再 TTS——文件缺失时会丢掉手势导致“点击无声”。
   */
  const playAudio = useCallback(() => {
    if (typeof window === 'undefined') return;

    const text = question.question;
    if (!text || !ttsService.isSupported()) return;

    const audioSrc = question.audioQuestion;
    // 仅当明确是音频 URL 时尝试文件；失败不阻塞，TTS 必须同步启动
    if (audioSrc && isAudioUrl(audioSrc)) {
      setIsPlaying(true);
      let audioOk = false;
      const audio = new Audio(audioSrc);

      // 同步启动 TTS（保留用户手势）；若音频真正开始播放再打断 TTS
      const ttsPromise = ttsService.speak(text).catch(() => undefined);

      audio.onplaying = () => {
        audioOk = true;
        ttsService.stop();
        setIsPlaying(true);
      };
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        // 交给已启动的 TTS
        void ttsPromise.finally(() => {
          if (!audioOk) setIsPlaying(false);
        });
      };
      void audio.play().catch(() => {
        void ttsPromise.finally(() => {
          if (!audioOk) setIsPlaying(false);
        });
      });

      void ttsPromise.finally(() => {
        if (!audioOk) setIsPlaying(false);
      });
      return;
    }

    setIsPlaying(true);
    void ttsService
      .speak(text)
      .catch(() => undefined)
      .finally(() => setIsPlaying(false));
  }, [question]);

  // 自动播放
  useEffect(() => {
    const timer = setTimeout(playAudio, 500);
    return () => clearTimeout(timer);
  }, [playAudio]);

  // 换题时重置选中态
  useEffect(() => {
    setSelectedOption(null);
  }, [question.id]);

  // 选择选项
  const handleSelect = useCallback((value: string) => {
    if (selectedOption) return; // 防止重复选择
    setSelectedOption(value);
    
    // 延迟提交，让用户看到选中效果
    setTimeout(() => {
      onAnswer(value);
    }, 300);
  }, [selectedOption, onAnswer]);

  // 提示信息状态
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // 使用提示
  const handleHint = useCallback(() => {
    onHint();
    // 显示提示信息
    setHintMessage('💡 提示：仔细听单词的发音！(-5 魔力值)');
    // 3秒后隐藏
    setTimeout(() => setHintMessage(null), 3000);
  }, [onHint]);

  return (
    <div className={styles.container}>
      {/* 题目区域 */}
      <div className={styles.questionSection}>
        <h2 className={styles.title}>🎧 听一听，选一选</h2>
        <p className={styles.instruction}>点击喇叭听单词，选择对应的图片</p>
        
        <motion.button
          className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
          onClick={playAudio}
          whileTap={{ scale: 0.95 }}
          aria-label={isPlaying ? '播放中' : '点击听音'}
        >
          <span className={styles.playIcon}>{isPlaying ? '🔊' : '🔈'}</span>
          <span className={styles.playText}>
            {isPlaying ? '播放中...' : '点击听音'}
          </span>
        </motion.button>
      </div>

      {/* 选项区域 */}
      <div className={styles.optionsGrid}>
        {question.options?.map((option, index) => (
          <motion.button
            key={option.value}
            className={`${styles.option} ${selectedOption === option.value ? styles.selected : ''}`}
            onClick={() => handleSelect(option.value)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <OptionVisual option={option} />
          </motion.button>
        ))}
      </div>

      {/* 提示按钮和消息 */}
      <div className={styles.hintSection}>
        {hintMessage && (
          <motion.div
            className={styles.hintMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {hintMessage}
          </motion.div>
        )}
        <button className={styles.hintBtn} onClick={handleHint}>
          💡 提示 (-5 MP)
        </button>
      </div>
    </div>
  );
};

export default ImageChoice;
