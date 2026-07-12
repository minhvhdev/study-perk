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
  HelpCircle,
  Star,
} from 'lucide-react';
import { DrawCardModalSkeleton } from '@/app/_components/skeletons/DrawCardModalSkeleton';
import { cn } from '@/app/_utils/app-cn.util';
import {
  getUserJsonState,
  setUserJsonState,
} from '@/app/_utils/app-remote-storage.util';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
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
  hopeStarEnabled?: boolean;
};

type ScoreResult = {
  score: number;
  multiplier: number;
  totalScore: number;
  isInstant: boolean;
  instantType?: 'redJoker' | 'blackJoker';
  hopeStarApplied: boolean;
};

const calculateScoreData = (
  hand: CardItem[],
  hopeStarEnabled: boolean,
): ScoreResult => {
  const hasRedJoker = hand.some((c) => c.id === 'joker-red');
  const hasBlackJoker = hand.some((c) => c.id === 'joker-black');

  if (hasRedJoker) {
    return {
      score: 10,
      multiplier: 10,
      totalScore: 0,
      isInstant: true,
      instantType: 'redJoker',
      hopeStarApplied: false,
    };
  }

  if (hasBlackJoker) {
    return {
      score: 0,
      multiplier: 0,
      totalScore: 0,
      isInstant: true,
      instantType: 'blackJoker',
      hopeStarApplied: false,
    };
  }

  const totalScore = hand.reduce((sum, card) => sum + card.score, 0);
  const score = totalScore % 10;
  let multiplier = totalScore === 9 ? 10 : score;

  if (hopeStarEnabled) {
    multiplier = multiplier <= 5 ? 0 : multiplier * 2;
    return {
      score,
      multiplier,
      totalScore,
      isInstant: false,
      hopeStarApplied: true,
    };
  }

  return {
    score,
    multiplier,
    totalScore,
    isInstant: false,
    hopeStarApplied: false,
  };
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
    color: 'text-slate-900',
    fill: 'fill-slate-900',
  },
  spades: {
    icon: SpadeIcon,
    color: 'text-slate-900',
    fill: 'fill-slate-900',
  },
  special: { icon: Ghost, color: 'text-primary', fill: 'fill-primary' },
};

