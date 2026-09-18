/**
 * 统一地图数据
 * 合并所有级别的节点为一条完整路径
 * 类似多邻国的设计：从底部起点向上延伸
 */

import type { MapNode, MapRegion } from '@/db';
import { levelDataMap } from './index';
import type { LevelNumber } from './index';

// 重新导出 LevelNumber 供外部使用
export type { LevelNumber };

// ============ 类型定义 ============

/** 统一地图节点 - 扩展基础节点 */
export interface UnifiedMapNode extends MapNode {
  /** 所属级别 1-7 */
  level: LevelNumber;
  /** 全局排序索引（从0开始，0是起点） */
  globalIndex: number;
  /** 级别内的索引 */
  levelIndex: number;
  /** 级别主题 */
  theme: string;
  /** 是否是级别的第一个节点 */
  isLevelStart: boolean;
  /** 是否是级别的最后一个节点（Boss） */
  isLevelEnd: boolean;
}

/** 级别分隔信息 */
export interface LevelSection {
  level: LevelNumber;
  region: MapRegion;
  startIndex: number;
  endIndex: number;
  nodeCount: number;
}

/** 统一地图数据 */
export interface UnifiedMapData {
  nodes: UnifiedMapNode[];
  sections: LevelSection[];
  totalNodes: number;
}

// ============ 节点高度配置 ============

/** 节点项高度（用于虚拟滚动计算） */
export const NODE_ITEM_HEIGHT = 120;

/** 级别分隔区域高度 */
export const LEVEL_DIVIDER_HEIGHT = 80;

/** 节点类型样式映射 */
export const nodeTypeStyles: Record<string, { color: string; icon: string; size: 'sm' | 'md' | 'lg' }> = {
  story: { color: '#6B5CE7', icon: '📖', size: 'md' },
  boss: { color: '#F59E0B', icon: '👑', size: 'lg' },
  challenge: { color: '#EF4444', icon: '⚡', size: 'md' },
  bonus: { color: '#10B981', icon: '🎁', size: 'sm' },
  treasure: { color: '#8B5CF6', icon: '💎', size: 'sm' },
  checkpoint: { color: '#3B82F6', icon: '🏁', size: 'md' },
};

/** 级别主题颜色 */
export const levelThemeColors: Record<LevelNumber, { primary: string; secondary: string; bg: string }> = {
  1: { primary: '#22C55E', secondary: '#86EFAC', bg: '#052E16' },  // 森林绿
  2: { primary: '#8B5CF6', secondary: '#C4B5FD', bg: '#1E1B4B' },  // 山谷紫
  3: { primary: '#06B6D4', secondary: '#67E8F9', bg: '#042F2E' },  // 海洋蓝
  4: { primary: '#F472B6', secondary: '#FBCFE8', bg: '#4C1D95' },  // 云彩粉
  5: { primary: '#FBBF24', secondary: '#FDE68A', bg: '#1C1917' },  // 星空金
  6: { primary: '#A78BFA', secondary: '#DDD6FE', bg: '#1E1B4B' },  // 时光紫
  7: { primary: '#F43F5E', secondary: '#FDA4AF', bg: '#1C1917' },  // 核心红
};

// ============ 生成函数 ============

/**
 * 生成统一地图数据
 * 合并所有级别的节点，按顺序排列
 */
export const generateUnifiedMapData = (): UnifiedMapData => {
  const allNodes: UnifiedMapNode[] = [];
  const sections: LevelSection[] = [];
  let globalIndex = 0;

  // 遍历所有级别（1-7）
  for (let level = 1; level <= 7; level++) {
    const levelNum = level as LevelNumber;
    const levelData = levelDataMap[levelNum];
    const region = levelData.regionConfig;
    const nodes = levelData.getMapNodes();
    
    // 记录级别起始索引
    const startIndex = globalIndex;
    
    // 按 ID 排序确保顺序正确
    nodes.sort((a, b) => a.id.localeCompare(b.id));
    
    // 转换为统一节点
    nodes.forEach((node, levelIndex) => {
      const unifiedNode: UnifiedMapNode = {
        ...node,
        level: levelNum,
        globalIndex,
        levelIndex,
        theme: region.theme,
        isLevelStart: levelIndex === 0,
        isLevelEnd: levelIndex === nodes.length - 1,
        // 只有第一个级别的第一个节点默认解锁
        unlocked: level === 1 && levelIndex === 0 ? true : node.unlocked ?? false,
        completed: node.completed ?? false,
      };
      
      allNodes.push(unifiedNode);
      globalIndex++;
    });
    
    // 记录级别区段信息
    sections.push({
      level: levelNum,
      region,
      startIndex,
      endIndex: globalIndex - 1,
      nodeCount: nodes.length,
    });
  }
  
  return {
    nodes: allNodes,
    sections,
    totalNodes: allNodes.length,
  };
};

/**
 * 根据节点状态更新统一地图
 * 从数据库状态合并到统一数据
 */
export const mergeNodeStates = (
  unifiedNodes: UnifiedMapNode[],
  dbNodes: MapNode[]
): UnifiedMapNode[] => {
  const dbNodeMap = new Map(dbNodes.map(n => [n.id, n]));
  
  return unifiedNodes.map(node => {
    const dbNode = dbNodeMap.get(node.id);
    if (dbNode) {
      return {
        ...node,
        unlocked: dbNode.unlocked ?? node.unlocked,
        completed: dbNode.completed ?? node.completed,
      };
    }
    return node;
  });
};

/**
 * 检测 DB 节点 ID 是否与统一地图对齐。
 * 旧版 dataInit 使用 node_l1_001，统一地图使用 node_l1_01，重叠为 0。
 */
