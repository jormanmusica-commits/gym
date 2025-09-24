
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  currentDate: string; // YYYY-MM-DD
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onSelectDate, currentDate }) => {
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      const initialDate = currentDate ? new Date(currentDate) : new Date();
      // Adjust for timezone offset
      if (!isNaN(initialDate.getTime())) {
          initialDate.setMinutes(initialDate.getMinutes() + initialDate.getTimezoneOffset());
      }
      setViewDate(isNaN(initialDate.getTime()) ? new Date() : initialDate);
    }
  }, [isOpen, currentDate]);

  const selectedDateObj = useMemo(() => {
    if (!currentDate) return null;
    const d = new Date(currentDate);
    if (isNaN(d.getTime())) return null;
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d;
  }, [currentDate]);

  const changeMonth = (amount: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const calendarGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

    const grid = [];
    // Days from previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = 0; i < dayOffset; i++) {
      grid.push({ day: daysInPrevMonth - dayOffset + i + 1, isCurrentMonth: false });
    }
    // Days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({ day: i, isCurrentMonth: true });
    }
    // Days from next month
    const remainingSlots = 42 - grid.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      grid.push({ day: i, isCurrentMonth: false });
    }
    return grid;
  }, [viewDate]);

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const y = newDate.getFullYear();
    const m = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const d = newDate.getDate().toString().padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
    onClose();
  };

  if (!isOpen) return null;

  const today = new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
      <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-4 w-full max-w-xs m-4 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white/10 transition">
            <ChevronLeft className="w-5 h-5 text-cyan-400" />
          </button>
          <div className="font-bold text-lg text-white capitalize">
            {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white/10 transition">
            <ChevronRight className="w-5 h-5 text-cyan-400" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
          <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((item, index) => {
            const isToday = item.isCurrentMonth && item.day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
            const isSelected = item.isCurrentMonth && selectedDateObj && item.day === selectedDateObj.getDate() && viewDate.getMonth() === selectedDateObj.getMonth() && viewDate.getFullYear() === selectedDateObj.getFullYear();
            
            let classes = "w-9 h-9 flex items-center justify-center rounded-full text-sm transition ";
            if (item.isCurrentMonth) {
              classes += "cursor-pointer hover:bg-cyan-500/20 text-white ";
            } else {
              classes += "text-gray-600 ";
            }
            if (isSelected) {
              classes += "bg-cyan-500 font-bold ";
            }
            if (isToday && !isSelected) {
              classes += "border border-cyan-400/50 ";
            }
            return (
              <button key={index} onClick={() => item.isCurrentMonth && handleDayClick(item.day)} className={classes} disabled={!item.isCurrentMonth}>
                {item.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default CalendarModal;