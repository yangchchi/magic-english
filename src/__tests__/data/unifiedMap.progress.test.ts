/**
 * 地图进度合并 / L1 节点 ID 一致性
 * 回归：闯关成功后进度永远停在第一关
 */

import { describe, it, expect } from 'vitest';
import {
  generateUnifiedMapData,
  mergeNodeStates,
  reconcileMapNodeStates,
  getLevelProgress,
  findActiveNode,
} from '@/data/unifiedMap';
import { generateL1MapNodes } from '@/data/maps/l1-forest';
import type { MapNode } from '@/db';

/** 模拟旧版 dataInitService 生成的 L1 节点（node_l1_001 风格） */
const buildLegacyL1DbNodes = (completedStoryIds: string[]): MapNode[] => {
  const storyIds = [
    'l1_001', 'l1_002', 'l1_003', 'l1_004', 'l1_005',
    'l1_006', 'l1_007', 'l1_008', 'l1_009', 'l1_010',
    'l1_b01', 'l1_b02', 'l1_b03', 'l1_b04', 'l1_b05',
    'l1_c01', 'l1_c02', 'l1_c03', 'l1_c04', 'l1_boss',
  ];

  return storyIds.map((storyId, index) => {
    const completed = completedStoryIds.includes(storyId);
    const prevCompleted =
      index === 0 || completedStoryIds.includes(storyIds[index - 1]!);
    return {
      id: `node_${storyId}`,
      regionId: 'region_l1',
      type: index === storyIds.length - 1 ? 'boss' : 'story',
      storyId,
      position: { x: 0, y: index * 100 },
      prerequisites: index === 0 ? [] : [`node_${storyIds[index - 1]}`],
      rewards: { magicPower: 15 },
      unlocked: index === 0 || prevCompleted,
      completed,
    } as MapNode;
  });
};

describe('L1 地图节点 ID 一致性', () => {
  it('统一地图与 generateL1MapNodes 使用相同 ID（node_l1_01 风格）', () => {
    const unified = generateUnifiedMapData().nodes.filter(n => n.level === 1);
    const generated = generateL1MapNodes();

    expect(unified.map(n => n.id)).toEqual(generated.map(n => n.id));
    expect(unified[0]?.id).toBe('node_l1_01');
    expect(unified.some(n => n.id === 'node_l1_001')).toBe(false);
  });
});

describe('reconcileMapNodeStates', () => {
  it('旧版 DB ID（node_l1_001）完成闯关后，进度应合并到统一地图并解锁下一关', () => {
    const mapData = generateUnifiedMapData();
    const legacyDb = buildLegacyL1DbNodes(['l1_001']);

    // 旧 merge 按 ID 匹配 → 重叠为 0，进度丢失（bug 复现）
    const broken = mergeNodeStates(mapData.nodes, legacyDb);
    const brokenProgress = getLevelProgress(broken, 1);
    expect(brokenProgress.completed).toBe(0);

    // 修复后应按 storyId 迁移进度
    const { nodes, needsSync } = reconcileMapNodeStates(mapData.nodes, legacyDb);
    expect(needsSync).toBe(true);

    const progress = getLevelProgress(nodes, 1);
    expect(progress.completed).toBeGreaterThan(0);
    expect(progress.percentage).toBeGreaterThan(0);

    const first = nodes.find(n => n.storyId === 'l1_001');
    const second = nodes.find(n => n.storyId === 'l1_002');
    expect(first?.completed).toBe(true);
    expect(second?.unlocked).toBe(true);

    const active = findActiveNode(nodes);
    expect(active?.storyId).toBe('l1_002');
  });

  it('ID 已对齐时仍能正确合并 completed/unlocked', () => {
    const mapData = generateUnifiedMapData();
    const l1 = mapData.nodes.filter(n => n.level === 1);
    const dbNodes: MapNode[] = l1.map((n, i) => ({
      id: n.id,
      regionId: n.regionId,
      type: n.type,
      storyId: n.storyId,
      position: n.position,
      prerequisites: n.prerequisites,
      rewards: n.rewards,
      unlocked: i <= 1,
      completed: i === 0,
      title: n.title,
      titleCn: n.titleCn,
      emoji: n.emoji,
    }));

    const { nodes, needsSync } = reconcileMapNodeStates(mapData.nodes, dbNodes);
    expect(needsSync).toBe(false);
    expect(getLevelProgress(nodes, 1).completed).toBe(1);
    expect(nodes.find(n => n.id === l1[0]!.id)?.completed).toBe(true);
    expect(nodes.find(n => n.id === l1[1]!.id)?.unlocked).toBe(true);
  });
});
