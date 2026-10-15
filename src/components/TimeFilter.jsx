import React, { useState, useEffect, useRef } from 'react';
import { Calendar, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const TIME_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TimeFilter({ 
  currentPreset, 
  onSelectPreset, 
  countsByPreset = {}, 
  dateRangeSummary = '',
  totalLogsCount = 0,
  dateRange = { from: '', to: '' },
  onSelectDateRange,
  theme = 'dark',
}) {
  const [fromDate, setFromDate] = useState(dateRange.from || '');
  const [toDate, setToDate] = useState(dateRange.to || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const popoverRef = useRef(null);

  // Calendar popover view month and year
  const initialDate = dateRange.from ? new Date(dateRange.from) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() || 9); // 0-indexed, 9 = October

  // Synchronize with external date range
  useEffect(() => {
    setFromDate(dateRange.from || '');
    setToDate(dateRange.to || '');
    if (dateRange.from) {
      const d = new Date(dateRange.from);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [dateRange.from, dateRange.to]);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const isCustomActive = Boolean(dateRange.from || dateRange.to);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!fromDate && !toDate) {
      onSelectDateRange({ from: '', to: '' });
      onSelectPreset('all');
      setIsCalendarOpen(false);
      return;
    }
    const effectiveFrom = fromDate || toDate;
    const effectiveTo = toDate || fromDate;
    onSelectDateRange({ from: effectiveFrom, to: effectiveTo });
    setIsCalendarOpen(false);
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    onSelectDateRange({ from: '', to: '' });
    onSelectPreset('all');
    setIsCalendarOpen(false);
  };

  const handleSetToday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setFromDate(todayStr);
    setToDate(todayStr);
    onSelectDateRange({ from: todayStr, to: todayStr });
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Generate calendar days for viewMonth and viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];
  // Prev month filler
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateStr: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i).toISOString().slice(0, 10),
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const monthPadded = String(viewMonth + 1).padStart(2, '0');
    const dayPadded = String(d).padStart(2, '0');
    calendarDays.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${viewYear}-${monthPadded}-${dayPadded}`,
    });
  }
  // Next month filler to complete 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      isCurrentMonth: false,
      dateStr: new Date(viewYear, viewMonth + 1, d).toISOString().slice(0, 10),
    });
  }

  const handleDaySelect = (dayObj) => {
    setFromDate(dayObj.dateStr);
    setToDate(dayObj.dateStr);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors duration-200">
      
      {/* 1. Interactive Calendar Date Picker with Dropdown Popover & [Submit] Button */}
      <div className="flex flex-wrap items-center gap-2.5 relative" ref={popoverRef}>
        
        {/* Date Input Box & Calendar Toggle */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700/80 shadow-sm">
          
          <button
            type="button"
            onClick={() => {
              if (fromInputRef.current && typeof fromInputRef.current.showPicker === 'function') {
                try {
                  fromInputRef.current.showPicker();
                  return;
                } catch (e) {}
              }
              setIsCalendarOpen(prev => !prev);
            }}
            title="Click to open calendar picker"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer p-0.5 rounded transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>
          
          {/* From Date Input */}
          <div className="flex items-center gap-1.5">
            <input
              ref={fromInputRef}
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              onClick={(e) => {
                try {
                  if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                  }
                } catch (err) {}
              }}
              onFocus={(e) => {
                try {
                  if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                  }
                } catch (err) {}
              }}
              aria-label="Filter Date"
              placeholder="dd-mm-yyyy"
              style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
              className="bg-transparent text-slate-900 dark:text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono cursor-pointer"
            />
          </div>

          <span className="text-slate-400 text-xs font-semibold">to</span>

          {/* End Date Input (Optional Range) */}
          <div className="flex items-center gap-1.5">
            <input
              ref={toInputRef}
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              onClick={(e) => {
                try {
                  if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                  }
                } catch (err) {}
              }}
              onFocus={(e) => {
                try {
                  if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                  }
                } catch (err) {}
              }}
              aria-label="End Date"
              placeholder="dd-mm-yyyy"
              style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
              className="bg-transparent text-slate-900 dark:text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono cursor-pointer"
            />
          </div>

          {/* Prominent Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer ml-1"
          >
            Submit
          </button>

          {/* Clear Button */}
          {(isCustomActive || fromDate || toDate) && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date selection"
              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Interactive Calendar Popover (Matching User Screenshot Exactly) */}
        {isCalendarOpen && (
          <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-3.5 w-72 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100">
            
            {/* Header: Month, Year with Up/Down or Nav Arrows */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                {MONTH_NAMES[viewMonth]}, {viewYear}
              </span>
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Previous month"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Next month"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="py-0.5">{d}</div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((item, idx) => {
                const isSelected = fromDate === item.dateStr || toDate === item.dateStr;
                const isToday = item.dateStr === new Date().toISOString().slice(0, 10);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDaySelect(item)}
                    className={`h-7 rounded-md font-mono text-xs flex items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 shadow-md'
                        : isToday
                        ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                        : item.isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Footer Links: Clear & Today */}
            <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleClear}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-sm"
              >
                Apply
              </button>
            </div>

          </div>
        )}

        {/* Quick Period Presets */}
        <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-200 dark:sm:border-slate-800 flex-wrap">
          {TIME_PRESETS.map((preset) => {
            const isActive = currentPreset === preset.id && !isCustomActive;
            const count = preset.id === 'all' ? totalLogsCount : (countsByPreset[preset.id] ?? 0);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  onSelectDateRange({ from: '', to: '' });
                  onSelectPreset(preset.id);
                  setIsCalendarOpen(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60'
                }`}
              >
                <span>{preset.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive 
                    ? 'bg-blue-700 text-blue-100' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Date Range Summary & Info Tooltip */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-end lg:self-auto font-mono">
        <span className="text-slate-700 dark:text-slate-300 font-medium">{dateRangeSummary}</span>
        <InfoTooltip 
          title="Date & Time Filter"
          description="Filter all metrics, trends, and audit logs by choosing a specific calendar date and clicking Submit, or by clicking any quick period preset."
        />
      </div>

    </div>
  );
}
