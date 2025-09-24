
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Trash2, Camera, X, CalendarDays, Weight, NotebookText, BarChart4, Repeat, PlusCircle, MinusCircle, History, Save, Check, ChevronDown, MapPin, ChevronLeft, ChevronRight, Clock, Flame, Zap, Gauge, TrendingUp, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import type { ExerciseLog, ExerciseMedia } from '../types';
import CalendarModal from './CalendarModal';
import ConfirmationModal from './ConfirmationModal';

const createInitialLogData = (): Omit<ExerciseLog, 'id' | 'day' | 'sede' | 'date'> => ({
    exerciseName: '',
    reps: '',
    kilos: '',
    series: '',
    media: [],
    notes: '',
    tiempo: '',
    calorias: '',
    distanceUnit: 'KM',
});

function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;
  if (dateString.includes('-')) {
    const date = new Date(dateString + 'T00:00:00');
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

const formatFullDisplayDate = (dateString: string): string => {
  const date = parseCustomDate(dateString);
  if (date) {
    const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'long' });
    const year = date.getFullYear();

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return `${capitalize(weekday)} ${day} ${capitalize(month)} ${year}`;
  }
  return dateString;
};

// --- PERFORMANCE COMPARISON HELPERS ---
const parseMetric = (value: string | undefined): number | null => {
    if (value === undefined || value === null || value.trim() === '') return null;
    const num = parseFloat(value.replace(',', '.'));
    return isNaN(num) ? null : num;
};

const parseTimeToSeconds = (timeStr: string | undefined): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
};

type ComparisonStatus = 'increase' | 'decrease' | 'same' | 'new';

const useExerciseComparison = (currentLog: ExerciseLog, allLogs: ExerciseLog[]) => {
    return useMemo(() => {
        const currentLogDate = parseCustomDate(currentLog.date);
        if (!currentLogDate) return {};

        const previousLogs = allLogs
            .filter(log =>
                log.id !== currentLog.id &&
                log.exerciseName === currentLog.exerciseName &&
                log.sede === currentLog.sede &&
                parseCustomDate(log.date) &&
                parseCustomDate(log.date)! < currentLogDate
            )
            .sort((a, b) => parseCustomDate(b.date)!.getTime() - parseCustomDate(a.date)!.getTime());

        const prevLog = previousLogs[0];
        if (!prevLog) return {};

        const comparisons: { [key in keyof ExerciseLog]?: ComparisonStatus } = {};
        
        const metricsToCompare: (keyof ExerciseLog)[] = ['series', 'reps', 'kilos', 'tiempo', 'calorias'];

        metricsToCompare.forEach(metric => {
            let currentVal: number | null;
            let prevVal: number | null;

            if (metric === 'tiempo') {
                currentVal = parseTimeToSeconds(currentLog.tiempo);
                prevVal = parseTimeToSeconds(prevLog.tiempo);
            } else {
                currentVal = parseMetric(currentLog[metric] as string);
                prevVal = parseMetric(prevLog[metric] as string);
            }

            if (currentVal !== null && prevVal !== null) {
                if (currentVal > prevVal) comparisons[metric] = 'increase';
                else if (currentVal < prevVal) comparisons[metric] = 'decrease';
                else comparisons[metric] = 'same';
            }
        });

        return comparisons;
    }, [currentLog, allLogs]);
};

const MetricItem: React.FC<{
  label: string;
  value: string | undefined;
  unit: string;
  Icon: React.ElementType;
  comparison?: ComparisonStatus;
}> = ({ label, value, unit, Icon, comparison }) => {
    if (!value || value.trim() === '') return null;
    const colorClass = comparison === 'increase' ? 'text-green-400' : comparison === 'decrease' ? 'text-red-400' : 'text-white';
    
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`font-semibold flex items-center gap-1 ${colorClass}`}>
                    {comparison === 'increase' && <ArrowUp className="w-3 h-3" />}
                    {comparison === 'decrease' && <ArrowDown className="w-3 h-3" />}
                    {value} {unit}
                </p>
            </div>
        </div>
    );
};


