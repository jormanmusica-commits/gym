

import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart4, History, Weight, Repeat, MapPin, NotebookText, Clock, Flame, Zap, Gauge, TrendingUp, Award, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import type { ExerciseLog } from '../types';

// --- PERFORMANCE HELPER FUNCTIONS (Consistent with Summary page) ---
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

const formatFullDisplayDate = (dateString: string): string => {
    const date = parseCustomDate(dateString);
    if (date) {
      const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
      const day = date.getDate();
      const month = date.toLocaleDateString('es-ES', { month: 'long' });
      const year = date.getFullYear();
      
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      return `${capitalize(weekday)} ${day} de ${capitalize(month)} de ${year}`;
    }
    return dateString;
};

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

const getPerformanceData = (allLogs: ExerciseLog[]) => {
    if (!allLogs || allLogs.length === 0) {
        return { lastLog: null, personalRecord: null, comparison: {}, isNewRecord: false };
    }

    const sortedLogs = [...allLogs].sort((a, b) => {
        const dateA = parseCustomDate(a.date);
        const dateB = parseCustomDate(b.date);
        if (dateA && dateB) return dateB.getTime() - dateA.getTime();
        return 0;
    });

    const lastLog = sortedLogs[0];
    if (!lastLog) {
        return { lastLog: null, personalRecord: null, comparison: {}, isNewRecord: false };
    }

    // --- Find Previous Log for Comparison ---
    const previousLog = sortedLogs.find(log =>
        log.id !== lastLog.id &&
        log.exerciseName === lastLog.exerciseName &&
        log.sede === lastLog.sede
    );
    
    const comparison: { [key in keyof ExerciseLog]?: ComparisonStatus } = {};
    if (previousLog) {
        const metrics: (keyof ExerciseLog)[] = ['series', 'reps', 'kilos', 'tiempo', 'calorias'];
        metrics.forEach(metric => {
            const currentVal = metric === 'tiempo' ? parseTimeToSeconds(lastLog.tiempo) : parseMetric(lastLog[metric] as string);
            const prevVal = metric === 'tiempo' ? parseTimeToSeconds(previousLog.tiempo) : parseMetric(previousLog[metric] as string);
            if (currentVal !== null && prevVal !== null) {
                if (currentVal > prevVal) comparison[metric] = 'increase';
                else if (currentVal < prevVal) comparison[metric] = 'decrease';
                else comparison[metric] = 'same';
            }
        });
    }

    // --- Find Personal Record ---
    const exerciseLogs = allLogs.filter(log => log.exerciseName === lastLog.exerciseName && log.sede === lastLog.sede);
    
    if (exerciseLogs.length === 0) {
        // This case should not be reached if lastLog exists, but as a safeguard.
        return { lastLog, personalRecord: lastLog, comparison, isNewRecord: true };
    }

    const isNada = lastLog.day === 'Día 5';
    
    const personalRecord = exerciseLogs.reduce((best, current) => {
        if (isNada) { // Cardio PR Logic: distance > time > calories
            // 1. Compare distance (normalized to meters)
            const bestDist = (parseMetric(best.reps) || 0) * (best.distanceUnit === 'KM' ? 1000 : 1);
            const currentDist = (parseMetric(current.reps) || 0) * (current.distanceUnit === 'KM' ? 1000 : 1);
            if (currentDist > bestDist) return current;
            if (currentDist < bestDist) return best;
            
            // 2. If distance is equal, compare time (normalized to seconds)
            const bestTime = parseTimeToSeconds(best.tiempo) || 0;
            const currentTime = parseTimeToSeconds(current.tiempo) || 0;
            if (currentTime > bestTime) return current;
            if (currentTime < bestTime) return best;

            // 3. If time is equal, compare calories
            const bestCals = parseMetric(best.calorias) || 0;
            const currentCals = parseMetric(current.calorias) || 0;
            if (currentCals > bestCals) return current;
            if (currentCals < bestCals) return best;

        } else { // Weightlifting PR Logic: kilos > reps
            // 1. Compare kilos
            const bestKilos = parseMetric(best.kilos) || 0;
            const currentKilos = parseMetric(current.kilos) || 0;
            if (currentKilos > bestKilos) return current;
            if (currentKilos < bestKilos) return best;

            // 2. If kilos are equal, compare reps
            const bestReps = parseMetric(best.reps) || 0;
            const currentReps = parseMetric(current.reps) || 0;
            if (currentReps > bestReps) return current;
            if (currentReps < bestReps) return best;
        }

        // TIE-BREAKER: If all metrics are equal, the older log is the record for stability.
        const bestDate = parseCustomDate(best.date)?.getTime() || 0;
        const currentDate = parseCustomDate(current.date)?.getTime() || 0;
        return bestDate <= currentDate ? best : current;
    });

    const isNewRecord = lastLog.id === personalRecord.id;

    return { lastLog, personalRecord, comparison, isNewRecord };
};

