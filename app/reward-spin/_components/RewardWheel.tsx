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

    // Center cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 10;
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

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden min-h-0">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-purple-500/5 -z-10" />

      {/* The Wheel */}
      <div
        className={cn(
          'relative group cursor-pointer transition-opacity duration-300',
          spinCount <= 0 && !isSpinning && 'opacity-70 grayscale-[0.5]',
        )}
        onClick={spin}
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className={cn(
            'rounded-full transition-transform duration-300 max-w-[90vw] max-h-[60vh] lg:max-w-full lg:max-h-full h-auto w-auto',
            isSpinning
              ? 'scale-[1.05]'
              : spinCount > 0
                ? 'hover:scale-[1.02] shadow-2xl shadow-primary/10'
                : 'cursor-not-allowed',
          )}
        />

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none select-none">
          <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-lg flex flex-col items-center border border-white/50">
            <span className="text-black font-black text-xl whitespace-nowrap drop-shadow-sm">
              {isSpinning
                ? t.spinning
                : spinCount > 0
                  ? t.clickToSpin
                  : t.outOfSpins}
            </span>
            {spinCount > 0 && !isSpinning && (
              <span className="text-primary text-sm font-black mt-0.5">
                {spinCount} {t.left}
              </span>
            )}
          </div>
          {spinCount > 0 && !isSpinning && (
            <span className="text-white/40 text-base mt-2 font-medium">
              {t.pressEnter}
            </span>
          )}
        </div>

        {/* Pointer */}
        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 z-10">
          <div className="w-10 h-10 bg-destructive transform rotate-45 rounded-sm shadow-xl border-4 border-white" />
        </div>
      </div>
    </div>
  );
};
