

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, History, Footprints, Shield, Hand, Shirt, X, NotebookText, Download, Upload, FileUp, Dumbbell, CalendarDays, Weight, Repeat, MapPin, ChevronDown, Calendar, Save, BarChart4, ChevronLeft, ChevronRight, Clock, Flame, Zap, Gauge, TrendingUp, HeartPulse, ArrowUp, ArrowDown, Award } from 'lucide-react';
import type { ExerciseLog, ExerciseMedia } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import ExportModal from '../components/ExportModal';

// Local Lightbox component to avoid creating new file
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

const dayConfig: { [key: string]: { title: string; icon: React.ElementType } } = {
  'Día 1': { title: 'Pecho y Bíceps', icon: Shirt },
  'Día 2': { title: 'Pierna y Glúteo', icon: Footprints },
  'Día 3': { title: 'Hombro y Espalda', icon: Shield },
  'Día 4': { title: 'Tríceps y Antebrazo', icon: Hand },
  'Día 5': { title: 'Combinados', icon: HeartPulse },
};


// --- HELPERS ---

function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;
  const date = new Date(dateString + 'T00:00:00');
  if (!isNaN(date.getTime())) return date;
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

const formatFullDisplayDate = (dateString: string): string => {
    const date = parseCustomDate(dateString);
    if (date) {
      const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
      const day = date.getDate();
      const month = date.toLocaleDateString('es-ES', { month: 'long' });
      const year = date.getFullYear();
      
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      return `${capitalize(weekday)}, ${day} de ${capitalize(month)} de ${year}`;
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
  value?: string;
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

type DeletionTarget = {
  type: 'exercise' | 'media' | 'session';
  id: string; // Log ID, Session Date
  mediaIndex?: number;
  name?: string;
  sessionLogs?: ExerciseLog[]; // For deleting a whole session
} | null;

// --- SUMMARY COMPONENT ---

const Summary: React.FC = () => {
  const { 
    summaryLogs, dailyLogs, removeSummaryLog, removeSummaryLogMedia,
    exportData, importData, exportSummaryData,
    exportDataAsText, exportSummaryDataAsText,
    downloadJSON, downloadTXT,
    sedeColorStyles,
    summaryCollapsedDays, summaryCollapsedExercises,
    toggleSummaryDayCollapse, toggleSummaryExerciseCollapse,
    todaysDateISO,
  } = useAppContext();
  const [lightboxMedia, setLightboxMedia] = useState<{ allMedia: ExerciseMedia[]; startIndex: number; logId: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItemForCard, setSelectedItemForCard] = useState<ExerciseLog | null>(null);
  const [deletionTarget, setDeletionTarget] = useState<DeletionTarget>(null);
  const [exportOptions, setExportOptions] = useState<{ 
    onExportJson: () => void; 
    onExportText: () => void; 
    title: string; 
  } | null>(null);

  // FIX: Explicitly type the useMemo to ensure correct type inference for allLogsForComparison.
  const allLogsForComparison = useMemo<ExerciseLog[]>(() => {
    const logMap = new Map<string, ExerciseLog>();
    summaryLogs.forEach(log => logMap.set(log.id, log));
    dailyLogs.forEach(log => logMap.set(log.id, log));
    return Array.from(logMap.values());
  }, [dailyLogs, summaryLogs]);

  const { todaySession, pastSessions } = useMemo(() => {
    const sessions: Record<string, { date: string; logs: ExerciseLog[]; totalCalories: number }> = {};

    summaryLogs.forEach(log => {
        const date = log.date;
        if (!date) return;
        if (!sessions[date]) {
            sessions[date] = { date, logs: [], totalCalories: 0 };
        }
        sessions[date].logs.push(log);
    });

    Object.values(sessions).forEach(session => {
        session.totalCalories = session.logs.reduce((total, log) => total + (parseMetric(log.calorias) || 0), 0);
    });

    const sortedSessions = Object.values(sessions).sort((a, b) => {
        const dateA = parseCustomDate(a.date);
        const dateB = parseCustomDate(b.date);
        if (dateA && dateB) return dateB.getTime() - dateA.getTime();
        return 0;
    });
    
    const today = sortedSessions.find(s => s.date === todaysDateISO);
    const past = sortedSessions.filter(s => s.date !== todaysDateISO);
    
    return { todaySession: today, pastSessions: past };
  }, [summaryLogs, todaysDateISO]);

  const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

  const formatExerciseLogAsText = (log: ExerciseLog): string => {
    const isNadaTab = log.day === 'Día 5';
    let metricsLine = '';

    if (isNadaTab) {
        const parts = [];
        if (log.series) parts.push(`Velocidad: ${log.series}`);
        if (log.reps) parts.push(`Distancia: ${log.reps}${log.distanceUnit ? ` ${log.distanceUnit === 'KM' ? 'Kilómetros' : 'Metros'}` : ''}`);
        if (log.kilos) parts.push(`Inclinación: ${log.kilos}`);
        metricsLine = '  - ' + (parts.length > 0 ? parts.join(', ') : '-');
    } else {
        metricsLine = `  - ${log.series || '-'} series x ${log.reps || '-'} reps @ ${log.kilos || '-'} kgs`;
    }

    const lines = [
      `${log.exerciseName.toUpperCase()} - ${formatDisplayDate(log.date)} [Sede: ${log.sede}]`,
      metricsLine,
    ];
    if (log.tiempo) lines.push(`  - Tiempo: ${log.tiempo} Min`);
    if (log.calorias) lines.push(`  - Calorías: ${log.calorias} Kcal`);
    if (log.notes) lines.push(`  - Notas: ${log.notes}`);
    return lines.join('\n');
  };
  
  const generateSessionText = (logs: ExerciseLog[], date: string, totalCalories: number) => {
    let text = `Resumen de Sesión - ${formatFullDisplayDate(date)}\n`;
    text += `Total Calorías: ${totalCalories.toLocaleString('es-ES')} Kcal\n`;
    text += '====================================\n\n';
    
    logs.forEach(log => {
      text += formatExerciseLogAsText(log) + '\n\n';
    });
    return text;
  }

  const ShareableCardModal: React.FC<{ item: ExerciseLog | null; onClose: () => void; }> = ({ item, onClose }) => {
    if (!item) return null;
    const isNadaTab = item.day === 'Día 5';
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
          <div className="relative bg-gradient-to-br from-gray-900 to-black p-8 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 w-full max-w-md m-4 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition" aria-label="Cerrar"><X className="w-6 h-6" /></button>
            <div className="flex items-center gap-4 mb-6">
               <div className="p-3 bg-cyan-500/20 rounded-full"><Dumbbell className="w-8 h-8 text-cyan-400" /></div>
               <div>
                  <h2 className="text-2xl font-bold text-white"><span className="uppercase">{item.exerciseName}</span></h2>
                  <div className="flex items-center gap-2">
                      <p className="text-gray-400">{formatDisplayDate(item.date)}</p>
                      <span className={`${getSedeColor(item.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}><MapPin className="w-3 h-3"/>{item.sede}</span>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
                {item.tiempo?.trim() && <div className="flex items-center gap-3"><Clock className="w-7 h-7 text-cyan-400" /><div><p className="text-sm text-gray-400">Tiempo</p><p className="text-xl font-semibold text-white">{item.tiempo} Min</p></div></div>}
                {item.series?.trim() && <div className="flex items-center gap-3">{isNadaTab ? <Zap className="w-7 h-7 text-cyan-400" /> : <BarChart4 className="w-7 h-7 text-cyan-400" />}<div><p className="text-sm text-gray-400">{isNadaTab ? 'Velocidad' : 'Series'}</p><p className="text-xl font-semibold text-white">{item.series}{isNadaTab ? ' Km/h' : ''}</p></div></div>}
                {item.reps?.trim() && <div className="flex items-center gap-3">{isNadaTab ? <Gauge className="w-7 h-7 text-cyan-400" /> : <Repeat className="w-7 h-7 text-cyan-400" />}<div><p className="text-sm text-gray-400">{isNadaTab ? 'Distancia' : 'Reps'}</p><p className="text-xl font-semibold text-white">{item.reps}{isNadaTab && item.distanceUnit ? ` ${ item.distanceUnit === 'KM' ? 'Kilómetros' : 'Metros'}` : ''}</p></div></div>}
                {item.calorias?.trim() && <div className="flex items-center gap-3"><Flame className="w-7 h-7 text-cyan-400" /><div><p className="text-sm text-gray-400">Calorías</p><p className="text-xl font-semibold text-white">{item.calorias} Kcal</p></div></div>}
                {item.kilos?.trim() && <div className="flex items-center gap-3">{isNadaTab ? <TrendingUp className="w-7 h-7 text-cyan-400" /> : <Weight className="w-7 h-7 text-cyan-400" />}<div><p className="text-sm text-gray-400">{isNadaTab ? 'Inclinación' : 'Kilos'}</p><p className="text-xl font-semibold text-white">{item.kilos}{isNadaTab ? ' %' : ' kgs'}</p></div></div>}
            </div>
            {item.notes && <div className="mb-6"><h3 className="font-semibold text-cyan-400 mb-2 flex items-center gap-2"><NotebookText className="w-5 h-5"/>Notas</h3><p className="text-gray-300 bg-black/30 p-3 rounded-lg border-l-2 border-cyan-500/50 whitespace-pre-wrap italic">{item.notes}</p></div>}
            <div className="text-center text-gray-500 font-bold tracking-widest text-sm uppercase mt-8">PROGRESIÓN DE CARGA</div>
          </div>
      </div>
    );
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          importData(text);
          alert('¡Datos importados con éxito!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'El archivo de importación no es válido o está corrupto.';
          alert(`Error al importar: ${errorMessage}`);
        }
      };
      reader.readAsText(file);
    }
    if (event.target) event.target.value = '';
  };
  
  const handleCloseLightbox = () => setLightboxMedia(null);
  const baseButtonClass = "flex items-center gap-1.5 text-xs font-semibold py-2 px-2 sm:px-3 rounded-lg text-white shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 btn-active";
  
  const handleConfirmDelete = () => {
    if (!deletionTarget) return;
    switch (deletionTarget.type) {
      case 'exercise':
        removeSummaryLog(deletionTarget.id);
        break;
      case 'media':
        if (deletionTarget.mediaIndex !== undefined) {
          removeSummaryLogMedia(deletionTarget.id, deletionTarget.mediaIndex);
          handleCloseLightbox();
        }
        break;
      case 'session':
        deletionTarget.sessionLogs?.forEach(log => removeSummaryLog(log.id));
        break;
    }
    setDeletionTarget(null);
  };
  
  const LogDetails = ({ log, allLogs }: { log: ExerciseLog; allLogs: ExerciseLog[] }) => {
    const comparisons = useExerciseComparison(log, allLogs);
    const isNadaTab = log.day === 'Día 5';

    return (
      <div className="py-3 sm:py-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-2">
                <span className={`${getSedeColor(log.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0`}>
                    <MapPin className="w-3 h-3"/>
                    {log.sede}
                </span>
            </div>
            <div className="flex justify-between items-start gap-4">
                <button onClick={(e) => { e.stopPropagation(); setSelectedItemForCard(log); }} className="min-w-0 flex-grow flex justify-center items-center rounded-lg hover:bg-white/5 p-2 -m-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" aria-label="Ver tarjeta de métricas">
                  <div className="flex justify-center flex-wrap gap-x-4 gap-y-3 text-sm">
                    {isNadaTab ? (<><MetricItem label="Tiempo" value={log.tiempo} unit="Min" Icon={Clock} comparison={comparisons.tiempo} /><MetricItem label="Velocidad" value={log.series} unit="Km/h" Icon={Zap} comparison={comparisons.series} /><MetricItem label="Distancia" value={log.reps} unit={log.distanceUnit ? (log.distanceUnit === 'KM' ? 'Km' : 'm') : ''} Icon={Gauge} comparison={comparisons.reps} /><MetricItem label="Calorías" value={log.calorias} unit="Kcal" Icon={Flame} comparison={comparisons.calorias} /><MetricItem label="Inclinación" value={log.kilos} unit="%" Icon={TrendingUp} comparison={comparisons.kilos} /></>) : 
                    (<><MetricItem label="Series" value={log.series} unit="" Icon={BarChart4} comparison={comparisons.series} /><MetricItem label="Reps" value={log.reps} unit="" Icon={Repeat} comparison={comparisons.reps} /><MetricItem label="Kilos" value={log.kilos} unit="kgs" Icon={Weight} comparison={comparisons.kilos} /><MetricItem label="Tiempo" value={log.tiempo} unit="Min" Icon={Clock} comparison={comparisons.tiempo} /><MetricItem label="Calorías" value={log.calorias} unit="Kcal" Icon={Flame} comparison={comparisons.calorias} /></>)}
                  </div>
                </button>
                {log.media && log.media.length > 0 && (
                  <div className="w-32 sm:w-40 md:w-56 flex-shrink-0 grid grid-cols-2 gap-2">
                    {log.media.map((mediaItem, index) => (
                      <div key={index} className="relative group w-full aspect-square rounded-lg overflow-hidden">
                        <button onClick={(e) => { e.stopPropagation(); setLightboxMedia({ allMedia: log.media, startIndex: index, logId: log.id }); }} className="w-full h-full">
                            {mediaItem.type === 'image' ? <img src={mediaItem.dataUrl} alt={`Media ${index + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" /> : <video src={mediaItem.dataUrl} muted loop autoPlay playsInline className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletionTarget({ type: 'media', id: log.id, mediaIndex: index, name: 'este archivo' }); }} className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 z-10 transition-opacity opacity-0 group-hover:opacity-100" aria-label="Eliminar media"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {log.notes && <div className="mt-3 pt-3 border-t border-gray-700/50"><div className="flex items-start gap-2 text-gray-300 text-sm italic"><NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" /><p className="whitespace-pre-wrap">{log.notes}</p></div></div>}
          </div>
          <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 pl-2">
              <button onClick={(e) => { e.stopPropagation(); setExportOptions({ title: `Exportar ${log.exerciseName}`, onExportJson: () => downloadJSON({ summaryLogs: [log] }, `ejercicio-${log.exerciseName.replace(/\s+/g, '-')}-${log.date}.json`), onExportText: () => downloadTXT(formatExerciseLogAsText(log), `ejercicio-${log.exerciseName.replace(/\s+/g, '-')}-${log.date}.txt`) }); }} className="p-2 text-gray-400 hover:text-cyan-500 transition rounded-full hover:bg-cyan-500/10" aria-label={`Exportar registro`}><Save className="w-5 h-5" /></button>
              <button onClick={(e) => { e.stopPropagation(); setDeletionTarget({ type: 'exercise', id: log.id, name: `el registro de ${log.exerciseName}` }); }} className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-500/10" aria-label={`Quitar del resumen`}><Trash2 className="w-5 h-5" /></button>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {lightboxMedia && <MediaLightbox allMedia={lightboxMedia.allMedia} startIndex={lightboxMedia.startIndex} onClose={handleCloseLightbox} onDelete={(indexToDelete) => setDeletionTarget({ type: 'media', id: lightboxMedia.logId, mediaIndex: indexToDelete, name: 'este archivo' })} />}
      <ConfirmationModal isOpen={!!deletionTarget} onClose={() => setDeletionTarget(null)} onConfirm={handleConfirmDelete} title={`Eliminar ${deletionTarget?.type === 'session' ? 'Sesión' : 'Registro'}`} message={`¿Estás seguro de que quieres eliminar ${deletionTarget?.name ?? 'este elemento'}? Esta acción es irreversible.`} />
      <ShareableCardModal item={selectedItemForCard} onClose={() => setSelectedItemForCard(null)} />
      <ExportModal isOpen={!!exportOptions} onClose={() => setExportOptions(null)} title={exportOptions?.title || 'Elige tu formato'} onExportJson={() => { exportOptions?.onExportJson(); setExportOptions(null); }} onExportText={() => { exportOptions?.onExportText(); setExportOptions(null); }} />

      {todaySession && todaySession.totalCalories > 0 && (
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg p-4 flex items-center justify-center gap-4 text-center text-white shadow-lg shadow-orange-500/20 animate-fadeInUp">
              <Flame className="w-10 h-10 animate-pulse-slow flex-shrink-0" />
              <div>
                  <p className="text-lg font-semibold">Hoy has quemado un total de</p>
                  <p className="text-4xl font-extrabold tracking-tight">{todaySession.totalCalories.toLocaleString('es-ES')} Kcal</p>
              </div>
          </div>
      )}
      
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4"><div className="flex justify-center gap-2"><button onClick={() => setExportOptions({ title: 'Exportar Resumen', onExportJson: exportSummaryData, onExportText: exportSummaryDataAsText })} className={`${baseButtonClass} bg-gradient-to-r from-indigo-500 to-purple-500 focus:ring-indigo-500`} aria-label="Exportar resumen de datos"><FileUp className="w-4 h-4" /><span>Exportar</span></button><button onClick={handleImportClick} className={`${baseButtonClass} bg-gradient-to-r from-green-500 to-green-600 focus:ring-green-500`} aria-label="Importar datos desde un archivo"><Upload className="w-4 h-4" /><span>Importar</span></button><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" /><button onClick={() => setExportOptions({ title: 'Exportar Todo', onExportJson: exportData, onExportText: exportDataAsText })} className={`${baseButtonClass} bg-gradient-to-r from-cyan-500 to-blue-500 focus:ring-cyan-500`} aria-label="Exportar todos los datos"><Download className="w-4 h-4" /><span>Exportar Todo</span></button></div></div>

      {summaryLogs.length === 0 ? (
         <div className="bg-gradient-to-br from-gray-900 to-gray-800/50 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center animate-zoomInPop"><History className="w-16 h-16 mx-auto text-cyan-400 mb-4 animate-pulse-slow" /><h2 className="text-3xl font-extrabold mb-4 text-cyan-400 tracking-tight">El Viaje Comienza Aquí</h2><p className="text-gray-300 max-w-md mx-auto">Tu historial está listo para ser escrito. Cada registro es un paso hacia tu mejor versión. ¡Vamos a empezar!</p></div>
      ) : (
        [...(todaySession ? [todaySession] : []), ...pastSessions].map((session, sessionIndex) => {
          const logsByDay = session.logs.reduce((acc, log) => {
            const dayName = log.day || 'Otros';
            if (!acc[dayName]) acc[dayName] = [];
            acc[dayName].push(log);
            return acc;
          }, {} as Record<string, ExerciseLog[]>);

          const dayOrder = ['Día 5', 'Día 1', 'Día 2', 'Día 3', 'Día 4'];
          const sortedDayKeys = Object.keys(logsByDay).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
          const isToday = session.date === todaysDateISO;

          return (
            <div key={session.date} style={{ animationDelay: `${sessionIndex * 150}ms` }} className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-zoomInPop opacity-0">
              <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-800/40">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-3 truncate">
                  <Calendar className="w-6 h-6 text-cyan-400 flex-shrink-0"/>
                  <span className="truncate">{isToday ? 'Entrenamiento de Hoy' : formatFullDisplayDate(session.date)}</span>
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExportOptions({ title: `Exportar Sesión`, onExportJson: () => downloadJSON({ summaryLogs: session.logs }, `sesion-${session.date}.json`), onExportText: () => downloadTXT(generateSessionText(session.logs, session.date, session.totalCalories), `sesion-${session.date}.txt`) })} className="p-2 text-gray-400 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full transition-colors" aria-label={`Exportar sesión`}><Save className="w-5 h-5" /></button>
                  <button onClick={() => setDeletionTarget({ type: 'session', id: session.date, name: `la sesión del ${formatFullDisplayDate(session.date)}`, sessionLogs: session.logs })} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors" aria-label={`Eliminar sesión`}><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {!isToday && session.totalCalories > 0 && (
                    <div className="bg-gray-800/60 border border-white/10 rounded-lg p-4 flex items-center justify-center gap-4 text-center text-white">
                        <Flame className="w-8 h-8 text-orange-400 flex-shrink-0" />
                        <div>
                            <p className="text-base font-semibold text-gray-300">Quemaste un total de</p>
                            <p className="text-2xl font-bold">{session.totalCalories.toLocaleString('es-ES')} Kcal</p>
                        </div>
                    </div>
                )}
                
                {sortedDayKeys.map(dayName => {
                  const dayInfo = dayConfig[dayName];
                  const dayLogs = logsByDay[dayName];
                  if (!dayInfo || dayLogs.length === 0) return null;

                  const dayKey = `${session.date}-${dayName}`;
                  const isDayExpanded = !summaryCollapsedDays.includes(dayKey);
                  const Icon = dayInfo.icon;

                  const exercisesByName = dayLogs.reduce((acc, log) => {
                    const name = log.exerciseName || 'Sin Nombre';
                    if (!acc[name]) acc[name] = [];
                    acc[name].push(log);
                    return acc;
                  }, {} as Record<string, ExerciseLog[]>);

                  return (
                    <div key={dayName}>
                       <button onClick={() => toggleSummaryDayCollapse(dayKey)} className="w-full flex justify-between items-center group gap-4 p-3 -m-3 rounded-lg hover:bg-white/5 transition-colors" aria-expanded={isDayExpanded}>
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-cyan-400 flex items-center justify-center gap-3 tracking-tight">
                            <span className="bg-cyan-900/50 p-2 rounded-full flex-shrink-0"><Icon className="w-6 sm:w-7 h-6 sm:h-7" /></span>
                            <span className="truncate">{dayInfo.title}</span>
                          </h3>
                          <ChevronDown className={`w-6 h-6 text-cyan-400 transition-transform duration-300 ${isDayExpanded ? 'rotate-180' : ''}`} />
                       </button>
                       <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isDayExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                         <div className="overflow-hidden">
                           <div className="pt-4 space-y-4">
                             {/* FIX: Add explicit type for map callback parameters to fix type inference issues. */}
                             {Object.entries(exercisesByName).map(([exerciseName, logs]: [string, ExerciseLog[]]) => {
                               const groupKey = `${dayKey}-${exerciseName}`;
                               const isGroupExpanded = !summaryCollapsedExercises.includes(groupKey);
                               return (
                                 <div key={groupKey} className="bg-black/20 rounded-xl border border-white/10 transition-all duration-300 hover:-translate-y-px hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-400/50">
                                   <button onClick={() => toggleSummaryExerciseCollapse(groupKey)} className="w-full p-3 sm:p-4 flex justify-between items-center text-left">
                                     <p className="font-bold text-white text-lg">{exerciseName}</p>
                                     <div className="flex items-center gap-2"><span className="text-xs font-semibold bg-gray-700 text-cyan-300 rounded-full px-2 py-0.5">{logs.length} {logs.length > 1 ? 'registros' : 'registro'}</span><ChevronDown className={`w-6 h-6 text-cyan-400 transition-transform duration-300 ${isGroupExpanded ? 'rotate-180' : ''}`} /></div>
                                   </button>
                                   <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${!isGroupExpanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                                     <div className="overflow-hidden"><div className="px-3 sm:px-4 pb-1 divide-y divide-gray-700/50">{logs.map((log: ExerciseLog) => <LogDetails key={log.id} log={log} allLogs={allLogsForComparison} />)}</div></div>
                                   </div>
                                 </div>
                               )
                             })}
                           </div>
                         </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  );
};

export default Summary;
