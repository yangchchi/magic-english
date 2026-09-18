/**
 * ImageChoice 听音辨图测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../utils/render';
import { ImageChoice } from '@/components/quiz/ImageChoice';
import type { QuizItem } from '@/db';

const baseQuestion: QuizItem = {
  id: 'q1',
  type: 'image_choice',
  question: 'apple',
  options: [
    { image: '🍎', value: 'apple' },
    { image: '🍌', value: 'banana' },
  ],
  correctAnswer: 'apple',
};

const pathQuestion: QuizItem = {
  id: 'q2',
  type: 'image_choice',
  question: 'sings',
  options: [
    { image: '/assets/quiz/bird_singing.webp', value: 'sings' },
    { image: '/assets/quiz/bird_flying.webp', value: 'flies' },
    { image: '/assets/quiz/bird_eating.webp', value: 'eats' },
  ],
  correctAnswer: 'sings',
};

describe('ImageChoice 听音', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('没有 audioQuestion 时点击听音仍应调用 speechSynthesis.speak', async () => {
    // 故事题大多没有 audioQuestion，点击必须仍能播题干
    render(
      <ImageChoice
        question={baseQuestion}
        onAnswer={vi.fn()}
        onHint={vi.fn()}
      />
    );

    // 完成挂载后的自动播放
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    const autoUtterance = vi.mocked(window.speechSynthesis.speak).mock
      .calls[0]?.[0] as SpeechSynthesisUtterance & { onend: (() => void) | null };
    await act(async () => {
      autoUtterance?.onend?.();
    });
    vi.mocked(window.speechSynthesis.speak).mockClear();

    fireEvent.click(screen.getByRole('button', { name: '点击听音' }));

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = vi.mocked(window.speechSynthesis.speak).mock
      .calls[0]?.[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('apple');
  });

  it('选项 image 为资源路径时应渲染 img，而不是把路径当文字显示', () => {
    render(
      <ImageChoice
        question={pathQuestion}
        onAnswer={vi.fn()}
        onHint={vi.fn()}
      />
    );

    expect(screen.queryByText('/assets/quiz/bird_singing.webp')).not.toBeInTheDocument();
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    expect(imgs[0]).toHaveAttribute('src', '/assets/quiz/bird_singing.webp');
  });

  it('emoji 选项仍按 emoji 文本渲染', () => {
    render(
      <ImageChoice
        question={baseQuestion}
        onAnswer={vi.fn()}
        onHint={vi.fn()}
      />
    );

    expect(screen.getByText('🍎')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('audioQuestion 为缺失的 mp3 时应同步回退 TTS（不丢用户手势）', async () => {
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak');

    vi.stubGlobal(
      'Audio',
      class MockAudio {
        onended: ((this: HTMLAudioElement, ev: Event) => void) | null = null;
        onerror: ((this: HTMLAudioElement, ev: Event) => void) | null = null;
        onplaying: ((this: HTMLAudioElement, ev: Event) => void) | null = null;
        src = '';
        play = vi.fn().mockRejectedValue(new Error('NotFoundError'));
        constructor(src?: string) {
          this.src = src || '';
        }
      }
    );

    render(
      <ImageChoice
        question={{
          id: 'q-audio-missing',
          type: 'image_choice',
          question: 'What does the bird do every morning?',
          audioQuestion: '/assets/audio/l2/001_q1.mp3',
          options: [
            { image: '🐦', value: 'sings' },
            { image: '🪽', value: 'flies' },
          ],
          correctAnswer: 'sings',
        }}
        onAnswer={vi.fn()}
        onHint={vi.fn()}
      />
    );

    // 跳过自动播放
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    // 结束自动播放触发的 utterance，恢复按钮文案
    const autoUtterance = speakSpy.mock.calls.at(-1)?.[0] as
      | (SpeechSynthesisUtterance & { onend: (() => void) | null })
      | undefined;
    await act(async () => {
      autoUtterance?.onend?.();
    });
    speakSpy.mockClear();

    fireEvent.click(screen.getByRole('button', { name: '点击听音' }));

    expect(speakSpy).toHaveBeenCalled();
    const utterance = speakSpy.mock.calls.at(-1)?.[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('What does the bird do every morning?');
  });
});