export const mapNodeIdsAligned = (
  unifiedNodes: UnifiedMapNode[],
  dbNodes: MapNode[]
): boolean => {
  if (dbNodes.length === 0) return false;
  const unifiedIds = new Set(unifiedNodes.map(n => n.id));
  const matched = dbNodes.filter(n => unifiedIds.has(n.id)).length;
  return matched >= Math.min(dbNodes.length, unifiedNodes.length) * 0.5;
};

/**
 * 按已完成节点重算解锁状态（前置全部完成则解锁）
 */
const recomputeUnlocked = (nodes: UnifiedMapNode[]): UnifiedMapNode[] => {
  const completedIds = new Set(nodes.filter(n => n.completed).map(n => n.id));

  return nodes.map(node => {
    const prereqs = node.prerequisites ?? [];
    const unlocked =
      Boolean(node.completed) ||
      prereqs.length === 0 ||
      prereqs.every(id => completedIds.has(id));

    return { ...node, unlocked };
  });
};

/**
 * 合并 DB 进度到统一地图；ID 不对齐时按 storyId 迁移，并重算解锁链。
 * needsSync=true 时调用方应将 dbPayload 写回 IndexedDB。
 */
export const reconcileMapNodeStates = (
  unifiedNodes: UnifiedMapNode[],
  dbNodes: MapNode[]
): {
  nodes: UnifiedMapNode[];
  needsSync: boolean;
  dbPayload: MapNode[];
} => {
  const needsSync = !mapNodeIdsAligned(unifiedNodes, dbNodes);
  const dbById = new Map(dbNodes.map(n => [n.id, n]));
  const completedByStoryId = new Set(
    dbNodes.filter(n => n.completed && n.storyId).map(n => n.storyId as string)
  );

  let merged: UnifiedMapNode[];

  if (!needsSync) {
    merged = mergeNodeStates(unifiedNodes, dbNodes);
  } else {
    merged = unifiedNodes.map(node => {
      const byId = dbById.get(node.id);
      const completed =
        byId?.completed ??
        (node.storyId ? completedByStoryId.has(node.storyId) : false) ??
        node.completed ??
        false;

      return {
        ...node,
        completed: Boolean(completed),
        unlocked: false,
      };
    });
  }

  const nodes = recomputeUnlocked(merged);

  const dbPayload: MapNode[] = nodes.map(node => ({
    id: node.id,
    regionId: node.regionId,
    type: node.type,
    storyId: node.storyId,
    position: node.position,
    prerequisites: node.prerequisites,
    rewards: node.rewards,
    unlocked: node.unlocked,
    completed: node.completed,
    title: node.title,
    titleCn: node.titleCn,
    emoji: node.emoji,
  }));

  return { nodes, needsSync: needsSync || dbNodes.length === 0, dbPayload };
};

/**
 * 找到当前活跃节点（第一个未完成的已解锁节点）
 */
export const findActiveNode = (nodes: UnifiedMapNode[]): UnifiedMapNode | null => {
  // 找第一个解锁但未完成的节点
  const activeNode = nodes.find(n => n.unlocked && !n.completed);
  if (activeNode) return activeNode;
  
  // 如果全部完成，返回最后一个已完成的
  const completedNodes = nodes.filter(n => n.completed);
  if (completedNodes.length > 0) {
    return completedNodes[completedNodes.length - 1] ?? null;
  }
  
  // 否则返回第一个节点
  return nodes[0] ?? null;
};

/**
 * 计算节点在列表中的位置（用于自动滚动）
 * 返回从底部开始的偏移量
 */
export const calculateNodePosition = (
  nodeIndex: number,
  sections: LevelSection[],
  totalNodes: number
): number => {
  // 地图从下往上，所以需要反转计算
  const reversedIndex = totalNodes - 1 - nodeIndex;
  
  // 计算经过的级别分隔数
  let dividerCount = 0;
  for (const section of sections) {
    if (section.startIndex <= nodeIndex) {
      dividerCount++;
    }
  }
  
  return reversedIndex * NODE_ITEM_HEIGHT + dividerCount * LEVEL_DIVIDER_HEIGHT;
};

/**
 * 获取节点的视觉配置
 */
export const getNodeVisualConfig = (node: UnifiedMapNode) => {
  const typeStyle = nodeTypeStyles[node.type] || nodeTypeStyles.story;
  const themeColor = levelThemeColors[node.level];
  
  return {
    ...typeStyle,
    themeColor,
    // 状态样式
    opacity: node.unlocked ? 1 : 0.4,
    grayscale: !node.unlocked,
    glow: node.unlocked && !node.completed,
    checkmark: node.completed,
  };
};

/**
 * 获取指定级别的节点
 */
export const getNodesByLevel = (nodes: UnifiedMapNode[], level: LevelNumber): UnifiedMapNode[] => {
  return nodes.filter(n => n.level === level);
};

/**
 * 计算级别完成进度
 */
export const getLevelProgress = (nodes: UnifiedMapNode[], level: LevelNumber) => {
  const levelNodes = getNodesByLevel(nodes, level);
  const completed = levelNodes.filter(n => n.completed).length;
  const total = levelNodes.length;
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

/**
 * 计算总体进度
 */
export const getTotalProgress = (nodes: UnifiedMapNode[]) => {
  const completed = nodes.filter(n => n.completed).length;
  const total = nodes.length;
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

export default {
  generateUnifiedMapData,
  mergeNodeStates,
  reconcileMapNodeStates,
  mapNodeIdsAligned,
  findActiveNode,
  calculateNodePosition,
  getNodeVisualConfig,
  getNodesByLevel,
  getLevelProgress,
  getTotalProgress,
  NODE_ITEM_HEIGHT,
  LEVEL_DIVIDER_HEIGHT,
  nodeTypeStyles,
  levelThemeColors,
};

