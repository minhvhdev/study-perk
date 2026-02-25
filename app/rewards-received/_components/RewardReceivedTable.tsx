/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { useRewardSpinStore } from '@/app/reward-spin/_store';
import {
  RewardHistoryItem,
  RewardEntryType,
} from '@/app/reward-spin/_types/reward-spin.type';
import { cn } from '@/app/_utils/app-cn.util';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Gift,
  Coins,
  Coffee,
  Zap,
  Ticket,
  Trash2,
  CheckSquare,
  Square,
  ZapOff,
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DeleteConfirmModal } from '@/app/draw-lucky-cards/_components/DeleteConfirmModal';
import { UseConfirmModal } from './UseConfirmModal';

const TYPE_ICONS: Record<RewardEntryType, any> = {
  monetary: Coins,
  leisure: Coffee,
  boost: Zap,
  'extra-spin': Ticket,
  nothing: Gift,
};

const TYPE_COLORS: Record<RewardEntryType, string> = {
  monetary: 'text-amber-500',
  leisure: 'text-blue-500',
  boost: 'text-purple-500',
  'extra-spin': 'text-green-500',
  nothing: 'text-slate-400',
};

type SortConfig = {
  key: 'name' | 'type' | 'finishedAt' | 'usedAt' | 'totalValue';
  direction: 'asc' | 'desc';
};

