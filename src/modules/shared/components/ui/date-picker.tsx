'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO string format YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const parsedValue = value ? parseISO(value) : null;
  const [currentMonth, setCurrentMonth] = useState(parsedValue || new Date());
  
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(format(newDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getDay(startOfMonth(currentMonth));

    // Pad empty days at start
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = parsedValue && isSameDay(date, parsedValue);
      const isCurrentDay = isToday(date);

      days.push(
        <button
          key={day}
          onClick={() => handleSelectDate(day)}
          className={`h-8 w-8 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200
            ${isSelected ? 'bg-[var(--primary)] text-white shadow-[0_0_10px_rgba(0,112,243,0.4)] scale-105' : 'text-[var(--text)] hover:bg-[var(--sidebar-hover)] hover:text-white'}
            ${!isSelected && isCurrentDay ? 'border border-[var(--primary)] text-[var(--primary)]' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text)] flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[var(--primary)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-200 hover:border-white/10"
      >
        <span className={value ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
          {value ? format(parseISO(value), 'PPP', { locale: es }) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] w-[280px] animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePreviousMonth} className="p-1 rounded-md hover:bg-[var(--sidebar-hover)] text-[var(--text-secondary)] hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-[var(--text)] capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded-md hover:bg-[var(--sidebar-hover)] text-[var(--text-secondary)] hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => { setCurrentMonth(new Date()); handleSelectDate(new Date().getDate()); }}
              className="text-xs text-[var(--primary)] font-medium hover:text-[var(--primary-hover)] transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
