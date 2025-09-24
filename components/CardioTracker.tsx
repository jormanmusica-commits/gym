
import React, { useState, useEffect, useRef } from 'react';
import type { NadaMetrics, NadaSession } from '../types';
import { useAppContext } from '../context/AppContext';
import { PlusCircle, MinusCircle, Zap, Gauge, TrendingUp, Flame, CalendarDays, NotebookText, Check, MapPin, Plus, Clock, X, ChevronUp, ChevronDown } from 'lucide-react';
import CalendarModal from './CalendarModal';

// --- HELPER FUNCTIONS ---

function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;
  if (dateString.includes('-')) {
    const date = new Date(dateString + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

const formatDisplayDate = (dateString: string): string => {
  const date = parseCustomDate(dateString);
  if (date) {
    const formatted = date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return (formatted.charAt(0).toUpperCase() + formatted.slice(1)).replace(/[,.]/g, '');
  }
  return dateString;
};

const formatMetric = (value: string | undefined, unit: string) => {
    if (!value || value.trim() === '') return '-';
    // For time, the format is self-descriptive (HH:MM:SS), so just return the value.
    if (unit.toLowerCase() === 'min') {
        return value;
    }
    if (value.toUpperCase().includes(unit.toUpperCase())) return value;
    if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
      return `${value} ${unit}`;
    }
    return value;
};

const TimeStepper: React.FC<{
  value: number;
  setValue: (updater: (prev: number) => number) => void;
  min: number;
  max: number;
  label: string;
  inputRef?: React.Ref<HTMLInputElement>;
}> = ({ value, setValue, min, max, label, inputRef }) => {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const entryRef = useRef('');
  const justFocused = useRef(false);

  const adjustValue = (amount: number) => {
    setValue(prev => {
      let newValue = prev + amount;
      if (newValue > max) newValue = max;
      if (newValue < min) newValue = min;
      return newValue;
    });
  };

  const startChanging = (amount: number) => {
    adjustValue(amount);
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        adjustValue(amount);
      }, 80);
    }, 500);
  };

  const stopChanging = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  
  useEffect(() => {
    return () => stopChanging();
  }, []);
  
  const handleFocus = () => {
      justFocused.current = true;
  };

  const handleBlur = () => {
      entryRef.current = '';
      justFocused.current = false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputType = (e.nativeEvent as InputEvent).inputType;
    const typedChar = (e.nativeEvent as InputEvent).data;

    if (inputType === 'insertText' && typedChar && /[0-9]/.test(typedChar)) {
        if (justFocused.current) {
            entryRef.current = ''; // Clear on first type after focus
            justFocused.current = false;
        }

        entryRef.current += typedChar;
        if (entryRef.current.length > 2) {
            entryRef.current = entryRef.current.slice(-2);
        }
        
        const numericValue = parseInt(entryRef.current, 10);
        if (!isNaN(numericValue)) {
            setValue(() => numericValue);
        }
    } else if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
        entryRef.current = '';
        setValue(() => 0);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onMouseDown={() => startChanging(1)}
        onMouseUp={stopChanging}
        onMouseLeave={stopChanging}
        onTouchStart={(e) => { e.preventDefault(); startChanging(1); }}
        onTouchEnd={stopChanging}
        className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors rounded-full hover:bg-white/10"
        aria-label={`Incrementar ${label}`}
      >
        <ChevronUp className="w-10 h-10" />
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={String(value).padStart(2, '0')}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="text-7xl font-semibold tabular-nums text-white my-2 w-28 text-center bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg"
        aria-label={label}
      />
      <button
        onMouseDown={() => startChanging(-1)}
        onMouseUp={stopChanging}
        onMouseLeave={stopChanging}
        onTouchStart={(e) => { e.preventDefault(); startChanging(-1); }}
        onTouchEnd={stopChanging}
        className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors rounded-full hover:bg-white/10"
        aria-label={`Decrementar ${label}`}
      >
        <ChevronDown className="w-10 h-10" />
      </button>
      <span className="text-sm font-bold text-gray-400 mt-2">{label}</span>
    </div>
  );
};


