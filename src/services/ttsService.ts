/**
 * TTS 服务
 * 使用 Web Speech API 实现文本转语音
 * 支持单词级别高亮同步、语速控制、暂停/恢复
 */

/** 老师音色：二选一 */
export type TTSTeacher = 'female' | 'male';

/**
 * 按性别匹配系统音色（名称包含匹配，按优先级取第一个可用的）
 * UI 仍是二选一；这里只是设备音色缺失时的回退链
 */
export const TEACHER_VOICE_PRIORITY: Record<TTSTeacher, readonly string[]> = {
  female: [
    'allison', // 相对柔和，减少尖锐感
    'susan',
    'serena',
    'samantha',
    'victoria',
    'ava',
    'tessa',
    'martha',
    'moira',
    'karen',
    'flo',
    'microsoft jenny',
    'microsoft aria',
    'zira',
    'google uk english female',
    'female',
  ],
  male: [
    'aaron',
    'alex',
    'daniel',
    'microsoft guy',
    'microsoft david',
    'microsoft mark',
    'fred',
    'tom',
    'nathan',
    'google uk english male',
    'male',
  ],
};

/** @deprecated 兼容旧引用：取各性别首选名 */
export const TEACHER_VOICE_NAME: Record<TTSTeacher, string> = {
  female: TEACHER_VOICE_PRIORITY.female[0]!,
  male: TEACHER_VOICE_PRIORITY.male[0]!,
};

type TTSEventCallback = (event: TTSEvent) => void;

interface TTSEvent {
  type: 'start' | 'end' | 'word' | 'pause' | 'resume' | 'error';
  wordIndex?: number;
  word?: string;
  charIndex?: number;
  error?: string;
}

interface TTSOptions {
  rate?: number; // 语速 0.1-10，默认 1
  pitch?: number; // 音调 0-2，默认 1
  volume?: number; // 音量 0-1，默认 1
  lang?: string; // 语言，默认 'en-US'
  voice?: string; // 指定语音名称
  teacher?: TTSTeacher; // 男/女老师
}

interface WordBoundary {
  word: string;
  start: number; // 字符起始位置
  end: number; // 字符结束位置
  index: number; // 单词索引
}

