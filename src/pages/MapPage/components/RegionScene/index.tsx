/**
 * RegionScene - 区域场景组件
 * 单个区域的完整场景，包含主题背景、节点路径
 */

import { useMemo, memo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { UnifiedMapNode, LevelSection } from '@/data/unifiedMap';
import { levelThemeColors, nodeTypeStyles, getNodeVisualConfig } from '@/data/unifiedMap';
import styles from './styles.module.css';

interface RegionSceneProps {
  section: LevelSection;
  nodes: UnifiedMapNode[];
  progress: { completed: number; total: number; percentage: number };
  isUnlocked: boolean;
  isCurrent: boolean;
  isActive: boolean;
  activeNodeId: string;
  onNodeClick: (node: UnifiedMapNode) => void;
  index: number;
  totalRegions: number;
}

// 区域配置
const regionConfigs: Record<number, { name: string; nameCn: string; emoji: string; bgPattern: string }> = {
  1: { name: 'Sprout Forest', nameCn: '萌芽之森', emoji: '🌲', bgPattern: 'forest' },
  2: { name: 'Echo Valley', nameCn: '回声山谷', emoji: '⛰️', bgPattern: 'valley' },
  3: { name: 'Deep Ocean', nameCn: '深海秘境', emoji: '🌊', bgPattern: 'ocean' },
  4: { name: 'Cloud Castle', nameCn: '云端城堡', emoji: '☁️', bgPattern: 'cloud' },
  5: { name: 'Star Maze', nameCn: '星空迷宫', emoji: '⭐', bgPattern: 'stars' },
  6: { name: 'Time Gallery', nameCn: '时光长廊', emoji: '⏳', bgPattern: 'time' },
  7: { name: 'Magic Core', nameCn: '魔力核心', emoji: '💎', bgPattern: 'core' },
};

/** 流星划过（与首页 MagicBackground 同款） */
function useMeteorCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    const resize = () => {
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    type Meteor = {
      x: number;
      y: number;
      length: number;
      speed: number;
      alpha: number;
    };
    const meteors: Meteor[] = [];

    const spawnMeteor = () => {
      if (meteors.length >= 3) return;
      // 约每 4–6 秒出现一颗（帧率约 60 时）
      if (Math.random() > 0.9965) return;
      const w = parent?.clientWidth || window.innerWidth;
      meteors.push({
        x: Math.random() * w * 0.85 + w * 0.05,
        y: Math.random() * 40 - 10,
        length: Math.random() * 55 + 40,
        speed: Math.random() * 2.2 + 6.4,
        alpha: 1,
      });
    };

    let animationId = 0;
    const animate = () => {
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      spawnMeteor();

      for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        const tailX = meteor.x - meteor.length * 0.7;
        const tailY = meteor.y - meteor.length;

        const gradient = ctx.createLinearGradient(
          meteor.x,
          meteor.y,
          tailX,
          tailY
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.alpha})`);
        gradient.addColorStop(0.45, `rgba(255, 255, 255, ${meteor.alpha * 0.45})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 头部亮点
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${meteor.alpha})`;
        ctx.fill();

        meteor.x += meteor.speed * 0.75;
        meteor.y += meteor.speed;
        meteor.alpha -= 0.006;

        if (meteor.alpha <= 0 || meteor.y > h + 40) {
          meteors.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [canvasRef, enabled]);
}

const RegionScene: React.FC<RegionSceneProps> = memo(({
  section,
  nodes,
  progress,
  isUnlocked,
  isCurrent: _isCurrent, // eslint-disable-line @typescript-eslint/no-unused-vars
  isActive,
  activeNodeId,
  onNodeClick,
  index,
  totalRegions,
}) => {
  const themeColors = levelThemeColors[section.level];
  const config = regionConfigs[section.level] || regionConfigs[1];
  const meteorCanvasRef = useRef<HTMLCanvasElement>(null);
  useMeteorCanvas(meteorCanvasRef, isActive);

  // 生成 S 形路径节点位置（使用固定像素间距）
  const nodePositions = useMemo(() => {
    const positions: Array<{ x: number; y: number; node: UnifiedMapNode }> = [];
    const totalNodes = nodes.length;
    
    // S 形路径参数
    const amplitude = 30; // 横向摆动幅度 (%)
    const nodeSpacing = 100; // 节点间距 (px)
    const startY = 60; // 起始位置 (px)
    
    nodes.forEach((node, idx) => {
      // 从下往上排列，y 是实际像素值
      const progress = idx / Math.max(totalNodes - 1, 1);
      const y = startY + idx * nodeSpacing; // 从顶部开始向下排列
      
      // S 形曲线
      const xOffset = Math.sin(progress * Math.PI * 2) * amplitude;
      const x = 50 + xOffset; // x 仍使用百分比
      
      positions.push({ x, y, node });
    });
    
    return positions;
  }, [nodes]);

  // 计算路径容器的总高度
  const pathHeight = useMemo(() => {
    const totalNodes = nodes.length;
    const nodeSpacing = 100;
    const startY = 60;
    const endPadding = 80;
    return startY + (totalNodes - 1) * nodeSpacing + endPadding;
  }, [nodes]);

  // 生成路径 SVG（使用像素坐标）
  const pathD = useMemo(() => {
    if (nodePositions.length < 2) return '';
    
    // 转换 x 百分比为实际像素值（假设容器宽度 300px）
    const containerWidth = 300;
    const points = nodePositions.map(p => ({ 
      x: (p.x / 100) * containerWidth, 
      y: p.y 
    }));
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
    }
    
    return d;
  }, [nodePositions]);

  // 计算已完成路径的比例
  const completedRatio = useMemo(() => {
    const completedCount = nodes.filter(n => n.completed).length;
    return nodes.length > 0 ? completedCount / nodes.length : 0;
  }, [nodes]);

  // 稳定粒子位置
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        left: ((i * 37) % 100) + (i % 5) * 0.4,
        top: ((i * 53) % 100) + (i % 7) * 0.3,
        delay: (i % 8) * 0.4,
        duration: 3 + (i % 5),
      })),
    []
  );

  return (
    <div
      className={`${styles.scene} ${isActive ? styles.sceneActive : ''} ${!isUnlocked ? styles.sceneLocked : ''}`}
      style={{
        '--theme-primary': themeColors.primary,
        '--theme-secondary': themeColors.secondary,
        '--theme-bg': themeColors.bg,
      } as React.CSSProperties}
    >
      {/* 背景层 */}
      <div className={styles.background}>
        <div className={`${styles.bgPattern} ${styles[`bgPattern_${config.bgPattern}`]}`} />
        <div className={styles.bgGradient} />

        {/* 流星层（同首页） */}
        <canvas
          ref={meteorCanvasRef}
          className={styles.meteorCanvas}
          aria-hidden
        />
        
        {/* 装饰元素 */}
        <div className={styles.decorations}>
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 区域标题 */}
      <motion.div
        className={styles.regionHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className={styles.regionIcon}>{config.emoji}</div>
        <div className={styles.regionInfo}>
          <h2 className={styles.regionName}>{config.nameCn}</h2>
          <span className={styles.regionLevel}>Level {section.level}</span>
        </div>
        <div className={styles.regionProgress}>
          <div className={styles.progressRing}>
            <svg viewBox="0 0 36 36" className={styles.progressSvg}>
              <path
                className={styles.progressBg}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.progressFill}
                strokeDasharray={`${progress.percentage}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={styles.progressText}>{progress.percentage}%</span>
          </div>
        </div>
      </motion.div>

      {/* 节点路径 - 可滚动容器 */}
      <div className={styles.pathContainer}>
        <div 
          className={styles.pathScroller}
          style={{ height: `${pathHeight}px` }}
        >
          {/* 路径线 SVG */}
          <svg 
            className={styles.pathSvg} 
            viewBox={`0 0 300 ${pathHeight}`}
            preserveAspectRatio="xMidYMin meet"
          >
            {/* 背景路径 */}
            <path
              d={pathD}
              className={styles.pathBg}
              fill="none"
              strokeWidth="3"
            />
            {/* 已完成路径 */}
            <path
              d={pathD}
              className={styles.pathCompleted}
              fill="none"
              strokeWidth="3"
              style={{
                strokeDasharray: `${completedRatio * pathHeight * 1.5} ${pathHeight * 2}`,
              }}
            />
          </svg>

          {/* 节点 */}
          {nodePositions.map(({ x, y, node }, idx) => {
            const visual = getNodeVisualConfig(node);
            const isActiveNode = node.id === activeNodeId;
            const typeStyle = nodeTypeStyles[node.type] || nodeTypeStyles.story;
            
            return (
              <motion.button
                key={node.id}
                className={`
                  ${styles.node}
                  ${styles[`node_${typeStyle.size}`]}
                  ${node.unlocked ? styles.nodeUnlocked : styles.nodeLocked}
                  ${node.completed ? styles.nodeCompleted : ''}
                  ${isActiveNode ? styles.nodeActive : ''}
                `}
                style={{
                  left: `${x}%`,
                  top: `${y}px`,
                  '--node-color': visual.themeColor.primary,
                  '--node-color-secondary': visual.themeColor.secondary,
                } as React.CSSProperties}
                onClick={() => node.unlocked && onNodeClick(node)}
                disabled={!node.unlocked}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: node.unlocked ? 1 : 0.4,
                }}
                transition={{ delay: idx * 0.05 }}
                whileHover={node.unlocked ? { scale: 1.15 } : undefined}
                whileTap={node.unlocked ? { scale: 0.95 } : undefined}
              >
                {/* 发光效果 */}
                {isActiveNode && (
                  <div className={styles.nodeGlow} />
                )}
                
                {/* 图标 */}
                <span className={styles.nodeIcon}>
                  {node.emoji || typeStyle.icon}
                </span>
                
                {/* 完成标记 */}
                {node.completed && (
                  <div className={styles.nodeCheckmark}>✓</div>
                )}
                
                {/* 锁定图标 */}
                {!node.unlocked && (
                  <div className={styles.nodeLock}>🔒</div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 锁定遮罩 */}
      {!isUnlocked && (
        <div className={styles.lockedOverlay}>
          <div className={styles.lockedContent}>
            <span className={styles.lockedIcon}>🔒</span>
            <p className={styles.lockedText}>完成上一区域解锁</p>
          </div>
        </div>
      )}

      {/* 区域边缘指示器 */}
      {index > 0 && (
        <div className={styles.edgeIndicatorLeft}>
          <span>‹</span>
        </div>
      )}
      {index < totalRegions - 1 && (
        <div className={styles.edgeIndicatorRight}>
          <span>›</span>
        </div>
      )}
    </div>
  );
});

RegionScene.displayName = 'RegionScene';

export default RegionScene;