const TimePickerModal: React.FC<{ initialValue: string; onSave: (value: string) => void; onClose: () => void; }> = ({ initialValue, onSave, onClose }) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const minutesInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const parts = (initialValue || "0:0:00").split(':');
        let h = 0, m = 0, s = 0;

        if (parts.length === 3) {
            h = parseInt(parts[0], 10) || 0;
            m = parseInt(parts[1], 10) || 0;
            s = parseInt(parts[2], 10) || 0;
        } else if (parts.length === 2) {
            m = parseInt(parts[0], 10) || 0;
            s = parseInt(parts[1], 10) || 0;
        }
        
        setHours(Math.min(Math.max(h, 0), 99));
        setMinutes(Math.min(Math.max(m, 0), 59));
        setSeconds(Math.min(Math.max(s, 0), 59));
    }, [initialValue]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            minutesInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);
    
    useEffect(() => {
        if (seconds >= 60) {
            setMinutes(m => m + Math.floor(seconds / 60));
            setSeconds(s => s % 60);
        }
        if (seconds < 0) {
            setMinutes(m => Math.max(m - 1, 0));
            setSeconds(59);
        }
    }, [seconds]);

    useEffect(() => {
        if (minutes >= 60) {
            setHours(h => h + Math.floor(minutes / 60));
            setMinutes(m => m % 60);
        }
        if (minutes < 0) {
            setHours(h => Math.max(h - 1, 0));
            setMinutes(59);
        }
    }, [minutes]);

    useEffect(() => {
        if (hours > 99) setHours(99);
        if (hours < 0) setHours(0);
    }, [hours]);

    const handleSave = () => {
        const timeString = hours > 0
            ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            : `${minutes}:${String(seconds).padStart(2, '0')}`;
        onSave(timeString);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[110] animate-fadeIn" onClick={onClose}>
            <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-scaleIn text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-cyan-400 mb-6">Seleccionar Tiempo</h3>
                
                <div className="flex items-start justify-center gap-1 my-6">
                    <TimeStepper value={hours} setValue={setHours} min={0} max={99} label="Horas" />
                    <span className="text-7xl font-semibold text-white pt-16">:</span>
                    <TimeStepper inputRef={minutesInputRef} value={minutes} setValue={setMinutes} min={-1} max={60} label="Minutos" />
                    <span className="text-7xl font-semibold text-white pt-16">:</span>
                    <TimeStepper value={seconds} setValue={setSeconds} min={-1} max={60} label="Segundos" />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition">Cancelar</button>
                    <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition">Guardar</button>
                </div>
            </div>
        </div>
    );
};