class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isPlaying = false;
  private isPaused = false;
  private currentWordIndex = 0;
  private wordBoundaries: WordBoundary[] = [];
  private listeners: Set<TTSEventCallback> = new Set();
  private options: TTSOptions = {
    rate: 1,
    pitch: 1,
    volume: 1,
    lang: 'en-US',
    teacher: 'female',
  };

  constructor() {
    // 安全检查：某些浏览器/环境可能不支持 speechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();

      // 某些浏览器需要等待 voiceschanged 事件
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * 加载可用语音
   */
  private loadVoices(): void {
    if (!this.synthesis) return;
    this.voices = this.synthesis.getVoices();
  }

  /**
   * 获取可用的英语语音列表
   */
  getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en') || voice.lang.startsWith('EN'));
  }

  /**
   * 设置男/女老师
   */
  setTeacher(teacher: TTSTeacher): void {
    this.options.teacher = teacher;
  }

  /**
   * 获取当前老师
   */
  getTeacher(): TTSTeacher {
    return this.options.teacher || 'female';
  }

  /**
   * 音色名是否匹配候选关键字
   * 注意：不能用 includes('male')，否则会误匹配 "Female"
   */
  private voiceNameMatches(voiceName: string, candidate: string): boolean {
    const name = voiceName.toLowerCase();
    const key = candidate.toLowerCase();

    if (key === 'male') {
      return /\bmale\b/.test(name) && !/\bfemale\b/.test(name);
    }
    if (key === 'female') {
      return /\bfemale\b/.test(name);
    }

    return name.includes(key);
  }

  /**
   * 按老师性别从优先级列表中解析音色
   */
  getRecommendedVoice(): SpeechSynthesisVoice | null {
    this.loadVoices();
    const englishVoices = this.getEnglishVoices();
    if (englishVoices.length === 0) return null;

    const teacher = this.getTeacher();
    const priority = TEACHER_VOICE_PRIORITY[teacher];

    for (const candidate of priority) {
      const matched = englishVoices.find(v => this.voiceNameMatches(v.name, candidate));
      if (matched) return matched;
    }

    // 最后回退：尽量避开明显的异性音色
    const oppositeHints =
      teacher === 'female'
        ? ['aaron', 'alex', 'daniel', 'david', 'guy', 'fred', 'tom', 'male']
        : ['allison', 'ava', 'samantha', 'zira', 'jenny', 'aria', 'susan', 'female'];

    const fallback = englishVoices.find(v => {
      const name = v.name.toLowerCase();
      return !oppositeHints.some(hint =>
        hint === 'male' || hint === 'female'
          ? this.voiceNameMatches(v.name, hint)
          : name.includes(hint)
      );
    });

    return fallback || englishVoices[0] || null;
  }

  /**
   * 老师音色对应的音调：男声略低、女声略柔，减少尖锐感并拉开差异
   */
  private getTeacherPitch(): number {
    if (this.options.pitch !== undefined && this.options.pitch !== 1) {
      return this.options.pitch;
    }
    return this.getTeacher() === 'male' ? 0.85 : 0.95;
  }

  /**
   * 解析文本的单词边界
   */
  private parseWordBoundaries(text: string): WordBoundary[] {
    const boundaries: WordBoundary[] = [];
    const words = text.split(/(\s+)/);
    let charIndex = 0;
    let wordIndex = 0;

    for (const segment of words) {
      if (segment.trim()) {
        boundaries.push({
          word: segment,
          start: charIndex,
          end: charIndex + segment.length,
          index: wordIndex,
        });
        wordIndex++;
      }
      charIndex += segment.length;
    }

    return boundaries;
  }

  /**
   * 根据字符位置查找当前单词索引
   */
  private findWordIndexByCharIndex(charIndex: number): number {
    for (const boundary of this.wordBoundaries) {
      if (charIndex >= boundary.start && charIndex < boundary.end) {
        return boundary.index;
      }
    }
    return this.currentWordIndex;
  }

  /**
   * 设置 TTS 选项
   */
  setOptions(options: Partial<TTSOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取当前语速
   */
  getRate(): number {
    return this.options.rate || 1;
  }

  /**
   * 设置语速
   */
  setRate(rate: number): void {
    this.options.rate = Math.max(0.5, Math.min(2, rate));

    // 如果正在播放，需要重新开始
    if (this.isPlaying && this.utterance) {
      const currentText = this.utterance.text;
      this.stop();
      this.speak(currentText);
    }
  }

  /**
   * 订阅事件
   */
  subscribe(callback: TTSEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 触发事件
   */
  private emit(event: TTSEvent): void {
    this.listeners.forEach(callback => callback(event));
  }

  /**
   * 播放文本
   */
  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查 TTS 是否可用
      if (!this.synthesis) {
        reject(new Error('TTS not supported'));
        return;
      }

      // 停止之前的播放
      this.stop();

      // 解析单词边界
      this.wordBoundaries = this.parseWordBoundaries(text);
      this.currentWordIndex = 0;

      // 创建新的 utterance
      this.utterance = new SpeechSynthesisUtterance(text);

      // 应用选项
      this.utterance.rate = this.options.rate || 1;
      this.utterance.pitch = this.getTeacherPitch();
      this.utterance.volume = this.options.volume || 1;
      this.utterance.lang = this.options.lang || 'en-US';

      // 设置语音
      const voice = this.getRecommendedVoice();
      if (voice) {
        this.utterance.voice = voice;
      }

      // 事件处理
      this.utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        this.emit({ type: 'start' });
      };

      this.utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.emit({ type: 'end' });
        resolve();
      };

      this.utterance.onerror = event => {
        this.isPlaying = false;
        this.isPaused = false;
        const errorMsg = event.error || 'Unknown TTS error';
        this.emit({ type: 'error', error: errorMsg });
        reject(new Error(errorMsg));
      };

      // 单词边界事件（不是所有浏览器都支持）
      this.utterance.onboundary = event => {
        if (event.name === 'word') {
          const wordIndex = this.findWordIndexByCharIndex(event.charIndex);
          this.currentWordIndex = wordIndex;
          const boundary = this.wordBoundaries[wordIndex];

          this.emit({
            type: 'word',
            wordIndex,
            word: boundary?.word,
            charIndex: event.charIndex,
          });
        }
      };

      // 开始播放
      this.synthesis.speak(this.utterance);
    });
  }

  /**
   * 播放单个单词
   */
  speakWord(word: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查 TTS 是否可用
      if (!this.synthesis) {
        reject(new Error('TTS not supported'));
        return;
      }

      // 取消之前的播放但不重置状态
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = (this.options.rate || 1) * 0.9; // 单词稍慢
      utterance.pitch = this.getTeacherPitch();
      utterance.volume = this.options.volume || 1;
      utterance.lang = this.options.lang || 'en-US';

      const voice = this.getRecommendedVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('Word TTS failed'));

      this.synthesis.speak(utterance);
    });
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (!this.synthesis) return;
    if (this.isPlaying && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
      this.emit({ type: 'pause' });
    }
  }

  /**
   * 恢复播放
   */
  resume(): void {
    if (!this.synthesis) return;
    if (this.isPaused) {
      this.synthesis.resume();
      this.isPaused = false;
      this.emit({ type: 'resume' });
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentWordIndex = 0;
    this.utterance = null;
  }

  /**
   * 切换播放/暂停
   */
  toggle(): void {
    if (this.isPaused) {
      this.resume();
    } else if (this.isPlaying) {
      this.pause();
    }
  }

  /**
   * 获取播放状态
   */
  getStatus(): { isPlaying: boolean; isPaused: boolean; currentWordIndex: number } {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentWordIndex: this.currentWordIndex,
    };
  }

  /**
   * 检查是否支持 TTS
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && !!window.speechSynthesis;
  }
}

// 单例导出
export const ttsService = new TTSService();
export default ttsService;
