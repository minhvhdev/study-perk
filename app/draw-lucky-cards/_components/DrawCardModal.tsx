'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RewardHistoryItem } from '../../reward-spin/_types/reward-spin.type';
import {
  X,
  Sparkles,
  Heart,
  Diamond,
  Club,
  Spade as SpadeIcon,
  Pointer,
  Ghost,
  Loader2,
} from 'lucide-react';
import { cn } from '@/app/_utils/app-cn.util';
import {
  getUserJsonState,
  setUserJsonState,
} from '@/app/_utils/app-remote-storage.util';
import { useRewardSpinStore } from '../../reward-spin/_store';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'special';
type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | 'Joker';

type CardItem = {
  id: string;
  suit: Suit;
  rank: Rank;
  score: number;
  isJoker?: boolean;
  jokerType?: 'black' | 'red';
};

type DrawCardState = {
  deck: CardItem[];
  phase: 'shuffling' | 'picking';
  pickedCardIds: string[];
  flippedCardIds: string[];
  isGameOver: boolean;
};

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

const getCardScore = (rank: Rank): number => {
  if (rank === 'A') return 1;
  if (['J', 'Q', 'K', '10'].includes(rank)) return 10;
  if (rank === 'Joker') return 0;
  return parseInt(rank);
};

const generateDeck = () => {
  const newDeck: CardItem[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      newDeck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        score: getCardScore(rank),
      });
    });
  });

  newDeck.push({
    id: 'joker-black',
    suit: 'special',
    rank: 'Joker',
    score: 0,
    isJoker: true,
    jokerType: 'black',
  });
  newDeck.push({
    id: 'joker-red',
    suit: 'special',
    rank: 'Joker',
    score: 0,
    isJoker: true,
    jokerType: 'red',
  });

  return newDeck.sort(() => Math.random() - 0.5);
};

const getCurrentTimestamp = () => Date.now();

const SUIT_ICONS = {
  hearts: { icon: Heart, color: 'text-red-500', fill: 'fill-red-500' },
  diamonds: { icon: Diamond, color: 'text-red-500', fill: 'fill-red-500' },
  clubs: {
    icon: Club,
    color: 'text-slate-800 dark:text-slate-200',
    fill: 'fill-slate-800 dark:fill-slate-200',
  },
  spades: {
    icon: SpadeIcon,
    color: 'text-slate-800 dark:text-slate-200',
    fill: 'fill-slate-800 dark:fill-slate-200',
  },
  special: { icon: Ghost, color: 'text-purple-500', fill: 'fill-purple-500' },
};