const CardioTracker: React.FC<{ dayName: string; }> = ({ dayName }) => {
  const { addNadaSession, workoutDays, updateWorkoutDayForm, clearNadaForm, activeSede, sedeColorStyles } = useAppContext();
  const { date, title, metrics, notes } = workoutDays[dayName]?.nada || {};
  
  const [showNotification, setShowNotification] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isNotesVisible, setIsNotesVisible] = useState(!!notes);
  const savedStateRef = useRef<string | null>(null);

  const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

  useEffect(() => {
    const currentState = JSON.stringify({ date, title, metrics, notes });
    if (savedStateRef.current && savedStateRef.current !== currentState) {
        setIsSaved(false);
        savedStateRef.current = null;
    }
  }, [date, title, metrics, notes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'date' || name === 'notes' || name === 'title') {
      updateWorkoutDayForm(dayName, name, value);
    } else {
      updateWorkoutDayForm(dayName, name as keyof NadaMetrics, value);
    }
  };

  const handleUnitToggle = () => {
    const newUnit = metrics.distanceUnit === 'KM' ? 'MTS' : 'KM';
    updateWorkoutDayForm(dayName, 'distanceUnit', newUnit);
  };
  
  const handleDateChange = (newDate: string) => {
    updateWorkoutDayForm(dayName, 'date', newDate);
  };
  
  const handleTimeSave = (timeValue: string) => {
    updateWorkoutDayForm(dayName, 'time', timeValue);
  };

  const resetForm = () => {
    clearNadaForm(dayName);
    setIsSaved(false);
    savedStateRef.current = null;
  };

  const handleSave = () => {
    addNadaSession({ date: date.trim() || 'Sin fecha', title, metrics, notes, day: dayName });
    
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 1000);

    setIsSaved(true);
    savedStateRef.current = JSON.stringify({ date, title, metrics, notes });

    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };
  
  const hasMetrics = Object.values(metrics || {}).some(value => typeof value === 'string' && value.trim() !== '');
  const actionButtonClass = "flex-grow md:flex-grow-0 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-opacity-70 btn-active flex items-center justify-center gap-2";
  
  if (!workoutDays[dayName]) return null;

  return (
    <>
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} currentDate={date} onSelectDate={handleDateChange} />
      {isTimePickerOpen && (
        <TimePickerModal initialValue={metrics.time || '0:00'} onSave={handleTimeSave} onClose={() => setIsTimePickerOpen(false)} />
      )}
      <div className="overflow-hidden">
        {showNotification && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white py-3 px-6 rounded-lg shadow-lg z-50 border border-cyan-500 font-semibold animate-notification-pop">
            Guardado
          </div>
        )}
        <div className={`p-4 rounded-xl border border-white/10 ${isSaved ? 'bg-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50' : 'bg-gray-800/70'}`}>
          {isSaved ? (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarDays className="w-5 h-5 text-cyan-400 flex-shrink-0"/>
                      <p className="font-bold text-white truncate">{formatDisplayDate(date)}</p>
                    </div>
                    {activeSede && <span className={`${getSedeColor(activeSede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0`}><MapPin className="w-3 h-3"/>{activeSede}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button onClick={resetForm} className={`${actionButtonClass} bg-gradient-to-br from-cyan-500 to-blue-500 focus:ring-cyan-500/50 hover:shadow-xl shadow-cyan-500/20 text-sm`}>
                    <Plus className="w-4 h-4" /> Nuevo
                  </button>
                </div>
              </div>
              
              <div className="rounded-lg -m-3 p-3 mt-1" role="region" aria-label="Métricas guardadas">
                {hasMetrics && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                      {metrics.speed?.trim() && <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Velocidad</p><p className="font-semibold text-white">{formatMetric(metrics.speed, 'KM/H')}</p></div></div>}
                      {metrics.distance?.trim() && <div className="flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Distancia</p><p className="font-semibold text-white">{formatMetric(metrics.distance, metrics.distanceUnit || 'KM')}</p></div></div>}
                      {metrics.incline?.trim() && <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Inclinación</p><p className="font-semibold text-white">{formatMetric(metrics.incline, '%')}</p></div></div>}
                      {metrics.time?.trim() && <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Tiempo</p><p className="font-semibold text-white">{metrics.time} Min</p></div></div>}
                      {metrics.calories?.trim() && <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Calorías</p><p className="font-semibold text-white">{metrics.calories || '-'}</p></div></div>}
                    </div>
                  </div>
                )}
                {notes && (
                    <div className={`${hasMetrics ? 'mt-3 pt-3 border-t border-gray-700/50' : 'mt-4 pt-4 border-t border-gray-700/50'}`}>
                        <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                            <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                            <p className="whitespace-pre-wrap">{notes}</p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="text" name="title" value={title || ''} onChange={handleInputChange} placeholder="Actividad (ej. Cinta, Elíptica)" className="w-full text-lg font-bold text-cyan-400 bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 transition placeholder:text-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-transparent"/>
                  <button onClick={() => setIsCalendarOpen(true)} className="bg-gray-700 border border-gray-600 rounded-md p-2 transition text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/70"><CalendarDays className="w-5 h-5"/></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label htmlFor="speed" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Zap className="w-4 h-4 text-cyan-400" />Velocidad</label><input type="text" inputMode="decimal" id="speed" name="speed" value={metrics.speed} onChange={handleInputChange} placeholder="KM/H" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/></div>
                    <div><label htmlFor="distance" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Gauge className="w-4 h-4 text-cyan-400" />Distancia</label><div className="relative"><input type="text" inputMode="decimal" id="distance" name="distance" value={metrics.distance} onChange={handleInputChange} placeholder={metrics.distanceUnit || 'KM'} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 pr-20 focus:ring-cyan-500 focus:border-cyan-500 transition"/><button type="button" onClick={handleUnitToggle} className="absolute inset-y-0 right-0 flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white font-bold w-16 rounded-r-md transition-colors">{metrics.distanceUnit || 'KM'}</button></div></div>
                    <div><label htmlFor="incline" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><TrendingUp className="w-4 h-4 text-cyan-400" />Inclinación</label><input type="text" inputMode="decimal" id="incline" name="incline" value={metrics.incline} onChange={handleInputChange} placeholder="%" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/></div>
                    <div><label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Clock className="w-4 h-4 text-cyan-400" />Tiempo</label><button onClick={() => setIsTimePickerOpen(true)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition text-left text-white">{metrics.time ? `${metrics.time}` : <span className="text-gray-400">hh:mm:ss</span>}</button></div>
                    <div className="sm:col-span-2"><label htmlFor="calories" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Flame className="w-4 h-4 text-cyan-400" />Calorías</label><input type="text" inputMode="numeric" id="calories" name="calories" value={metrics.calories} onChange={handleInputChange} placeholder="Kcal" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/></div>
                </div>
                <div>
                  <button onClick={() => setIsNotesVisible(prev => !prev)} className="w-full flex items-center justify-between mb-1 text-left p-1 -m-1 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50" aria-expanded={isNotesVisible}><span className="flex items-center gap-2 text-sm font-medium text-gray-300"><NotebookText className="w-4 h-4 text-cyan-400" />Notas</span><span className="p-1 text-cyan-400">{isNotesVisible ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}</span></button>
                  {isNotesVisible && <textarea id="notes-textarea" name="notes" value={notes || ''} onChange={handleInputChange} placeholder="Añadir notas sobre la sesión..." className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition h-20 resize-none animate-fadeIn"/>}
                </div>
                <div className="flex justify-end gap-4 flex-wrap">
                    <button onClick={handleSave} disabled={isSaved} className={`${actionButtonClass} ${isSaved ? 'bg-green-600 focus:ring-green-500/50 cursor-default' : 'bg-gradient-to-br from-orange-500 to-amber-500 focus:ring-orange-500/50 hover:shadow-xl shadow-orange-500/20'}`}>{isSaved ? <Check className="w-6 h-6" /> : 'Guardar'}</button>
                    <button onClick={resetForm} className={`${actionButtonClass} bg-gradient-to-br from-gray-600 to-gray-700 focus:ring-gray-500/50 hover:from-gray-500 hover:to-gray-600 hover:shadow-xl`}>Borrar</button>
                </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CardioTracker;
