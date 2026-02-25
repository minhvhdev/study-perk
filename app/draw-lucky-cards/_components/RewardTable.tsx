/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRewardSpinStore } from '../../reward-spin/_store';
import {
  RewardHistoryItem,
  RewardEntryType,
} from '../../reward-spin/_types/reward-spin.type';
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
  ExternalLink,
  CheckCircle2,
  Clock,
  Circle,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { get } from 'idb-keyval';
import { DrawCardModal } from './DrawCardModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

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
  key: 'name' | 'type' | 'receivedAt';
  direction: 'asc' | 'desc';
};

type Status = 'Available' | 'InProcess' | 'Done';

export const RewardTable = () => {
  const { rewardHistory, removeHistoryItems } = useRewardSpinStore();
  const { language } = useUIStore();
  const translations = TRANSLATIONS[language];

  const [selectedReward, setSelectedReward] =
    useState<RewardHistoryItem | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<RewardEntryType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'receivedAt',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const itemsPerPage = 10;

  // Initial and reactive status fetch for all items
  useEffect(() => {
    const fetchStatuses = async () => {
      const newStatuses: Record<string, Status> = {};
      let hasNew = false;

      for (const item of rewardHistory) {
        if (item.type === 'nothing') continue;
        // Only fetch if we don't have it yet to avoid excessive DB calls
        if (!statuses[item.id]) {
          const state = await get(`draw-card-state-${item.id}`);
          if (!state) {
            newStatuses[item.id] = 'Available';
          } else if (state.isGameOver) {
            newStatuses[item.id] = 'Done';
          } else {
            newStatuses[item.id] = 'InProcess';
          }
          hasNew = true;
        }
      }

      if (hasNew) {
        setStatuses((prev) => ({ ...prev, ...newStatuses }));
      }
    };
    fetchStatuses();
  }, [rewardHistory, statuses]);

  // Filtering
  const filteredData = useMemo(() => {
    return rewardHistory.filter((item) => {
      const typeMatch = typeFilter === 'all' || item.type === typeFilter;
      const itemStatus = statuses[item.id] || 'Available';
      const statusMatch = statusFilter === 'all' || itemStatus === statusFilter;

      let dateMatch = true;
      if (fromDate || toDate) {
        const itemDate = new Date(item.receivedAt);
        const start = fromDate ? startOfDay(new Date(fromDate)) : new Date(0);
        const end = toDate
          ? endOfDay(new Date(toDate))
          : new Date(8640000000000000);
        dateMatch = isWithinInterval(itemDate, { start, end });
      }

      return typeMatch && statusMatch && dateMatch;
    });
  }, [rewardHistory, typeFilter, statusFilter, statuses, fromDate, toDate]);

  // Sorting
  const sortedData = useMemo(() => {
    const data = [...filteredData];
    data.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (sortConfig.key === 'name') {
        aValue = (a.name || translations.rewardTypes[a.type]).toLowerCase();
        bValue = (b.name || translations.rewardTypes[b.type]).toLowerCase();
      } else if (sortConfig.key === 'type') {
        aValue = translations.rewardTypes[a.type].toLowerCase();
        bValue = translations.rewardTypes[b.type].toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredData, sortConfig, translations]);

  // Pagination
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

  const t = TRANSLATIONS[language].luckyCardsTable;

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

  const handleDeleteSelected = () => {
    setIsDeleteModalOpen(true);
  };

  const onConfirmDelete = () => {
    removeHistoryItems(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full pb-10">
      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-center">
          <div className="relative w-full md:w-44">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <select
              className="w-full pl-10 pr-4 h-11 rounded-xl bg-secondary/50 border border-border/50 outline-none cursor-pointer hover:bg-secondary/80 transition-all font-bold text-sm appearance-none"
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
              className="w-full pl-10 pr-4 h-11 rounded-xl bg-secondary/50 border border-border/50 outline-none cursor-pointer hover:bg-secondary/80 transition-all font-bold text-sm appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">{t.statusAll}</option>
              <option value="Available">{t.available}</option>
              <option value="InProcess">{t.inProcess}</option>
              <option value="Done">{t.done}</option>
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

        {selectedIds.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="w-full lg:w-auto px-6 h-11 rounded-xl bg-destructive text-destructive-foreground font-black text-xs shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            {t.deleteSelected.replace('{count}', selectedIds.length.toString())}
          </button>
        )}
      </div>

      {/* Table Content */}
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
                <th className="px-6 py-4 font-black text-xs uppercase tracking-wider whitespace-nowrap">
                  {t.value}
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('receivedAt')}
                >
                  <div className="flex items-center gap-2">
                    {t.receivedAt}
                    {getSortIcon('receivedAt')}
                  </div>
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-wider whitespace-nowrap">
                  {t.status}
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                const colorClass = TYPE_COLORS[item.type];
                const itemStatus = statuses[item.id] || 'Available';
                const isSelected = selectedIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-secondary/10 transition-colors group',
                      isSelected && 'bg-primary/5',
                    )}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-primary" />
                        ) : (
                          <Square size={18} className="text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground text-sm">
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
                      {item.baseValue}
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
                        {format(item.receivedAt, 'HH:mm dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type !== 'nothing' && (
                        <div className="flex items-center gap-2">
                          {itemStatus === 'Available' && (
                            <>
                              <Circle
                                size={12}
                                className="text-muted-foreground"
                              />
                              <span className="text-sm font-bold text-muted-foreground/60 uppercase tracking-tight">
                                {t.available}
                              </span>
                            </>
                          )}
                          {itemStatus === 'InProcess' && (
                            <>
                              <Clock size={12} className="text-amber-500" />
                              <span className="text-sm font-bold text-amber-500 uppercase tracking-tight">
                                {t.inProcess}
                              </span>
                            </>
                          )}
                          {itemStatus === 'Done' && (
                            <>
                              <CheckCircle2
                                size={12}
                                className="text-green-500"
                              />
                              <span className="text-sm font-bold text-green-500 uppercase tracking-tight">
                                {t.done}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {item.type !== 'nothing' && (
                        <button
                          onClick={() => setSelectedReward(item)}
                          className={cn(
                            'px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-2 ml-auto',
                            itemStatus === 'Done'
                              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              : 'bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.05] active:scale-95',
                          )}
                        >
                          {itemStatus === 'Done' ? t.view : t.draw}
                          <ExternalLink size={12} />
                        </button>
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

        {/* Pagination */}
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
                className="p-2 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-30 transition-all active:scale-95"
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
        onConfirm={onConfirmDelete}
        title={t.confirmDeleteTitle}
        description={t.confirmDeleteDesc}
        count={selectedIds.length}
      />

      <AnimatePresence>
        {selectedReward && (
          <DrawCardModal
            item={selectedReward}
            onClose={async () => {
              setSelectedReward(null);
              // Update status after modal close
              const state = await get(`draw-card-state-${selectedReward.id}`);
              const status: Status = !state
                ? 'Available'
                : state.isGameOver
                  ? 'Done'
                  : 'InProcess';
              setStatuses((prev) => ({ ...prev, [selectedReward.id]: status }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