// Local Lightbox component
interface MediaLightboxProps {
  allMedia: ExerciseMedia[];
  startIndex: number;
  onClose: () => void;
  onDelete?: (indexToDelete: number) => void;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({ allMedia, startIndex, onClose, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : allMedia.length - 1));
    };
    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev < allMedia.length - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setCurrentIndex(prev => (prev > 0 ? prev - 1 : allMedia.length - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentIndex(prev => (prev < allMedia.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [allMedia.length, onClose]);
    
    if (!allMedia || allMedia.length === 0) return null;
    const currentMedia = allMedia[currentIndex];
    if (!currentMedia) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
            <button className="absolute top-4 right-4 text-white hover:text-cyan-400 transition z-20" aria-label="Cerrar vista previa" onClick={onClose}>
                <X className="w-8 h-8" />
            </button>
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(currentIndex);
                    }}
                    className="absolute bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 z-20 transition-transform duration-200 ease-in-out hover:scale-110"
                    aria-label="Eliminar media"
                >
                    <Trash2 className="w-6 h-6" />
                </button>
            )}

            {allMedia.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            <div className="relative max-w-[90vw] max-h-[90vh] animate-scaleIn flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {currentMedia.type === 'image' ? (
                    <img src={currentMedia.dataUrl} alt="Vista previa de ejercicio" className="max-w-full max-h-full object-contain" />
                ) : (
                    <video src={currentMedia.dataUrl} controls autoPlay className="max-w-full max-h-full object-contain" />
                )}
            </div>
            
            {allMedia.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm rounded-full px-3 py-1 z-10">
                    {currentIndex + 1} / {allMedia.length}
                </div>
            )}
        </div>
    );
};

const TimeStepper: React.FC<{
  value: number;
  setValue: (updater: (prev: number) => number) => void;
  min: number;
  max: number;
  label: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onFull?: () => void;
}> = ({ value, setValue, min, max, label, inputRef, onFull }) => {
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

        if (entryRef.current.length >= 2 && onFull) {
            onFull();
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
    const secondsInputRef = useRef<HTMLInputElement>(null);

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
        minutesInputRef.current?.focus();
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
    
    const handleMinutesFull = () => {
        secondsInputRef.current?.focus();
    };

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
                    <TimeStepper inputRef={minutesInputRef} value={minutes} setValue={setMinutes} min={-1} max={60} label="Minutos" onFull={handleMinutesFull} />
                    <span className="text-7xl font-semibold text-white pt-16">:</span>
                    <TimeStepper inputRef={secondsInputRef} value={seconds} setValue={setSeconds} min={-1} max={60} label="Segundos" />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition">Cancelar</button>
                    <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition">Guardar</button>
                </div>
            </div>
        </div>
    );
};

// Local Modal Component for adding/editing logs
interface ExerciseLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ExerciseLog, 'id' | 'day' | 'sede'>) => void;
    dayName: string;
    initialData?: Omit<ExerciseLog, 'id'| 'day' | 'sede'> | null;
    exerciseNames: { [dayName: string]: string[] };
    removeExerciseName: (dayName: string, exerciseName: string) => void;
}