export const DrawCardModal = ({
  item,
  onClose,
}: {
  item: RewardHistoryItem;
  onClose: () => void;
}) => {
  const { updateHistoryItem } = useRewardSpinStore();
  const [phase, setPhase] = useState<'shuffling' | 'picking'>('shuffling');
  const [pickedCardIds, setPickedCardIds] = useState<string[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [deck, setDeck] = useState<CardItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await getUserJsonState<DrawCardState>(
          `draw-card-state-${item.id}`,
        );
        if (savedState) {
          setDeck(savedState.deck);
          setPickedCardIds(savedState.pickedCardIds);
          setFlippedCardIds(savedState.flippedCardIds);
          setIsGameOver(savedState.isGameOver);
          // Only start timer if it was shuffling and no cards picked
          if (
            savedState.phase === 'shuffling' &&
            savedState.pickedCardIds.length === 0
          ) {
            setPhase('shuffling');
          } else {
            setPhase(savedState.phase || 'picking');
          }
        } else {
          setDeck(generateDeck());
        }
      } catch (error) {
        console.error('Failed to load state from IndexedDB:', error);
        setDeck(generateDeck());
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, [item.id]);

  useEffect(() => {
    if (!isLoaded || phase !== 'shuffling' || pickedCardIds.length > 0) return;

    const timer = setTimeout(() => {
      setPhase('picking');
    }, 2500);
    return () => clearTimeout(timer);
  }, [isLoaded, phase, pickedCardIds.length]);

  useEffect(() => {
    if (!isLoaded) return;
    void setUserJsonState(`draw-card-state-${item.id}`, {
      deck,
      phase,
      pickedCardIds,
      flippedCardIds,
      isGameOver,
    });
  }, [
    isLoaded,
    deck,
    phase,
    pickedCardIds,
    flippedCardIds,
    isGameOver,
    item.id,
  ]);

  const scoreData = useMemo(() => {
    const hand = pickedCardIds
      .map((id) => deck.find((c) => c.id === id))
      .filter(Boolean) as CardItem[];

    const hasRedJoker = hand.some((c) => c.id === 'joker-red');
    const hasBlackJoker = hand.some((c) => c.id === 'joker-black');

    if (hasRedJoker)
      return {
        score: 10,
        multiplier: 10,
        totalScore: 0,
        isInstant: true,
        type: 'RED JOKER',
      };
    if (hasBlackJoker)
      return {
        score: 0,
        multiplier: 0,
        totalScore: 0,
        isInstant: true,
        type: 'BLACK JOKER',
      };

    const totalScore = hand.reduce((sum, c) => sum + c.score, 0);
    const score = totalScore % 10;
    const multiplier = totalScore === 9 ? 10 : score;
    return { score, multiplier, totalScore, isInstant: false };
  }, [pickedCardIds, deck]);

  const finishGame = (finalHandIds?: string[]) => {
    setIsGameOver(true);
    const hand = finalHandIds || pickedCardIds;
    // When game is over, we'll reveal everything in the render logic via isGameOver
    setFlippedCardIds((prev) => Array.from(new Set([...prev, ...hand])));

    // Update the store with the result
    updateHistoryItem(item.id, {
      multiplier: scoreData.multiplier,
      finishedAt: getCurrentTimestamp(),
    });
  };

  const handleCardClick = (id: string) => {
    if (phase !== 'picking' || isGameOver) return;

    const currentCard = deck.find((c) => c.id === id)!;
    const isDeckCard = !pickedCardIds.includes(id);

    // Initial Pick (up to 2 cards)
    if (pickedCardIds.length < 2) {
      if (isDeckCard) {
        const newPicks = [...pickedCardIds, id];
        setPickedCardIds(newPicks);
        if (currentCard.isJoker) {
          finishGame(newPicks);
        }
      }
      return;
    }

    // Step 2: Already picked 2 cards
    if (pickedCardIds.length === 2 && flippedCardIds.length === 0) {
      if (!isDeckCard) {
        // Option A: Reveal 1 picked card
        setFlippedCardIds([id]);
        if (currentCard.isJoker) finishGame();
      } else {
        // Option B: Pick 1 more from deck
        const newPicks = [...pickedCardIds, id];
        setPickedCardIds(newPicks);
        finishGame(newPicks);
      }
      return;
    }

    // Step 3: Already picked 2 and revealed 1
    if (pickedCardIds.length === 2 && flippedCardIds.length === 1) {
      if (!isDeckCard) {
        // Reveal all remaining picked
        finishGame();
      } else {
        // Pick 1 more from deck
        const newPicks = [...pickedCardIds, id];
        setPickedCardIds(newPicks);
        finishGame(newPicks);
      }
    }
  };

  const getMessage = () => {
    if (isGameOver) return 'REWARD CALCULATED';
    if (pickedCardIds.length < 2) return 'PICK 2 CARDS';
    if (pickedCardIds.length === 2 && flippedCardIds.length === 0)
      return 'REVEAL 1 OR DRAW MORE';
    if (pickedCardIds.length === 2 && flippedCardIds.length === 1)
      return 'REVEAL ALL OR DRAW MORE';
    return '';
  };

  const getCardPosition = (id: string, index: number) => {
    if (phase === 'shuffling') {
      const seed = parseInt(id.charCodeAt(0).toString()) + index;
      return {
        x: Math.sin(seed) * 20,
        y: Math.cos(seed) * 20,
        rotate: Math.sin(seed) * 30,
        scale: 1,
      };
    }

    const isPicked = pickedCardIds.includes(id);
    if (isPicked) {
      const pickedIndex = pickedCardIds.indexOf(id);
      return {
        x: (pickedIndex - (pickedCardIds.length - 1) / 2) * 160,
        y: 280,
        rotate: 0,
        scale: 1.1,
        zIndex: 1000 + pickedIndex,
      };
    }

    // Fan-out for deck cards
    const availableCards = deck.filter((c) => !pickedCardIds.includes(c.id));
    const cardIndexInAvailable = availableCards.findIndex((c) => c.id === id);
    if (cardIndexInAvailable === -1) return { x: 0, y: 0, rotate: 0, scale: 0 };

    const total = availableCards.length;
    const fanWidth = 140;
    const startAngle = -fanWidth / 2;
    const angleStep = total > 1 ? fanWidth / (total - 1) : 0;
    const angle = startAngle + cardIndexInAvailable * angleStep;

    const rad = (angle * Math.PI) / 180;
    const radius = 650;

    return {
      x: Math.sin(rad) * radius,
      y: -Math.cos(rad) * radius + 400,
      rotate: angle,
      scale: 0.85,
      zIndex: 10 + cardIndexInAvailable,
    };
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl"
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-6 select-none">
        {/* Shuffling Background Overlay */}
        <AnimatePresence>
          {phase === 'shuffling' && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-100 bg-slate-950/80 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="relative w-48 h-64 mb-12">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: [0, (i - 2.5) * 80, 0],
                      y: [0, i % 2 ? -40 : 40, 0],
                      rotate: [0, (i - 2.5) * 25, 0],
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.08,
                    }}
                    className="absolute inset-0 bg-primary border-[6px] border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-linear-to-br from-primary to-primary/80"
                  />
                ))}
              </div>
              <motion.span
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-5xl font-black text-white italic tracking-[0.5em] uppercase"
              >
                Dealing...
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Prompt Message */}
        {phase === 'picking' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[10%] z-50 flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-4 px-10 py-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl">
              {isGameOver ? (
                <Sparkles className="text-primary" />
              ) : (
                <Pointer className="text-primary animate-pulse" />
              )}
              <span className="text-2xl font-black text-white tracking-[0.2em] uppercase">
                {getMessage()}
              </span>
            </div>
            {!isGameOver && pickedCardIds.length >= 2 && (
              <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em] mt-3 animate-pulse">
                Reveal picked card or draw new from deck
              </p>
            )}
          </motion.div>
        )}

        {/* Header Branding */}
        <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-40">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30">
              <SpadeIcon size={32} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-5xl font-black text-white tracking-tighter leading-none">
                THE HIGH TABLE
              </h2>
              <p className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mt-1.5 opacity-60">
                Dealer&apos;s Choice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-16 h-16 rounded-4xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center"
          >
            <X size={28} />
          </button>
        </div>

        {/* Card Field Area */}
        <div className="relative w-full h-full flex items-center justify-center max-w-7xl">
          {deck.map((card, index) => {
            const pos = getCardPosition(card.id, index);
            const isPicked = pickedCardIds.includes(card.id);
            // REVEAL ALL cards if isGameOver is true
            const isFlipped = flippedCardIds.includes(card.id) || isGameOver;

            const suitConfig =
              card.isJoker && card.jokerType === 'black'
                ? {
                    color: 'text-slate-900',
                    icon: Ghost,
                    fill: 'fill-slate-900',
                  }
                : card.isJoker && card.jokerType === 'red'
                  ? { color: 'text-red-500', icon: Ghost, fill: 'fill-red-500' }
                  : SUIT_ICONS[card.suit];
            const SuitIcon = suitConfig.icon;

            return (
              <motion.div
                key={card.id}
                initial={false}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  rotate: pos.rotate,
                  scale: pos.scale,
                  zIndex: pos.zIndex,
                  opacity: phase === 'shuffling' && index > 8 ? 0 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 40,
                  delay: phase === 'shuffling' ? 0 : (index / 54) * 0.08,
                }}
                whileHover={
                  !isPicked && phase === 'picking' && !isGameOver
                    ? {
                        y: pos.y - 80,
                        scale: 0.95,
                        zIndex: 2000,
                      }
                    : isPicked && !isFlipped && phase === 'picking'
                      ? {
                          y: pos.y - 30,
                          scale: 1.15,
                          zIndex: 3000,
                        }
                      : {}
                }
                className="absolute w-40 h-56 cursor-pointer perspective-1000"
                onClick={() => handleCardClick(card.id)}
              >
                <div
                  className={cn(
                    'relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-[1.25rem]',
                    isFlipped && 'rotate-y-180',
                  )}
                >
                  {/* Card Front (Back Art) */}
                  <div className="absolute inset-0 backface-hidden bg-primary border-10 border-white/5 outline outline-white/10 rounded-[1.25rem] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
                    <div className="relative z-10 grid grid-cols-4 gap-3 opacity-10">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SpadeIcon key={i} size={20} fill="white" />
                      ))}
                    </div>
                  </div>

                  {/* Card Back (Suit & Rank) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-slate-200 rounded-[1.25rem] shadow-inner flex flex-col p-4">
                    <div
                      className={cn(
                        'flex flex-col items-center absolute top-3 left-3',
                        suitConfig.color,
                      )}
                    >
                      <span className="text-2xl font-black leading-none">
                        {card.rank === 'Joker' ? '★' : card.rank}
                      </span>
                      <SuitIcon size={18} fill="currentColor" />
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center">
                      <SuitIcon
                        size={64}
                        className={cn(
                          suitConfig.color,
                          suitConfig.fill,
                          'opacity-10 dark:opacity-100',
                        )}
                        fill="currentColor"
                      />
                      <div className="absolute flex flex-col items-center">
                        <span
                          className={cn(
                            'text-4xl font-black',
                            suitConfig.color,
                          )}
                        >
                          {card.rank === 'Joker' ? 'JOKER' : card.rank}
                        </span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'flex flex-col items-center absolute bottom-3 right-3 rotate-180',
                        suitConfig.color,
                      )}
                    >
                      <span className="text-2xl font-black leading-none">
                        {card.rank === 'Joker' ? '★' : card.rank}
                      </span>
                      <SuitIcon size={18} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Results Banner Overlay */}
        <AnimatePresence>
          {(pickedCardIds.length >= 2 || isGameOver) && (
            <motion.div
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-10 w-full max-w-6xl px-6 pointer-events-none"
            >
              <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[3.5rem] shadow-2xl flex items-center justify-between gap-12 overflow-hidden pointer-events-auto">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
                    Active Hand
                  </span>
                  <div className="flex items-center gap-3">
                    {pickedCardIds.map((id) => {
                      const card = deck.find((c) => c.id === id)!;
                      const isFlipped =
                        flippedCardIds.includes(id) || isGameOver;
                      return (
                        <div
                          key={id}
                          className={cn(
                            'px-5 py-3 rounded-2xl border transition-all duration-300 min-w-[80px] text-center',
                            isFlipped
                              ? 'bg-white text-slate-900 border-white shadow-xl'
                              : 'bg-white/5 text-white/20 border-white/10 border-dashed',
                          )}
                        >
                          <span className="text-2xl font-black uppercase tracking-tighter">
                            {isFlipped
                              ? card.rank === 'Joker'
                                ? 'JK'
                                : card.rank
                              : '?'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col border-l border-white/10 pl-12 gap-1.5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
                    Score Card
                  </span>
                  <div className="flex items-center gap-6">
                    {scoreData.isInstant ? (
                      <span className="text-3xl font-black text-primary animate-pulse tracking-widest">
                        {scoreData.type}!
                      </span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-black text-white/40 uppercase">
                            SUM:
                          </span>
                          <span className="text-3xl font-black text-white italic tabular-nums">
                            {isGameOver ? scoreData.totalScore : '??'}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-black text-white/40 uppercase tracking-tighter">
                            REMAINDER:
                          </span>
                          <span className="text-5xl font-black text-primary drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]tabular-nums">
                            {isGameOver ? scoreData.score : '??'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-1.5">
                      BONUS Multiplier
                    </span>
                    <div className="flex items-center gap-5">
                      <span className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                        {isGameOver ? `${scoreData.multiplier}x` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </motion.div>
  );
};