export const DrawCardModal = ({
  item,
  onClose,
}: {
  item: RewardHistoryItem;
  onClose: () => void;
}) => {
  const { updateHistoryItem } = useRewardSpinStore();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].drawCardModal;
  const [phase, setPhase] = useState<'shuffling' | 'picking'>('shuffling');
  const [pickedCardIds, setPickedCardIds] = useState<string[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [deck, setDeck] = useState<CardItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [hopeStarEnabled, setHopeStarEnabled] = useState(false);
  const canToggleHopeStar = !isGameOver && pickedCardIds.length === 0;

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
          setHopeStarEnabled(savedState.hopeStarEnabled ?? false);
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
      hopeStarEnabled,
    });
  }, [
    isLoaded,
    deck,
    phase,
    pickedCardIds,
    flippedCardIds,
    isGameOver,
    hopeStarEnabled,
    item.id,
  ]);

  const scoreData = useMemo(() => {
    const hand = pickedCardIds
      .map((id) => deck.find((c) => c.id === id))
      .filter(Boolean) as CardItem[];

    return calculateScoreData(hand, hopeStarEnabled);
  }, [pickedCardIds, deck, hopeStarEnabled]);

  const finishGame = (finalHandIds?: string[]) => {
    const handIds = finalHandIds || pickedCardIds;
    const hand = handIds
      .map((id) => deck.find((c) => c.id === id))
      .filter(Boolean) as CardItem[];
    const finalScore = calculateScoreData(hand, hopeStarEnabled);

    setIsGameOver(true);
    setFlippedCardIds((prev) => Array.from(new Set([...prev, ...handIds])));

    updateHistoryItem(item.id, {
      multiplier: finalScore.multiplier,
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
    if (isGameOver) return t.rewardCalculated;
    if (pickedCardIds.length < 2) return t.pickTwoCards;
    if (pickedCardIds.length === 2 && flippedCardIds.length === 0)
      return t.revealOneOrDraw;
    if (pickedCardIds.length === 2 && flippedCardIds.length === 1)
      return t.revealAllOrDraw;
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
        x: (pickedIndex - (pickedCardIds.length - 1) / 2) * 150,
        y: 180,
        rotate: 0,
        scale: 1.05,
        zIndex: 1000 + pickedIndex,
      };
    }

    // Fan-out for deck cards (centered on anchor point)
    const availableCards = deck.filter((c) => !pickedCardIds.includes(c.id));
    const cardIndexInAvailable = availableCards.findIndex((c) => c.id === id);
    if (cardIndexInAvailable === -1) return { x: 0, y: 0, rotate: 0, scale: 0 };

    const total = availableCards.length;
    const fanWidth = 168;
    const startAngle = -fanWidth / 2;
    const angleStep = total > 1 ? fanWidth / (total - 1) : 0;
    const angle = startAngle + cardIndexInAvailable * angleStep;

    const rad = (angle * Math.PI) / 180;
    const radius = 480;

    return {
      x: Math.sin(rad) * radius,
      y: -Math.cos(rad) * radius + 300,
      rotate: angle,
      scale: 0.82,
      zIndex: 10 + cardIndexInAvailable,
    };
  };

  if (!isLoaded) {
    return <DrawCardModalSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="dark fixed inset-0 z-100 bg-background/95 backdrop-blur-md text-foreground"
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {/* Header */}
        <div className="relative z-40 flex items-start justify-between gap-4 border-b border-border/80 bg-card/40 px-5 py-4 backdrop-blur-sm md:px-8 md:py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <SpadeIcon size={24} fill="currentColor" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-black tracking-tight md:text-2xl">
                  {t.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsRulesOpen(true)}
                  aria-label={t.rulesButton}
                  title={t.rulesButton}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                >
                  <HelpCircle size={16} />
                </button>
              </div>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={22} />
          </button>
          </div>
        </div>

        {/* Hope Star — only before first card pick */}
        {canToggleHopeStar && (
          <div className="relative z-110 px-4 pt-3 md:px-8">
            <div className="mx-auto flex max-w-2xl justify-center">
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => setHopeStarEnabled((prev) => !prev)}
                  aria-pressed={hopeStarEnabled}
                  aria-describedby="hope-star-hint"
                  className={cn(
                    'inline-flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98]',
                    hopeStarEnabled
                      ? 'border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-sm shadow-amber-400/10'
                      : 'border-border bg-card/80 text-muted-foreground hover:border-amber-400/30 hover:text-amber-200',
                  )}
                >
                  <Star
                    size={18}
                    className={cn(
                      hopeStarEnabled && 'fill-amber-400 text-amber-400',
                    )}
                  />
                  <span>
                    {hopeStarEnabled ? t.hopeStarActive : t.hopeStarInactive}
                  </span>
                </button>
                <div
                  id="hope-star-hint"
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-120 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-border bg-card px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {t.hopeStarHint}
                </div>
              </div>
            </div>
          </div>
        )}

        {hopeStarEnabled && !canToggleHopeStar && !isGameOver && (
          <div className="relative z-50 px-4 pt-3 md:px-8">
            <div className="mx-auto flex max-w-2xl justify-center">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                {t.hopeStarLocked}
              </div>
            </div>
          </div>
        )}

        {/* Rules dialog */}
        <AnimatePresence>
          {isRulesOpen && (
            <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
              <motion.button
                type="button"
                aria-label={t.rulesClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRulesOpen(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      {t.rulesTitle}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRulesOpen(false)}
                    aria-label={t.rulesClose}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>
                <ol className="max-h-[min(60vh,420px)] space-y-3 overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground">
                  {t.rules.map((rule, index) => (
                    <li key={rule} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                        {index + 1}
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={() => setIsRulesOpen(false)}
                  className="mt-5 h-11 w-full rounded-2xl bg-primary text-sm font-black text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t.rulesClose}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Status */}
        {phase === 'picking' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-50 px-4 pt-5 md:px-8"
          >
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-5 py-3 shadow-sm">
                {isGameOver ? (
                  <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <Pointer className="h-5 w-5 shrink-0 animate-pulse text-primary" />
                )}
                <span className="text-base font-bold md:text-lg">{getMessage()}</span>
              </div>
              {!isGameOver && pickedCardIds.length >= 2 && (
                <p className="max-w-md text-sm text-muted-foreground">
                  {t.revealHint}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Shuffling overlay */}
        <AnimatePresence>
          {phase === 'shuffling' && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
              className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-background/90 pointer-events-none"
            >
              <div className="relative mb-8 h-56 w-40">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: [0, (i - 2.5) * 64, 0],
                      y: [0, i % 2 ? -32 : 32, 0],
                      rotate: [0, (i - 2.5) * 18, 0],
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.08,
                    }}
                    className="absolute inset-0 rounded-2xl border-4 border-primary/20 bg-linear-to-br from-primary to-primary/80 shadow-xl"
                  />
                ))}
              </div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-lg font-bold text-foreground md:text-xl"
              >
                {t.dealing}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card field — cards positioned from screen center */}
        <div className="relative min-h-0 flex-1 px-4 pb-40 pt-4 md:pb-44">
          <div className="absolute left-1/2 top-[42%] h-0 w-0 -translate-x-1/2 -translate-y-1/2">
          {deck.map((card, index) => {
            const pos = getCardPosition(card.id, index);
            const isPicked = pickedCardIds.includes(card.id);
            // REVEAL ALL cards if isGameOver is true
            const isFlipped = flippedCardIds.includes(card.id) || isGameOver;
            const fanStaggerDelay =
              (index / Math.max(deck.length - 1, 1)) * 0.5;
            const isShuffling = phase === 'shuffling';

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
                  opacity: isShuffling ? 0.45 : 1,
                }}
                transition={
                  isShuffling
                    ? { duration: 0.15, ease: 'easeOut' }
                    : {
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                        delay: fanStaggerDelay,
                      }
                }
                whileHover={
                  !isPicked && phase === 'picking' && !isGameOver
                    ? {
                        y: pos.y - 80,
                        scale: 0.95,
                        zIndex: 2000,
                        transition: { duration: 0.2, ease: 'easeOut' },
                      }
                    : isPicked && !isFlipped && phase === 'picking'
                      ? {
                          y: pos.y - 30,
                          scale: 1.15,
                          zIndex: 3000,
                          transition: { duration: 0.2, ease: 'easeOut' },
                        }
                      : {}
                }
                className="absolute h-52 w-36 -ml-[4.5rem] -mt-[6.5rem] cursor-pointer will-change-transform perspective-1000 md:h-56 md:w-40 md:-ml-20 md:-mt-28"
                onClick={() => handleCardClick(card.id)}
              >
                <div
                  className={cn(
                    'relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-[1.25rem]',
                    isFlipped && 'rotate-y-180',
                  )}
                >
                  {/* Card Front (Back Art) */}
                  <div className="absolute inset-0 backface-hidden flex items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-primary/30 bg-primary shadow-xl">
                    <div className="absolute inset-0 bg-linear-to-br from-primary-foreground/10 to-transparent" />
                    <div className="relative z-10 grid grid-cols-4 gap-2 opacity-20">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SpadeIcon
                          key={i}
                          size={18}
                          className="text-primary-foreground"
                          fill="currentColor"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card Back (Suit & Rank) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col rounded-[1.25rem] border border-border bg-[hsl(158,20%,98%)] p-4 text-slate-900 shadow-inner">
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
                          {card.rank === 'Joker' ? t.joker : card.rank}
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
        </div>

        {/* Results panel */}
        <AnimatePresence>
          {(pickedCardIds.length >= 2 || isGameOver) && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 px-4 py-4 backdrop-blur-md md:px-8 md:py-5"
            >
              <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3 sm:items-stretch">
                {/* Active hand */}
                <div className="flex min-h-[7.5rem] flex-col rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-xs font-bold text-muted-foreground">
                    {t.activeHand}
                  </p>
                  <div className="mt-3 flex flex-1 flex-wrap items-center justify-center gap-2">
                    {pickedCardIds.map((id) => {
                      const card = deck.find((c) => c.id === id)!;
                      const isFlipped =
                        flippedCardIds.includes(id) || isGameOver;
                      return (
                        <div
                          key={id}
                          className={cn(
                            'min-w-[72px] rounded-xl border px-4 py-2.5 text-center transition-all',
                            isFlipped
                              ? 'border-border bg-card text-foreground shadow-sm'
                              : 'border-dashed border-border/70 bg-muted/40 text-muted-foreground',
                          )}
                        >
                          <span className="text-xl font-black tabular-nums">
                            {isFlipped
                              ? card.rank === 'Joker'
                                ? 'JK'
                                : card.rank
                              : t.hiddenCard}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Score */}
                <div className="flex min-h-[7.5rem] flex-col rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-xs font-bold text-muted-foreground">
                    {t.scoreCard}
                  </p>
                  <div className="mt-3 flex flex-1 items-center">
                    {scoreData.isInstant ? (
                      <p className="w-full text-center text-xl font-black text-primary">
                        {scoreData.instantType === 'redJoker'
                          ? t.redJoker
                          : t.blackJoker}
                        !
                      </p>
                    ) : (
                      <div className="grid w-full grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t.sum}
                          </p>
                          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
                            {isGameOver
                              ? scoreData.totalScore
                              : t.unknownScore}
                          </p>
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t.remainder}
                          </p>
                          <p className="mt-1 text-2xl font-black tabular-nums text-primary md:text-3xl">
                            {isGameOver ? scoreData.score : t.unknownScore}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multiplier */}
                <div className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 p-4 text-center">
                  <p className="text-xs font-bold text-primary/80">
                    {t.bonusMultiplier}
                  </p>
                  {hopeStarEnabled && !isGameOver ? (
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <Star
                        size={28}
                        className="fill-amber-400 text-amber-400"
                      />
                      <p className="text-sm font-bold text-amber-300">
                        {t.hopeStarPending}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-4xl font-black tabular-nums text-primary md:text-5xl">
                        {isGameOver
                          ? `${scoreData.multiplier}x`
                          : t.pendingMultiplier}
                      </p>
                      {isGameOver && scoreData.hopeStarApplied && (
                        <p className="mt-1 text-xs font-semibold text-amber-400">
                          {t.hopeStarApplied}
                        </p>
                      )}
                    </>
                  )}
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