const MetricItem: React.FC<{
  label: string;
  value: string | undefined;
  unit: string;
  Icon: React.ElementType;
  comparison?: ComparisonStatus;
}> = ({ label, value, unit, Icon, comparison }) => {
    if (!value?.trim()) return null;
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

// --- WELCOME PAGE COMPONENT ---
interface WelcomePageProps {
    setActiveTab: (tab: string) => void;
}

const Welcome: React.FC<WelcomePageProps> = ({ setActiveTab }) => {
    const { summaryLogs, dailyLogs, sedeColorStyles } = useAppContext();
    const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

    const performanceData = useMemo(() => {
        const logMap = new Map<string, ExerciseLog>();
        // Using a Map ensures we have the most up-to-date version of each log, prioritizing daily over summary if an ID clash occurs.
        summaryLogs.forEach(log => logMap.set(log.id, log));
        dailyLogs.forEach(log => logMap.set(log.id, log));
        const allLogs = Array.from(logMap.values());
        return getPerformanceData(allLogs);
    }, [summaryLogs, dailyLogs]);

    const { lastLog, personalRecord, comparison, isNewRecord } = performanceData;
    
    const isNadaTab = lastLog?.day === 'Día 5';

    return (
        <div className="flex flex-col items-center justify-center text-center animate-fadeInUp min-h-[calc(100vh-150px)] p-2 sm:p-4">
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 w-full max-w-3xl">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-200 tracking-tight">
                    "La disciplina es el puente entre metas y logros. <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">¡Vamos con todo!</span>"
                </h1>
                
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                     {/* Last Log */}
                     <div className="w-full">
                        <h2 className="text-xl font-extrabold text-cyan-400 mb-4 uppercase tracking-wider flex items-center justify-center gap-2">
                            <History className="w-6 h-6"/> Tu Último Registro
                        </h2>
                        {lastLog ? (
                            <div className="bg-black/20 rounded-xl border border-white/10 p-4 sm:p-6 text-left animate-zoomInPop">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div>
                                        <p className="text-lg font-bold text-white">{lastLog.exerciseName}</p>
                                        <div className="flex items-center flex-wrap gap-2 mt-1">
                                            <p className="text-sm text-gray-400">{formatFullDisplayDate(lastLog.date)}</p>
                                            <span className={`${getSedeColor(lastLog.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                                <MapPin className="w-3 h-3"/>
                                                {lastLog.sede}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm pt-4 border-t border-gray-700/50">
                                    <MetricItem label="Tiempo" value={lastLog.tiempo} unit="Min" Icon={Clock} comparison={comparison.tiempo} />
                                    <MetricItem label={isNadaTab ? 'Velocidad' : 'Series'} value={lastLog.series} unit={isNadaTab ? 'Km/h' : ''} Icon={isNadaTab ? Zap : BarChart4} comparison={comparison.series} />
                                    <MetricItem label={isNadaTab ? 'Distancia' : 'Reps'} value={lastLog.reps} unit={isNadaTab && lastLog.distanceUnit ? (lastLog.distanceUnit === 'KM' ? 'Km' : 'm') : ''} Icon={isNadaTab ? Gauge : Repeat} comparison={comparison.reps} />
                                    <MetricItem label="Calorías" value={lastLog.calorias} unit="Kcal" Icon={Flame} comparison={comparison.calorias} />
                                    <MetricItem label={isNadaTab ? 'Inclinación' : 'Kilos'} value={lastLog.kilos} unit={isNadaTab ? '%' : 'kgs'} Icon={isNadaTab ? TrendingUp : Weight} comparison={comparison.kilos} />
                                </div>
                                {lastLog.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-700">
                                      <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                                        <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                        <p className="whitespace-pre-wrap">{lastLog.notes}</p>
                                      </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-700 rounded-lg">
                                <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">Aún no has guardado ningún ejercicio.</p>
                            </div>
                        )}
                    </div>

                    {/* Personal Record */}
                    <div className="w-full">
                        <h2 className="text-xl font-extrabold text-amber-400 mb-4 uppercase tracking-wider flex items-center justify-center gap-2">
                            <Trophy className="w-6 h-6"/> Tu Récord
                        </h2>
                        {personalRecord ? (
                            <div className="bg-amber-900/10 rounded-xl border border-amber-500/30 p-4 sm:p-6 text-left animate-zoomInPop">
                                 <div className="flex justify-between items-start gap-4 mb-4">
                                    <div>
                                        <p className="text-lg font-bold text-white">{personalRecord.exerciseName}</p>
                                        <p className="text-sm text-gray-400">{formatFullDisplayDate(personalRecord.date)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm pt-4 border-t border-amber-700/50">
                                     <MetricItem label="Tiempo" value={personalRecord.tiempo} unit="Min" Icon={Clock} />
                                     <MetricItem label={isNadaTab ? 'Velocidad' : 'Series'} value={personalRecord.series} unit={isNadaTab ? 'Km/h' : ''} Icon={isNadaTab ? Zap : BarChart4} />
                                     <MetricItem label={isNadaTab ? 'Distancia' : 'Reps'} value={personalRecord.reps} unit={isNadaTab && personalRecord.distanceUnit ? (personalRecord.distanceUnit === 'KM' ? 'Km' : 'm') : ''} Icon={isNadaTab ? Gauge : Repeat} />
                                     <MetricItem label="Calorías" value={personalRecord.calorias} unit="Kcal" Icon={Flame} />
                                     <MetricItem label={isNadaTab ? 'Inclinación' : 'Kilos'} value={personalRecord.kilos} unit={isNadaTab ? '%' : 'kgs'} Icon={isNadaTab ? TrendingUp : Weight} />
                                </div>
                            </div>
                        ) : (
                             <div className="text-center py-8 px-4 border-2 border-dashed border-gray-700 rounded-lg">
                                <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">Aún no hay récords que mostrar.</p>
                             </div>
                        )}
                    </div>
                </div>

                {/* Motivational Message */}
                {lastLog && personalRecord && (
                    <div className="mt-6 text-center">
                        {!isNewRecord && (
                             <p className="text-lg font-semibold text-amber-300">
                                ¡Estás muy cerca de superar tu récord! ¡Sigue así!
                             </p>
                        )}
                    </div>
                )}


                <button 
                    onClick={() => setActiveTab('Resumen')}
                    className="mt-8 w-full sm:w-auto text-white font-bold text-lg py-3 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-opacity-70 btn-active bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-cyan-500/30 focus:ring-cyan-500/50 flex items-center justify-center gap-2 mx-auto"
                >
                    <BarChart4 className="w-6 h-6" />
                    Ver Historial Completo
                </button>
            </div>
        </div>
    );
};

export default Welcome;