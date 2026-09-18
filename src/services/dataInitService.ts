/**
 * 数据初始化服务
 * 首次启动时导入故事和词典数据
 */

import { db, type Story, type DictionaryEntry } from '@/db';
import { l1Stories } from '@/data/stories/l1';
import { l2Stories } from '@/data/stories/l2';
import { l1Dictionary } from '@/data/dictionary/l1-words';
import { l1RegionConfig, generateL1MapNodes } from '@/data/maps/l1-forest';
import { l2ValleyMapRegion, l2ValleyMapNodes } from '@/data/maps/l2-valley';

// 初始化状态标识
const INIT_KEY = 'magic_english_data_initialized';
const INIT_VERSION = '2.1.0'; // 2.1.0: L1 节点 ID 与统一地图对齐 (node_l1_01)

/**
 * 检查是否需要初始化
 */
export const needsInitialization = (): boolean => {
  const stored = localStorage.getItem(INIT_KEY);
  if (!stored) return true;
  
  try {
    const data = JSON.parse(stored);
    return data.version !== INIT_VERSION;
  } catch {
    return true;
  }
};

/**
 * 标记初始化完成
 */
const markInitialized = (): void => {
  localStorage.setItem(
    INIT_KEY,
    JSON.stringify({
      version: INIT_VERSION,
      timestamp: Date.now(),
    })
  );
};

/**
 * 初始化故事数据
 */
export const initStories = async (): Promise<number> => {
  const existingCount = await db.stories.count();
  if (existingCount > 0) {
    return existingCount;
  }

  // 添加 L1 和 L2 故事
  const allStories = [...l1Stories, ...l2Stories] as Story[];
  await db.stories.bulkAdd(allStories);
  return allStories.length;
};

/**
 * 初始化词典数据
 */
export const initDictionary = async (): Promise<number> => {
  const existingCount = await db.dictionary.count();
  if (existingCount > 0) {
    return existingCount;
  }

  await db.dictionary.bulkAdd(l1Dictionary as DictionaryEntry[]);
  return l1Dictionary.length;
};

/**
 * 初始化地图数据
 * L1 必须使用 generateL1MapNodes（node_l1_01），与地图 UI 的统一 ID 对齐
 */
export const initMapData = async (): Promise<void> => {
  const existingRegions = await db.mapRegions.count();
  if (existingRegions > 0) {
    return;
  }

  // 添加 L1 区域和节点（与 unifiedMap 同源）
  const l1Nodes = generateL1MapNodes();
  await db.mapRegions.add({
    ...l1RegionConfig,
    nodes: l1Nodes.map(n => n.id),
  });
  await db.mapNodes.bulkAdd(l1Nodes);

  // 添加 L2 区域和节点
  await db.mapRegions.add(l2ValleyMapRegion);
  await db.mapNodes.bulkAdd(l2ValleyMapNodes);
};

/**
 * 执行完整的数据初始化
 */
export const initializeAppData = async (
  onProgress?: (message: string, progress: number) => void
): Promise<{
  stories: number;
  words: number;
  success: boolean;
}> => {
  try {
    onProgress?.('正在检查数据...', 0);
    
    // 初始化故事
    onProgress?.('正在加载故事数据...', 20);
    const storiesCount = await initStories();
    
    // 初始化词典
    onProgress?.('正在加载词典数据...', 50);
    const wordsCount = await initDictionary();
    
    // 初始化地图
    onProgress?.('正在生成魔法地图...', 80);
    await initMapData();
    
    // 标记完成
    markInitialized();
    onProgress?.('初始化完成！', 100);
    
    return {
      stories: storiesCount,
      words: wordsCount,
      success: true,
    };
  } catch (error) {
    console.error('Data initialization failed:', error);
    return {
      stories: 0,
      words: 0,
      success: false,
    };
  }
};

/**
 * 重置所有数据（用于测试）
 */
export const resetAllData = async (): Promise<void> => {
  await db.delete();
  localStorage.removeItem(INIT_KEY);
  window.location.reload();
};

/**
 * 获取数据统计
 */
export const getDataStats = async (): Promise<{
  stories: number;
  words: number;
  regions: number;
  nodes: number;
}> => {
  const [stories, words, regions, nodes] = await Promise.all([
    db.stories.count(),
    db.dictionary.count(),
    db.mapRegions.count(),
    db.mapNodes.count(),
  ]);
  
  return { stories, words, regions, nodes };
};

export default {
  needsInitialization,
  initializeAppData,
  initStories,
  initDictionary,
  initMapData,
  resetAllData,
  getDataStats,
};

