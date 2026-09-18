/**
 * QuizContainer 组件测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../utils/render';
import { QuizContainer } from '@/components/quiz/QuizContainer';
import type { QuizItem } from '@/db';

const mockQuizItems: QuizItem[] = [
  {
    id: 'q1',
    type: 'image_choice',
    question: 'apple',
    options: [
      { value: 'apple', image: '🍎' },
      { value: 'banana', image: '🍌' },
    ],
    correctAnswer: 'apple',
  },
  {
    id: 'q2',
    type: 'image_choice',
    question: 'cat',
    options: [
      { value: 'cat', image: '🐱' },
      { value: 'dog', image: '🐶' },
    ],
    correctAnswer: 'cat',
  },
];

describe('QuizContainer 组件', () => {
  const defaultProps = {
    questions: mockQuizItems,
    storyId: 'l1_001',
    onComplete: vi.fn(),
    onExit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('空题目列表时不应该崩溃', () => {
      const { container } = render(
        <QuizContainer {...defaultProps} questions={[]} />
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Props', () => {
    it('应该接受 storyId', () => {
      const { container } = render(
        <QuizContainer {...defaultProps} storyId="test-story" />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('应该接受 onExit 回调', () => {
      const onExit = vi.fn();
      const { container } = render(
        <QuizContainer {...defaultProps} onExit={onExit} />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('应该接受 onComplete 回调', () => {
      const onComplete = vi.fn();
      const { container } = render(
        <QuizContainer {...defaultProps} onComplete={onComplete} />
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('组件完整性', () => {
    it('QuizContainer 应该是有效的 React 组件', () => {
      expect(QuizContainer).toBeDefined();
      expect(typeof QuizContainer).toBe('function');
    });

    it('渲染不应该抛出错误', () => {
      expect(() => render(<QuizContainer {...defaultProps} />)).not.toThrow();
    });
  });

  describe('答完后继续（防越界）', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('反馈被连续触发两次时，不应出现 3/2 空白页', async () => {
      render(<QuizContainer {...defaultProps} />);

      // 答第一题（故意答错也一样）
      fireEvent.click(screen.getByText('🍌'));
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByText('继续加油！')).toBeInTheDocument();

      // 模拟真实 bug：用户点击继续的同时，2s 自动继续也触发
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /点击继续/ }));
        vi.advanceTimersByTime(2000);
      });

      // 越界时会显示 3 / 2 且无题面
      expect(screen.queryByText('3 / 2')).not.toBeInTheDocument();
      // 应停在第 2 题
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('最后一题答完后应进入结果页，而不是越界空白', async () => {
      render(<QuizContainer {...defaultProps} />);

      // Q1
      fireEvent.click(screen.getByText('🍌'));
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /点击继续/ }));
      });

      // Q2
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
      fireEvent.click(screen.getByText('🐶'));
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // 点击 + 自动继续双触发也不应越界
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /点击继续/ }));
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('3 / 2')).not.toBeInTheDocument();
      expect(screen.getByText('继续努力')).toBeInTheDocument();
    });
  });
});
