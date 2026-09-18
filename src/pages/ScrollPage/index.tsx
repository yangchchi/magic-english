/**
 * ScrollPage 卷轴页面
 * 守护者卷轴 - 进度展示、成就、同步、词汇库
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, type UserProgress, type User } from '@/db';
import { useAppStore } from '@/stores/useAppStore';
import { QRSync, AchievementCard, MagicCard } from '@/components/incentive';
import { BuddyAvatar } from '@/components/buddy';
import { getBuddyState, type BuddyState, checkEvolution } from '@/services/buddyService';
import { Button, Icon } from '@/components/common';
import { allDictionary, allRegions, type LevelNumber } from '@/data';
import styles from './ScrollPage.module.css';

// 示例成就数据
const achievements = [
  { id: '1', name: 'First Story', nameCn: '初次冒险', description: '完成第一个故事', icon: '📖', unlocked: true, unlockedAt: '2025-12-27', reward: 10 },
  { id: '2', name: 'Word Master', nameCn: '单词小达人', description: '学习 50 个单词', icon: '📚', unlocked: true, unlockedAt: '2025-12-27', reward: 20 },
  { id: '3', name: 'Streak 7', nameCn: '七日连胜', description: '连续学习 7 天', icon: '🔥', unlocked: false, reward: 50 },
  { id: '4', name: 'Boss Slayer', nameCn: 'Boss 征服者', description: '击败第一个 Boss', icon: '👑', unlocked: false, reward: 100 },
];

// 示例卡牌数据
const sampleCards = [
  { word: 'apple', meaningCn: '苹果', emoji: '🍎', rarity: 'green' as const, masteryLevel: 3 as const },
  { word: 'cat', meaningCn: '猫', emoji: '🐱', rarity: 'white' as const, masteryLevel: 2 as const },
  { word: 'magic', meaningCn: '魔法', emoji: '✨', rarity: 'gold' as const, masteryLevel: 1 as const },
  { word: 'dragon', meaningCn: '龙', emoji: '🐲', rarity: 'blue' as const, masteryLevel: 2 as const },
];

const LEVEL_META: Record<LevelNumber, { nameCn: string; emoji: string }> = {
  1: { nameCn: '萌芽之森', emoji: '🌱' },
  2: { nameCn: '回声山谷', emoji: '🏔️' },
  3: { nameCn: '闪耀之海', emoji: '🌊' },
  4: { nameCn: '云端之城', emoji: '☁️' },
  5: { nameCn: '永恒星空', emoji: '⭐' },
  6: { nameCn: '时光回廊', emoji: '⚙️' },
  7: { nameCn: '创世之核', emoji: '💎' },
};

type TabType = 'overview' | 'vocabulary' | 'cards' | 'achievements' | 'sync';
type LevelFilter = 'all' | LevelNumber;

const ScrollPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserId } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [buddyState, setBuddyState] = useState<BuddyState | null>(null);
  const [evolutionInfo, setEvolutionInfo] = useState<{ canEvolve: boolean; progress: number }>({ canEvolve: false, progress: 0 });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const wordsByLevel = useMemo(() => {
    const groups = new Map<LevelNumber, typeof allDictionary>();
    for (let level = 1; level <= 7; level++) {
      groups.set(level as LevelNumber, []);
    }
    for (const entry of allDictionary) {
      const level = entry.level as LevelNumber;
      const list = groups.get(level);
      if (list) {
        list.push(entry);
      }
    }
    return groups;
  }, []);

  const vocabularySections = useMemo(() => {
    const levels: LevelNumber[] =
      levelFilter === 'all'
        ? ([1, 2, 3, 4, 5, 6, 7] as LevelNumber[])
        : [levelFilter];

    return levels
      .map((level) => ({
        level,
        ...LEVEL_META[level],
        words: wordsByLevel.get(level) ?? [],
      }))
      .filter((section) => section.words.length > 0);
  }, [levelFilter, wordsByLevel]);

  // 区域名称兜底（若 map 数据有更新）
  const regionNameByLevel = useMemo(() => {
    const map = new Map<number, string>();
    allRegions.forEach((region) => {
      map.set(region.level, region.nameCn);
    });
    return map;
  }, []);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // 如果没有currentUserId，尝试从数据库获取最近的用户
      let userId = currentUserId;
      if (!userId) {
        const lastUser = await db.users.orderBy('createdAt').reverse().first();
        if (lastUser) {
          userId = lastUser.id;
          setUser(lastUser);
        }
      } else {
        const currentUser = await db.users.get(userId);
        setUser(currentUser || null);
      }

      if (!userId) {
        setIsLoading(false);
        return;
      }

      const userProgress = await db.userProgress.get(userId);
      setProgress(userProgress || null);

      const buddy = await getBuddyState(userId);
      setBuddyState(buddy);

      const evoInfo = await checkEvolution(userId);
      setEvolutionInfo({ canEvolve: evoInfo.canEvolve, progress: evoInfo.progress });
      
      setIsLoading(false);
    };

    loadData();
  }, [currentUserId]);

  // 标签页
  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: '总览', icon: '📊' },
    { id: 'vocabulary', label: '词汇库', icon: '📚' },
    { id: 'cards', label: '卡牌', icon: '🃏' },
    { id: 'achievements', label: '成就', icon: '🏆' },
    { id: 'sync', label: '同步', icon: '📱' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className={styles.overviewSection}>
            {/* Buddy 卡片 */}
            <motion.div
              className={styles.buddyCard}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {isLoading ? (
                <div className={styles.loadingBuddy}>
                  <span className={styles.loadingEmoji}>🥚</span>
                  <p>加载中...</p>
                </div>
              ) : buddyState ? (
                <>
                  <BuddyAvatar
                    stage={buddyState.stage}
                    mood={buddyState.mood}
                    size="xl"
                    showBubble
                    context="complete"
                  />
                  <div className={styles.buddyInfo}>
                    <h3>{user?.buddyName || '小伙伴'}</h3>
                    <div className={styles.evolutionBar}>
                      <div className={styles.evolutionLabel}>进化进度</div>
                      <div className={styles.evolutionTrack}>
                        <motion.div
                          className={styles.evolutionFill}
                          initial={{ width: 0 }}
                          animate={{ width: `${evolutionInfo.progress}%` }}
                        />
                      </div>
                      <span className={styles.evolutionPercent}>{evolutionInfo.progress}%</span>
                    </div>
                    {evolutionInfo.canEvolve && (
                      <Button variant="primary" size="sm">
                        🌟 可以进化！
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.emptyBuddy}>
                  <BuddyAvatar stage={1} mood="neutral" size="xl" />
                  <div className={styles.buddyInfo}>
                    <h3>小伙伴</h3>
                    <p className={styles.emptyText}>开始冒险来唤醒你的伙伴吧！</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* 统计数据 */}
            <div className={styles.statsGrid}>
              <motion.div
                className={styles.statCard}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className={styles.statIcon}>⭐</span>
                <span className={styles.statValue}>L{progress?.level || 1}</span>
                <span className={styles.statLabel}>等级</span>
              </motion.div>

              <motion.div
                className={styles.statCard}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className={styles.statIcon}>✨</span>
                <span className={styles.statValue}>{progress?.magicPower || 0}</span>
                <span className={styles.statLabel}>魔力值</span>
              </motion.div>

              <motion.div
                className={styles.statCard}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className={styles.statIcon}>📖</span>
                <span className={styles.statValue}>{progress?.totalStoriesRead || 0}</span>
                <span className={styles.statLabel}>故事</span>
              </motion.div>

              <motion.div
                className={styles.statCard}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className={styles.statIcon}>🔥</span>
                <span className={styles.statValue}>{progress?.streakDays || 0}</span>
                <span className={styles.statLabel}>连续天</span>
              </motion.div>
            </div>
          </div>
        );

      case 'vocabulary':
        return (
          <div className={styles.vocabularySection}>
            <h3 className={styles.sectionTitle}>📚 词汇库</h3>
            <p className={styles.sectionDesc}>
              共 {allDictionary.length} 个单词 · L1 ~ L7 分级词库
            </p>

            <div className={styles.levelFilters} role="tablist" aria-label="按级别筛选">
              <button
                type="button"
                className={`${styles.levelChip} ${levelFilter === 'all' ? styles.levelChipActive : ''}`}
                onClick={() => setLevelFilter('all')}
              >
                全部
              </button>
              {([1, 2, 3, 4, 5, 6, 7] as LevelNumber[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.levelChip} ${levelFilter === level ? styles.levelChipActive : ''}`}
                  onClick={() => setLevelFilter(level)}
                >
                  L{level}
                </button>
              ))}
            </div>

            <div className={styles.vocabularyGroups}>
              {vocabularySections.map((section) => (
                <section key={section.level} className={styles.vocabularyGroup}>
                  <div className={styles.vocabularyGroupHeader}>
                    <h4>
                      {section.emoji} L{section.level}{' '}
                      {regionNameByLevel.get(section.level) || section.nameCn}
                    </h4>
                    <span className={styles.wordCount}>{section.words.length} 词</span>
                  </div>
                  <ul className={styles.wordList}>
                    {section.words.map((entry) => (
                      <li key={`${entry.level}-${entry.word}`} className={styles.wordItem}>
                        <span className={styles.wordEmoji} aria-hidden>
                          {entry.emoji || '📝'}
                        </span>
                        <div className={styles.wordMain}>
                          <div className={styles.wordRow}>
                            <span className={styles.wordText}>{entry.word}</span>
                            <span className={styles.wordPos}>{entry.partOfSpeech}</span>
                          </div>
                          <div className={styles.wordMeta}>
                            <span className={styles.wordPhonetic}>{entry.phonetic}</span>
                            <span className={styles.wordMeaning}>{entry.meaningCn}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className={styles.cardsSection}>
            <h3 className={styles.sectionTitle}>🃏 魔法卡牌</h3>
            <p className={styles.sectionDesc}>学习单词，收集卡牌</p>
            <div className={styles.cardsGrid}>
              {sampleCards.map((card, index) => (
                <motion.div
                  key={card.word}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MagicCard {...card} />
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className={styles.achievementsSection}>
            <h3 className={styles.sectionTitle}>🏆 成就墙</h3>
            <div className={styles.achievementsList}>
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AchievementCard
                    name={achievement.name}
                    nameCn={achievement.nameCn}
                    description={achievement.description}
                    icon={achievement.icon}
                    unlocked={achievement.unlocked}
                    unlockedAt={achievement.unlockedAt}
                    rewardMagicPower={achievement.reward}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'sync':
        return (
          <div className={styles.syncSection}>
            {user ? (
              <QRSync userId={user.id} userName={user.name} />
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📱</span>
                <p>请先完成引导流程</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/map')} aria-label="返回">
          <Icon name="chevron-left" size={20} strokeWidth={2.25} className={styles.backIcon} />
          <span>返回</span>
        </button>
        <h1 className={styles.title}>📜 守护者卷轴</h1>
        <div className={styles.placeholder} />
      </header>

      {/* 标签页 */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <main className={styles.content}>
        {renderContent()}
      </main>
    </div>
  );
};

export default ScrollPage;
