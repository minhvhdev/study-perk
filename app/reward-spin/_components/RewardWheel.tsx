'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRewardSpinStore } from '../_store';
import { cn } from '@/app/_utils/app-cn.util';
import { useUIStore } from '../../_store';
import { TRANSLATIONS } from '../../_constants/app-translations.constant';

export const RewardWheel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].spinPage;
  const {
    entries,
    isSpinning,
    setSpinning,
    setWinner,
    spinCount,
    decrementSpin,
  } = useRewardSpinStore();
  const enabledEntries = entries.filter((e) => e.enabled);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 500;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    if (enabledEntries.length === 0) return;

    const totalWeight = enabledEntries.reduce((sum, e) => sum + e.weight, 0);
    let startAngle = rotation;

    enabledEntries.forEach((entry) => {
      const sliceAngle = (entry.weight / totalWeight) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = entry.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(entry.label, radius - 30, 10);
      ctx.restore();

      startAngle += sliceAngle;
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();

    // Small center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.stroke();
  }, [enabledEntries, rotation]);

  const spin = useCallback(() => {
    if (isSpinning || enabledEntries.length === 0 || spinCount <= 0) return;

    decrementSpin();
    setSpinning(true);
    setWinner(null);

    const spinDuration = 5000;
    const startRotation = rotation;
    const extraSpins = 5 + Math.random() * 5;
    const targetRotation = startRotation + extraSpins * 2 * Math.PI;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentRotation =
        startRotation + (targetRotation - startRotation) * ease;

      setRotation(currentRotation % (2 * Math.PI));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        // Calculate winner
        const totalWeight = enabledEntries.reduce(
          (sum, e) => sum + e.weight,
          0,
        );

        const winningAngle =
          (2 * Math.PI - (currentRotation % (2 * Math.PI))) % (2 * Math.PI);
        let cumulativeAngle = 0;
        for (const entry of enabledEntries) {
          const sliceAngle = (entry.weight / totalWeight) * 2 * Math.PI;
          if (
            winningAngle >= cumulativeAngle &&
            winningAngle < cumulativeAngle + sliceAngle
          ) {
            setWinner(entry);
            break;
          }
          cumulativeAngle += sliceAngle;
        }
      }
    };

    requestAnimationFrame(animate);
  }, [
    isSpinning,
    enabledEntries,
    rotation,
    setSpinning,
    setWinner,
    spinCount,
    decrementSpin,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        spin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spin]);

  const canSpin =
    !isSpinning && enabledEntries.length > 0 && spinCount > 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden p-8">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 to-teal-600/5" />

      <div className="flex flex-col items-center gap-8">
        {/* Wheel */}
        <div
          className={cn(
            'relative transition-opacity duration-300',
            canSpin ? 'cursor-pointer' : 'cursor-not-allowed',
            spinCount <= 0 && !isSpinning && 'opacity-70 grayscale-[0.5]',
          )}
          onClick={spin}
          role="button"
          tabIndex={canSpin ? 0 : -1}
          aria-label={canSpin ? t.clickToSpin : t.outOfSpins}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              spin();
            }
          }}
        >
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className={cn(
              'h-auto max-h-[52vh] w-auto max-w-[min(90vw,500px)] rounded-full transition-transform duration-300 lg:max-h-[min(52vh,500px)] lg:max-w-full',
              isSpinning
                ? 'scale-[1.03]'
                : canSpin
                  ? 'shadow-2xl shadow-primary/10 hover:scale-[1.015]'
                  : '',
            )}
          />

          {/* Curved-base pointer */}
          <svg
            aria-hidden
            viewBox="0 0 40 56"
            className="pointer-events-none absolute top-1/2 -right-0.5 z-10 h-14 w-10 -translate-y-1/2 drop-shadow-lg"
          >
            <path
              d="M 2 28 L 28 5 A 248 248 0 0 1 28 51 Z"
              className="fill-destructive stroke-white"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Spin button */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={spin}
            disabled={!canSpin}
            className={cn(
              'min-w-[240px] rounded-2xl px-8 py-4 text-lg font-black transition-all',
              canSpin
                ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95'
                : 'cursor-not-allowed bg-secondary text-muted-foreground',
            )}
          >
            {isSpinning
              ? t.spinning
              : spinCount > 0
                ? t.clickToSpin
                : t.outOfSpins}
          </button>
          {spinCount > 0 && !isSpinning && (
            <p className="text-sm font-medium text-muted-foreground">
              {spinCount} {t.left} · {t.pressEnter}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
