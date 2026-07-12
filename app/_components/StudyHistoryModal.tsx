'use client';

import { useState, useMemo } from 'react';
import { useStudyStore } from '@/app/_store-study';
import { useUIStore } from '@/app/_store';
import {
  X,
  Trash2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  CheckSquare,
  Square,
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/app/_utils/app-cn.util';
import { DeleteConfirmModal } from '@/app/draw-lucky-cards/_components/DeleteConfirmModal';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';

type SortConfig = {
  key: 'timestamp' | 'type' | 'duration';
  direction: 'asc' | 'desc';
};

type StudyHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const StudyHistoryModal = ({
  isOpen,
  onClose,
}: StudyHistoryModalProps) => {
  const { history, studyTypes, removeSessions } = useStudyStore();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].historyModal;

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'timestamp',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return history.filter((item) => {
      const typeMatch = typeFilter === 'all' || item.typeId === typeFilter;

      let dateMatch = true;
      if (fromDate || toDate) {
        const itemDate = new Date(item.timestamp);
        const start = fromDate ? startOfDay(new Date(fromDate)) : new Date(0);
        const end = toDate
          ? endOfDay(new Date(toDate))
          : new Date(8640000000000000); // Max date
        dateMatch = isWithinInterval(itemDate, { start, end });
      }

      return typeMatch && dateMatch;
    });
  }, [history, typeFilter, fromDate, toDate]);

  const sortedData = useMemo(() => {
    const data = [...filteredData];
    data.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'type':
          const typeA = studyTypes.find((st) => st.id === a.typeId)?.name || '';
          const typeB = studyTypes.find((st) => st.id === b.typeId)?.name || '';
          aValue = typeA.toLowerCase();
          bValue = typeB.toLowerCase();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredData, sortConfig, studyTypes]);

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

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-card border border-border rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 bg-secondary/10 flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
            <div className="relative w-full md:w-44">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <select
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border/50 outline-none cursor-pointer hover:bg-secondary/80 font-bold text-sm appearance-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">{t.typeAll}</option>
                {studyTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
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
                  className="w-full md:w-44 h-11 px-4 pt-1 rounded-xl bg-secondary/50 border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm appearance-none"
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
                  className="w-full md:w-44 h-11 px-4 pt-1 rounded-xl bg-secondary/50 border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm appearance-none"
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
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full xl:w-auto px-6 h-11 rounded-xl bg-destructive text-destructive-foreground font-black text-xs shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              {t.deleteSelected.replace(
                '{count}',
                selectedIds.length.toString(),
              )}
            </button>
          )}
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <tr className="bg-secondary/30">
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
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 group"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2">
                    {t.type}
                    {getSortIcon('type')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 group"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-2">
                    {t.startAt}
                    {getSortIcon('timestamp')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-secondary/50 group"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center gap-2">
                    {t.duration}
                    {getSortIcon('duration')}
                  </div>
                </th>
                <th className="px-6 py-4 font-black text-xs uppercase tracking-wider">
                  {t.boosted}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((item) => {
                const type = studyTypes.find((st) => st.id === item.typeId);
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type?.color || '#ccc' }}
                        />
                        <span className="font-bold text-foreground">
                          {type?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                        <Calendar size={14} />
                        {format(item.timestamp, 'HH:mm dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-primary">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {formatDuration(item.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.isBoosted ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full w-fit group">
                          <Zap
                            size={12}
                            fill="currentColor"
                            className="group-hover:animate-pulse"
                          />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {t.yes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic opacity-50">
                          {t.no}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-muted-foreground font-medium"
                  >
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Calendar size={48} />
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

        {/* Footer / Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-card">
            <span className="text-sm text-muted-foreground font-bold">
              {t.pagination
                .replace('{current}', currentPage.toString())
                .replace('{total}', totalPages.toString())}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 rounded-lg border border-border bg-background disabled:opacity-30 transition-all hover:bg-secondary active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 rounded-lg border border-border bg-background disabled:opacity-30 transition-all hover:bg-secondary active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            removeSessions(selectedIds);
            setSelectedIds([]);
            setIsDeleteModalOpen(false);
          }}
          title={t.confirmDeleteTitle}
          description={t.confirmDeleteDesc}
          count={selectedIds.length}
        />
      </motion.div>
    </div>
  );
};