const ExerciseLogModal: React.FC<ExerciseLogModalProps> = ({ isOpen, onClose, onSave, dayName, initialData, exerciseNames, removeExerciseName }) => {
    const { todaysDateISO } = useAppContext();
    const [formData, setFormData] = useState(createInitialLogData() as ExerciseLog);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isNotesVisible, setIsNotesVisible] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const suggestionBoxRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (isOpen) {
            const data = initialData ? { ...initialData } : { ...createInitialLogData(), date: todaysDateISO };
            setFormData(data as ExerciseLog);
            setIsNotesVisible(!!data.notes);
        }
    }, [isOpen, initialData, todaysDateISO]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target as Node)) {
              setIsSuggestionsVisible(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof Omit<ExerciseLog, 'id'|'day'|'sede'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'exerciseName') {
            const allNames = exerciseNames[dayName] || [];
            if (value) {
                const filtered = allNames.filter(name => name.toLowerCase().includes(value.toLowerCase()));
                setSuggestions(filtered);
            } else {
                setSuggestions(allNames);
            }
            setIsSuggestionsVisible(true);
        }
    };

    const handleNameInputFocus = () => {
        const allNames = exerciseNames[dayName] || [];
        const currentValue = formData.exerciseName.toLowerCase();
        const filtered = currentValue ? allNames.filter(name => name.toLowerCase().includes(currentValue)) : allNames;
        setSuggestions(filtered);
        setIsSuggestionsVisible(true);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setFormData(prev => ({ ...prev, exerciseName: suggestion }));
        setIsSuggestionsVisible(false);
    };

    const handleDeleteSuggestion = (e: React.MouseEvent, suggestion: string) => {
        e.stopPropagation(); // Prevent the li's onMouseDown from firing
        removeExerciseName(dayName, suggestion);
        setSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    const handleSaveClick = () => {
        onSave({ ...formData, exerciseName: formData.exerciseName.trim().toUpperCase() });
    };
    
    const removeMedia = (index: number) => {
        handleInputChange('media', formData.media.filter((_, i) => i !== index));
    };
    
    const formatDateForButton = (isoDate: string) => {
        if (!isoDate) return "Seleccionar fecha";
        const dateObj = new Date(isoDate);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        return dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[,.]/g, '');
    };
    
    const handleUnitToggle = () => {
        handleInputChange('distanceUnit', formData.distanceUnit === 'KM' ? 'M' : 'KM');
    };

    const inputClasses = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 transition duration-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500/70";
    const isNadaTab = dayName === 'Día 5';

    return (
        <>
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} currentDate={formData.date} onSelectDate={(date) => handleInputChange('date', date)} />
            {isTimePickerOpen && (
                <TimePickerModal
                    initialValue={formData.tiempo || '0:00'}
                    onSave={(timeValue) => {
                        handleInputChange('tiempo', timeValue);
                        setIsTimePickerOpen(false);
                    }}
                    onClose={() => setIsTimePickerOpen(false)}
                />
            )}
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
                <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <div className="w-10 h-10" /> {/* Spacer to balance the right side controls */}
                        <h2 className="text-xl font-bold text-cyan-400 text-center flex-grow">
                            {initialData ? 'Editar Ejercicio' : 'Añadir Ejercicio'}
                        </h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsCalendarOpen(true)} className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 transition text-white text-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/70">
                                <CalendarDays className="w-4 h-4"/>
                                {formatDateForButton(formData.date)}
                            </button>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto pr-2 space-y-4 no-scrollbar">
                        <div className="relative" ref={suggestionBoxRef}>
                            <input
                                type="text"
                                value={formData.exerciseName}
                                onChange={(e) => handleInputChange('exerciseName', e.target.value)}
                                onFocus={handleNameInputFocus}
                                placeholder="NOMBRE DEL EJERCICIO"
                                className="w-full text-xl font-extrabold text-cyan-400 bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 transition placeholder:text-cyan-400/50 tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-transparent"
                                autoComplete="off"
                            />
                            {isSuggestionsVisible && suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {suggestions.map(suggestion => (
                                        <li
                                            key={suggestion}
                                            onMouseDown={() => handleSuggestionClick(suggestion)}
                                            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-cyan-600 text-white group"
                                        >
                                            <span>{suggestion}</span>
                                            <button
                                                onMouseDown={(e) => handleDeleteSuggestion(e, suggestion)}
                                                className="p-1 rounded-full text-gray-400 group-hover:text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label={`Eliminar sugerencia ${suggestion}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                         {formData.media.length > 0 && (
                             <div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.media.map((mediaItem, index) => (
                                        <div key={index} className="relative w-20 h-20 group">
                                            {mediaItem.type === 'image' ? <img src={mediaItem.dataUrl} className="rounded-lg object-cover w-full h-full" alt="" /> : <video src={mediaItem.dataUrl} muted loop playsInline className="rounded-lg object-cover w-full h-full" />}
                                            <button onClick={() => removeMedia(index)} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                        
                        {isNadaTab ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Clock className="w-4 h-4 text-cyan-400" />Tiempo</label>
                                    <button
                                        onClick={() => setIsTimePickerOpen(true)}
                                        className={`${inputClasses} text-left`}
                                    >
                                        {formData.tiempo ? formData.tiempo : <span className="text-gray-400">hh:mm:ss</span>}
                                    </button>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Zap className="w-4 h-4 text-cyan-400" />Velocidad (Km/h)</label>
                                    <input type="text" inputMode="decimal" value={formData.series} onChange={(e) => handleInputChange('series', e.target.value)} placeholder="Km/h" className={inputClasses} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Gauge className="w-4 h-4 text-cyan-400" />Distancia</label>
                                    <div className="relative">
                                        <input type="text" inputMode="decimal" value={formData.reps} onChange={(e) => handleInputChange('reps', e.target.value)} placeholder={formData.distanceUnit === 'KM' ? 'Kilómetros' : 'Metros'} className={`${inputClasses} pr-16`} />
                                        <button type="button" onClick={handleUnitToggle} className="absolute inset-y-0 right-0 flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white font-bold w-14 rounded-r-md transition-colors">{formData.distanceUnit === 'KM' ? 'Km' : 'M'}</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Flame className="w-4 h-4 text-cyan-400" />Calorías</label>
                                    <input type="text" inputMode="numeric" value={formData.calorias} onChange={(e) => handleInputChange('calorias', e.target.value)} placeholder="Kcal" className={inputClasses} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><TrendingUp className="w-4 h-4 text-cyan-400" />Inclinación (%)</label>
                                    <input type="text" inputMode="decimal" value={formData.kilos} onChange={(e) => handleInputChange('kilos', e.target.value)} placeholder="%" className={inputClasses} />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><BarChart4 className="w-4 h-4 text-cyan-400" />Series</label>
                                    <input type="text" inputMode="numeric" value={formData.series} onChange={(e) => handleInputChange('series', e.target.value)} className={inputClasses} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Repeat className="w-4 h-4 text-cyan-400" />Repeticiones</label>
                                    <input type="text" inputMode="numeric" value={formData.reps} onChange={(e) => handleInputChange('reps', e.target.value)} className={inputClasses} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Weight className="w-4 h-4 text-cyan-400" />Kilos</label>
                                    <input type="text" inputMode="decimal" value={formData.kilos} onChange={(e) => handleInputChange('kilos', e.target.value)} className={inputClasses} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Clock className="w-4 h-4 text-cyan-400" />Tiempo</label>
                                    <button
                                        onClick={() => setIsTimePickerOpen(true)}
                                        className={`${inputClasses} text-left`}
                                    >
                                        {formData.tiempo ? formData.tiempo : <span className="text-gray-400">hh:mm:ss</span>}
                                    </button>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Flame className="w-4 h-4 text-cyan-400" />Calorías</label>
                                    <input type="text" inputMode="numeric" value={formData.calorias} onChange={(e) => handleInputChange('calorias', e.target.value)} placeholder="Kcal" className={inputClasses} />
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <button
                                onClick={() => setIsNotesVisible(prev => !prev)}
                                className="w-full flex items-center justify-between mb-1 text-left p-1 -m-1 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                aria-expanded={isNotesVisible}
                                aria-controls="exercise-notes-textarea"
                            >
                                <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                    <NotebookText className="w-4 h-4 text-cyan-400" />
                                    Notas
                                </span>
                                <span className="p-1 text-cyan-400">
                                    {isNotesVisible ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                </span>
                            </button>
                            {isNotesVisible && (
                                <textarea 
                                  id="exercise-notes-textarea"
                                  value={formData.notes || ''} 
                                  onChange={(e) => handleInputChange('notes', e.target.value)} 
                                  placeholder="Añadir notas..." 
                                  className={`${inputClasses} h-24 resize-none animate-fadeIn`}
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end items-center flex-shrink-0">
                        <div className="flex gap-4">
                            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition">Cancelar</button>
                            <button onClick={handleSaveClick} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

interface DailyLogCardProps {
    log: ExerciseLog;
    dayName: string;
    isExpanded: boolean;
    allLogsForComparison: ExerciseLog[];
    onToggleExpand: () => void;
    onDelete: () => void;
    onEdit: () => void;
    onSaveToSummary: () => void;
    onAddMedia: () => void;
    onViewMedia: (media: ExerciseMedia[], index: number) => void;
    onDeleteMedia: (index: number) => void;
}

const DailyLogCard: React.FC<DailyLogCardProps> = ({
    log,
    dayName,
    isExpanded,
    allLogsForComparison,
    onToggleExpand,
    onDelete,
    onEdit,
    onSaveToSummary,
    onAddMedia,
    onViewMedia,
    onDeleteMedia
}) => {
    const { sedeColorStyles } = useAppContext();

    const comparisons = useExerciseComparison(log, allLogsForComparison);
    const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

    const isNadaTab = dayName === 'Día 5';
    const isSaved = log.isSavedToSummary;
    const hasMedia = log.media && log.media.length > 0;
    const hasNotes = log.notes && log.notes.trim() !== '';

    return (
        <div className="bg-black/20 rounded-xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50">
            {/* HEADER */}
            <div className="p-3 sm:p-4 cursor-pointer" onClick={onToggleExpand}>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1.5 text-xs text-white min-w-0">
                                <CalendarDays className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                <span className="truncate">{formatFullDisplayDate(log.date)}</span>
                            </div>
                            <span className={`${getSedeColor(log.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0`}>
                                <MapPin className="w-3 h-3"/>
                                {log.sede}
                            </span>
                        </div>
                        <p className="font-bold text-white truncate text-lg">{log.exerciseName || 'Sin nombre'}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
                        <span className="p-1 text-cyan-400" aria-label={isExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}>
                            <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-500/10" aria-label="Eliminar registro">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* COLLAPSIBLE BODY */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${!isExpanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="overflow-hidden">
                     <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <div 
                            className="cursor-pointer rounded-lg hover:bg-white/5 transition-colors -m-3 p-3"
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            role="button"
                            aria-label="Editar registro"
                        >
                            <div className="pt-4 border-t border-gray-700/50">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0 flex-grow flex justify-center items-center">
                                        <div className="flex justify-center flex-wrap gap-x-4 gap-y-3 text-sm">
                                          {isNadaTab ? (
                                              <>
                                                  <MetricItem label="Tiempo" value={log.tiempo} unit="Min" Icon={Clock} comparison={comparisons.tiempo} />
                                                  <MetricItem label="Velocidad" value={log.series} unit="Km/h" Icon={Zap} comparison={comparisons.series} />
                                                  <MetricItem label="Distancia" value={log.reps} unit={log.distanceUnit ? (log.distanceUnit === 'KM' ? 'Km' : 'm') : ''} Icon={Gauge} comparison={comparisons.reps} />
                                                  <MetricItem label="Calorías" value={log.calorias} unit="Kcal" Icon={Flame} comparison={comparisons.calorias} />
                                                  <MetricItem label="Inclinación" value={log.kilos} unit="%" Icon={TrendingUp} comparison={comparisons.kilos} />
                                              </>
                                          ) : (
                                              <>
                                                  <MetricItem label="Series" value={log.series} unit="" Icon={BarChart4} comparison={comparisons.series} />
                                                  <MetricItem label="Reps" value={log.reps} unit="" Icon={Repeat} comparison={comparisons.reps} />
                                                  <MetricItem label="Kilos" value={log.kilos} unit="kgs" Icon={Weight} comparison={comparisons.kilos} />
                                                  <MetricItem label="Tiempo" value={log.tiempo} unit="Min" Icon={Clock} comparison={comparisons.tiempo} />
                                                  <MetricItem label="Calorías" value={log.calorias} unit="Kcal" Icon={Flame} comparison={comparisons.calorias} />
                                              </>
                                          )}
                                        </div>
                                    </div>
                                    {hasMedia && (
                                        <div className="w-32 sm:w-40 md:w-56 flex-shrink-0 grid grid-cols-2 gap-2">
                                            {log.media.map((mediaItem, index) => (
                                                <div key={index} className="relative group w-full aspect-square rounded-lg overflow-hidden">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onViewMedia(log.media, index); }}
                                                        className="w-full h-full"
                                                    >
                                                        {mediaItem.type === 'image' ? (
                                                        <img src={mediaItem.dataUrl} alt={`Media ${index + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                        ) : (
                                                        <video src={mediaItem.dataUrl} muted loop autoPlay playsInline className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteMedia(index);
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 z-10 transition-opacity opacity-0 group-hover:opacity-100"
                                                        aria-label="Eliminar media"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {hasNotes && (
                                <div className="mt-3 pt-3 border-t border-gray-700/50">
                                    <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                                        <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                        <p className="whitespace-pre-wrap">{log.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-gray-700/50">
                            {isSaved ? (
                                <div className="flex items-center justify-center w-9 h-9 bg-green-600 text-white rounded-full" title="Guardado en resumen">
                                    <Check className="w-5 h-5" />
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSaveToSummary(); }}
                                    className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1.5 px-3 rounded-lg transition-transform transform hover:scale-105 btn-active text-sm"
                                    aria-label="Guardar en resumen"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Guardar</span>
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAddMedia(); }}
                                className="p-2 text-gray-400 hover:text-orange-400 transition-colors rounded-full hover:bg-orange-500/10"
                                aria-label="Añadir media"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};


const ExerciseTracker: React.FC<{ dayName: string }> = ({ dayName }) => {
    const { dailyLogs, summaryLogs, addDailyLog, updateDailyLog, removeDailyLog, removeDailyLogMedia, saveLogToSummary, workoutDays, toggleExerciseLogExpansion, exerciseNames, removeExerciseName, todaysDateISO } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<ExerciseLog | null>(null);
    const [logToDelete, setLogToDelete] = useState<ExerciseLog | null>(null);
    const [lightboxMedia, setLightboxMedia] = useState<{ allMedia: ExerciseMedia[]; startIndex: number; logId: string; } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logToUpdateMedia, setLogToUpdateMedia] = useState<ExerciseLog | null>(null);

    const allLogsForComparison = useMemo(() => {
        const logMap = new Map<string, ExerciseLog>();
        summaryLogs.forEach(log => logMap.set(log.id, log));
        dailyLogs.forEach(log => {
            if (!logMap.has(log.id)) {
                logMap.set(log.id, log);
            }
        });
        return Array.from(logMap.values());
    }, [dailyLogs, summaryLogs]);

    const dayLogs = useMemo(() => {
        return dailyLogs
            .filter(log => log.day === dayName)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dailyLogs, dayName]);

    const expandedLogsForDay = useMemo(() => workoutDays[dayName]?.expandedLogs || [], [workoutDays, dayName]);

    const handleSave = (data: Omit<ExerciseLog, 'id' | 'day' | 'sede'>) => {
        if (editingLog) {
            updateDailyLog(editingLog.id, data);
        } else {
            const newLogId = crypto.randomUUID();
            const newLog: Omit<ExerciseLog, 'sede'> = {
                ...data,
                id: newLogId,
                day: dayName,
                isSavedToSummary: false,
            };
            addDailyLog(newLog);
            toggleExerciseLogExpansion(dayName, newLogId, 'open');
        }
        setIsAddModalOpen(false);
        setEditingLog(null);
    };

    const handleConfirmDelete = () => {
        if (logToDelete) {
            removeDailyLog(logToDelete.id);
            setLogToDelete(null);
        }
    };
    
    const handleDeleteMedia = (logId: string, mediaIndex: number) => {
        removeDailyLogMedia(logId, mediaIndex);
        setLightboxMedia(null);
    };
    
    const handleCameraClick = (log: ExerciseLog) => {
        setLogToUpdateMedia(log);
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && logToUpdateMedia) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const mediaType = file.type.startsWith('image') ? 'image' : 'video';
                const newMedia: ExerciseMedia = { type: mediaType, dataUrl };
                
                const updatedMedia = [...logToUpdateMedia.media, newMedia];
                updateDailyLog(logToUpdateMedia.id, { media: updatedMedia });
                setLogToUpdateMedia(null);
            };
            reader.readAsDataURL(file);
        }
        if(event.target) {
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-4 pb-24">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*" 
            />
            {lightboxMedia && <MediaLightbox 
                allMedia={lightboxMedia.allMedia}
                startIndex={lightboxMedia.startIndex}
                onClose={() => setLightboxMedia(null)}
                onDelete={(indexToDelete) => handleDeleteMedia(lightboxMedia.logId, indexToDelete)}
            />}
            <ConfirmationModal isOpen={!!logToDelete} onClose={() => setLogToDelete(null)} onConfirm={handleConfirmDelete} title="Eliminar Registro" message={`Seguro que quieres eliminar el registro de ${logToDelete?.exerciseName || 'sin nombre'}? Esta acción es permanente.`} />
            <ExerciseLogModal 
                isOpen={isAddModalOpen || !!editingLog} 
                onClose={() => { setIsAddModalOpen(false); setEditingLog(null); }} 
                onSave={handleSave} 
                dayName={dayName}
                initialData={editingLog}
                exerciseNames={exerciseNames}
                removeExerciseName={removeExerciseName}
            />

            {dayLogs.length === 0 ? (
                 <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full text-center p-12 bg-gray-800/50 rounded-2xl border-2 border-dashed border-white/10 animate-fadeIn transition-all duration-300 hover:bg-gray-700/50 hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                >
                    <History className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">Sin registros</h2>
                    <p className="text-gray-400 mt-2">Aún no has registrado ningún ejercicio para este día. ¡Haz clic para empezar!</p>
                </button>
            ) : (
                dayLogs.map((log, index) => (
                    <div key={log.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-zoomInPop opacity-0">
                        <DailyLogCard
                            log={log}
                            dayName={dayName}
                            allLogsForComparison={allLogsForComparison}
                            isExpanded={expandedLogsForDay.includes(log.id)}
                            onToggleExpand={() => toggleExerciseLogExpansion(dayName, log.id)}
                            onDelete={() => setLogToDelete(log)}
                            onEdit={() => setEditingLog(log)}
                            onSaveToSummary={() => saveLogToSummary(log.id)}
                            onAddMedia={() => handleCameraClick(log)}
                            onViewMedia={(media, startIndex) => setLightboxMedia({ allMedia: media, startIndex, logId: log.id })}
                            onDeleteMedia={(mediaIndex) => removeDailyLogMedia(log.id, mediaIndex)}
                        />
                    </div>
                ))
            )}

            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 w-16 h-16 flex items-center justify-center z-20"
                aria-label="Añadir nuevo ejercicio"
            >
                <PlusCircle className="w-8 h-8" />
            </button>
        </div>
    );
};

export default ExerciseTracker;