export const RewardReceivedTable = () => {
  const { rewardHistory, removeHistoryItems, claimHistoryItems } =
    useRewardSpinStore();
  const { language } = useUIStore();
  const translations = TRANSLATIONS[language];

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<RewardEntryType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'Used' | 'Available'
  >('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'finishedAt',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [pendingUseIds, setPendingUseIds] = useState<string[]>([]);

  const itemsPerPage = 10;

  // Filter only finished rewards
  const finishedRewards = useMemo(() => {
    return rewardHistory.filter(
      (item) => item.multiplier !== undefined && item.type !== 'nothing',
    );
  }, [rewardHistory]);

  const filteredData = useMemo(() => {
    return finishedRewards.filter((item) => {
      const typeMatch = typeFilter === 'all' || item.type === typeFilter;
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'Used' ? item.isUsed : !item.isUsed);

      let dateMatch = true;
      if ((fromDate || toDate) && item.finishedAt) {
        const itemDate = new Date(item.finishedAt);
        const start = fromDate ? startOfDay(new Date(fromDate)) : new Date(0);
        const end = toDate
          ? endOfDay(new Date(toDate))
          : new Date(8640000000000000);
        dateMatch = isWithinInterval(itemDate, { start, end });
      }

      return typeMatch && statusMatch && dateMatch;
    });
  }, [finishedRewards, typeFilter, statusFilter, fromDate, toDate]);

  const sortedData = useMemo(() => {
    const data = [...filteredData];
    data.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const getVal = (item: RewardHistoryItem) =>
        item.baseValue * (item.multiplier ?? 1);

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.name || translations.rewardTypes[a.type]).toLowerCase();
          bValue = (b.name || translations.rewardTypes[b.type]).toLowerCase();
          break;
        case 'type':
          aValue = translations.rewardTypes[a.type].toLowerCase();
          bValue = translations.rewardTypes[b.type].toLowerCase();
          break;
        case 'totalValue':
          aValue = getVal(a);
          bValue = getVal(b);
          break;
        case 'finishedAt':
          aValue = a.finishedAt ?? 0;
          bValue = b.finishedAt ?? 0;
          break;
        case 'usedAt':
          aValue = a.usedAt ?? 0;
          bValue = b.usedAt ?? 0;
          break;
        default:
          aValue = a.receivedAt;
          bValue = b.receivedAt;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredData, sortConfig, translations]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} className="text-muted-foreground/30" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  const t = TRANSLATIONS[language].rewardsReceivedTable;

  const handleSelectAll = () => {
    if (
      selectedIds.length === paginatedData.length &&
      paginatedData.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((item) => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleClaimItem = (id: string) => {
    setPendingUseIds([id]);
    setIsUseModalOpen(true);
  };

  const handleClaimSelected = () => {
    setPendingUseIds(selectedIds);
    setIsUseModalOpen(true);
  };

  const onConfirmUse = () => {
    claimHistoryItems(pendingUseIds);
    if (pendingUseIds.length > 1) {
      setSelectedIds([]);
    }
    setPendingUseIds([]);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full pb-10">
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-center">
          <div className="relative w-full md:w-44">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <select
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border/50 outline-none cursor-pointer hover:bg-secondary/80 font-bold text-sm appearance-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">{t.typeAll}</option>
              {Object.keys(TYPE_ICONS).map((type) => (
                <option key={type} value={type}>
                  {translations.rewardTypes[type as RewardEntryType]}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-44">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <select
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border/50 outline-none cursor-pointer hover:bg-secondary/80 font-bold text-sm appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">{t.statusAll}</option>
              <option value="Available">{t.available}</option>
              <option value="Used">{t.used}</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <span className="absolute -top-2.5 left-3 px-1.5 bg-card text-[10px] font-black uppercase text-primary tracking-widest z-10">
                {t.from}
              </span>
              <input
                type="date"
                className="w-full md:w-44 h-11 px-4 pt-1 rounded-xl bg-secondary/50 border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                value={fromDate}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setFromDate(newFrom);
                  if (toDate && newFrom > toDate) {
                    setToDate('');
                  }
                }}
              />
            </div>
            <div className="relative group flex-1 md:flex-none">
              <span className="absolute -top-2.5 left-3 px-1.5 bg-card text-[10px] font-black uppercase text-primary tracking-widest z-10">
                {t.to}
              </span>
              <input
                type="date"
                className="w-full md:w-44 h-11 px-4 pt-1 rounded-xl bg-secondary/50 border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                value={toDate}
                min={fromDate}
                onChange={(e) => {
                  const newTo = e.target.value;
                  if (fromDate && newTo && newTo < fromDate) return;
                  setToDate(newTo);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={handleClaimSelected}
                className="flex-1 lg:flex-none px-6 h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                {t.useSelected.replace(
                  '{count}',
                  selectedIds.length.toString(),
                )}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 h-11 rounded-xl bg-destructive text-destructive-foreground font-black text-xs shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">
                  {t.deleteSelected.replace(
                    '{count}',
                    selectedIds.length.toString(),
                  )}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="px-6 py-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                  >
                    {selectedIds.length === paginatedData.length &&
                    paginatedData.length > 0 ? (
                      <CheckSquare size={18} className="text-primary" />
                    ) : (
                      <Square size={18} className="text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2 text-foreground">
                    {t.name}
                    {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2">
                    {t.type}
                    {getSortIcon('type')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('totalValue')}
                >
                  <div className="flex items-center gap-2">
                    {t.totalValue}
                    {getSortIcon('totalValue')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('finishedAt')}
                >
                  <div className="flex items-center gap-2">
                    {t.finishedAt}
                    {getSortIcon('finishedAt')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('usedAt')}
                >
                  <div className="flex items-center gap-2">
                    {t.usedAt}
                    {getSortIcon('usedAt')}
                  </div>
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                const colorClass = TYPE_COLORS[item.type];
                const totalValue = item.baseValue * (item.multiplier ?? 1);

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-secondary/10 transition-colors',
                      selectedIds.includes(item.id) && 'bg-primary/5',
                    )}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                      >
                        {selectedIds.includes(item.id) ? (
                          <CheckSquare size={18} className="text-primary" />
                        ) : (
                          <Square size={18} className="text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                      {item.name || translations.rewardTypes[item.type]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'p-1.5 rounded-lg bg-current/10',
                            colorClass,
                          )}
                        >
                          <Icon size={14} className="text-current" />
                        </div>
                        <span className="text-sm font-medium">
                          {translations.rewardTypes[item.type]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-primary text-base">
                      {totalValue}
                      <span className="text-[10px] ml-1 opacity-70 font-black uppercase tracking-widest">
                        {item.type === 'monetary' && 'kVNĐ'}
                        {item.type === 'leisure' && 'mins'}
                        {item.type === 'boost' && 'sess'}
                        {item.type === 'extra-spin' && 'spin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                        <Calendar size={14} />
                        {item.finishedAt
                          ? format(item.finishedAt, 'HH:mm dd/MM/yyyy')
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.isUsed && item.usedAt ? (
                        <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                          <CheckSquare size={14} />
                          {format(item.usedAt, 'HH:mm dd/MM/yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic opacity-30">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {!item.isUsed && (
                        <button
                          onClick={() => handleClaimItem(item.id)}
                          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2 ml-auto"
                        >
                          <Zap size={12} />
                          {t.useNow}
                        </button>
                      )}
                      {item.isUsed && (
                        <div className="flex items-center gap-2 justify-end text-muted-foreground/40 italic text-[10px] font-black uppercase tracking-widest">
                          <ZapOff size={10} />
                          {t.used}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-muted-foreground font-medium"
                  >
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Gift size={48} />
                      <span className="text-lg font-black uppercase tracking-widest">
                        {t.noData}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-auto p-4 border-t border-border flex items-center justify-between bg-secondary/10">
            <span className="text-sm text-muted-foreground font-bold">
              {t.pagination
                .replace('{current}', currentPage.toString())
                .replace('{total}', totalPages.toString())}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 rounded-lg border border-border bg-background disabled:opacity-30 hover:bg-secondary transition-all active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 rounded-lg border border-border bg-background disabled:opacity-30 hover:bg-secondary transition-all active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          removeHistoryItems(selectedIds);
          setSelectedIds([]);
        }}
        title={t.confirmDeleteTitle}
        description={t.confirmDeleteDesc}
        count={selectedIds.length}
      />

      <UseConfirmModal
        isOpen={isUseModalOpen}
        onClose={() => {
          setIsUseModalOpen(false);
          setPendingUseIds([]);
        }}
        onConfirm={onConfirmUse}
        title={t.confirmUseTitle}
        description={
          pendingUseIds.length > 1
            ? t.confirmUseBulk.replace(
                '{count}',
                pendingUseIds.length.toString(),
              )
            : t.confirmUseDesc
        }
        count={pendingUseIds.length}
      />
    </div>
  );
};
