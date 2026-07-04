'use client';

import { useStudyStore } from '@/app/_store-study';
import { useUIStore } from '@/app/_store';
import { useRewardSpinStore } from '@/app/reward-spin/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Zap,
  ZapOff,
  List,
} from 'lucide-react';
import { StudyHistoryModal } from './StudyHistoryModal';
import {
  startOfToday,
  endOfToday,
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
} from 'date-fns';
import { cn } from '@/app/_utils/app-cn.util';

export const StudyTodayCard = () => {
  const { history, isBoostEnabled, setBoostEnabled, status } = useStudyStore();
  const { language } = useUIStore();
  const { boostCount } = useRewardSpinStore();

  const { hoursToday, minutesToday } = useMemo(() => {
    const start = startOfToday().getTime();
    const end = endOfToday().getTime();
    const todaySessions = history.filter(
      (s) => s.timestamp >= start && s.timestamp <= end,
    );
    const totalTodaySeconds = todaySessions.reduce(
      (acc, s) => acc + s.duration,
      0,
    );
    return {
      hoursToday: Math.floor(totalTodaySeconds / 3600),
      minutesToday: Math.floor((totalTodaySeconds % 3600) / 60),
    };
  }, [history]);

  const t = TRANSLATIONS[language].studyTodayCard;

  return (
    <div className="p-8 rounded-4xl bg-secondary/50 border border-border flex flex-col gap-2 relative overflow-hidden group w-full">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground font-bold tracking-tight uppercase text-base">
            {t.title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tabular-nums">
              {hoursToday}h {minutesToday}m
            </span>
          </div>
        </div>

        {/* Use Boost Toggle */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => boostCount > 0 && setBoostEnabled(!isBoostEnabled)}
            disabled={boostCount === 0 || status === 'running'}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all border font-bold text-sm shadow-sm active:scale-95',
              isBoostEnabled && boostCount > 0
                ? 'bg-purple-500 text-white border-purple-400 shadow-purple-500/20'
                : 'bg-background/50 text-muted-foreground border-border/50',
              (boostCount === 0 || status === 'running') &&
                'opacity-50 cursor-not-allowed',
            )}
          >
            {isBoostEnabled && boostCount > 0 ? (
              <Zap size={16} fill="currentColor" />
            ) : (
              <ZapOff size={16} />
            )}
            {t.useBoost}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full">
            <Zap size={12} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {boostCount} {t.boosts}
            </span>
          </div>
        </div>
      </div>

      <p className="text-base text-muted-foreground mt-2">{t.focus}</p>
    </div>
  );
};

export const StudyChartCard = () => {
  const { history, studyTypes } = useStudyStore();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language];
  const [weekOffset, setWeekOffset] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const currentWeekStart = useMemo(() => {
    const now = new Date();
    return startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  }, [weekOffset]);

  const currentWeekEnd = useMemo(() => {
    return endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  }, [currentWeekStart]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(currentWeekStart, i);
      const dayStart = day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day).setHours(23, 59, 59, 999);

      const daySessions = history.filter(
        (s) => s.timestamp >= dayStart && s.timestamp <= dayEnd,
      );

      const dayData: Record<string, string | number> = {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
      };

      studyTypes.forEach((type) => {
        const typeSeconds = daySessions
          .filter((s) => (s.typeId || '1') === type.id)
          .reduce((acc, s) => acc + s.duration, 0);
        dayData[type.id] = Number((typeSeconds / 3600).toFixed(2));
      });

      data.push(dayData);
    }
    return data;
  }, [currentWeekStart, history, studyTypes]);

  if (!mounted) return null;

  return (
    <div className="p-8 rounded-4xl bg-card border border-border flex flex-col gap-6 shadow-sm w-full flex-1 min-h-[450px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <Calendar size={22} />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-foreground">
            {t.studyPage.historyTitle.replace('{tab}', t.tabs.study)}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDetailModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border text-sm font-bold shadow-sm hover:bg-secondary transition-all active:scale-95"
          >
            <List size={16} />
            {t.studyPage.viewDetail}
          </button>

          {/* Navigation */}
          <div className="flex items-center bg-secondary/50 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-xl hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-3 text-base font-bold text-foreground min-w-[160px] text-center">
              {format(currentWeekStart, 'MMM d')} -{' '}
              {format(currentWeekEnd, 'MMM d')}
            </div>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-xl hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
            >
              <ChevronRight size={20} />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="ml-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-base font-bold hover:bg-primary/20 transition-all"
              >
                {t.common.today}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'var(--muted-foreground)',
                fontSize: 16,
                fontWeight: 600,
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'var(--muted-foreground)',
                fontSize: 16,
                fontWeight: 600,
              }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '24px',
                border: '1px solid hsl(var(--border))',
                boxShadow:
                  '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                padding: '16px',
              }}
              itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
              labelStyle={{
                color: 'hsl(var(--foreground))',
                fontWeight: '900',
                marginBottom: '8px',
                fontSize: '16px',
              }}
              labelFormatter={(label, items) => {
                if (items && items.length > 0) {
                  return `${label} - ${items[0].payload.fullDate}`;
                }
                return label;
              }}
              formatter={(value, name) => {
                const normalizedValue = Array.isArray(value)
                  ? value.join(', ')
                  : (value ?? 0);
                const type = studyTypes.find((t) => t.id === String(name));
                return [`${normalizedValue}h`, type ? type.name : String(name)];
              }}
            />
            {studyTypes.map((type, index) => (
              <Bar
                key={type.id}
                dataKey={type.id}
                stackId="a"
                fill={type.color}
                radius={
                  index === studyTypes.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]
                }
                barSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <StudyHistoryModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
