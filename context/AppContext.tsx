
import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
// Fix: Import newly added types for Cardio/Nada tracking.
import type { ExerciseLog, FavoriteExercise, ExerciseMedia, LinkItem, SedeData, WorkoutDayState, MuscleGroupLinks, WorkoutDayLinks, ExerciseFormData, NadaSession, NadaFormData, NadaMetrics, ConsejoItem, WeightEntry } from '../types';

interface SedeColorStyles {
  button: string;
  tag: string;
}

interface AppState {
  sedes: {
    [sedeName: string]: SedeData;
  };
  activeSede: string | null;
  dailyLogs: ExerciseLog[];
  summaryLogs: ExerciseLog[];
  sedeOrder: string[];
  // Fix: Add state for Cardio/Nada sessions.
  dailyNadaSessions: NadaSession[];
  summaryNadaSessions: NadaSession[];
  simulatedDate: string | null;
}

interface AppContextType {
  activeSede: string | null;
  sedeNames: string[];
  setActiveSede: (sede: string | null) => void;
  renameSede: (oldName: string, newName: string) => boolean;
  removeSedeAndData: (sedeName: string) => void;
  removeSedeOnly: (sedeName: string) => void;
  moveSede: (index: number, direction: 'up' | 'down') => void;
  dailyLogs: ExerciseLog[];
  summaryLogs: ExerciseLog[];
  addDailyLog: (log: Omit<ExerciseLog, 'sede'>) => void;
  updateDailyLog: (logId: string, updates: Partial<Omit<ExerciseLog, 'id'>>) => void;
  removeDailyLog: (id: string) => void;
  removeDailyLogMedia: (logId: string, mediaIndex: number) => void;
  saveLogToSummary: (logId: string) => void;
  removeSummaryLog: (id: string) => void;
  removeSummaryLogMedia: (logId: string, mediaIndex: number) => void;
  todaysDateISO: string;
  simulatedDate: string | null;
  setSimulatedDate: (date: string | null) => void;

  // Sede-specific
  favoriteExercises: FavoriteExercise[];
  workoutDays: { [key: string]: WorkoutDayState };
  muscleGroupLinks: WorkoutDayLinks;
  stretchingLinks: LinkItem[];
  postureLinks: LinkItem[];
  sedeColorStyles: Map<string, SedeColorStyles>;
  exerciseNames: { [dayName: string]: string[] };
  addExerciseName: (dayName: string, exerciseName: string) => void;
  removeExerciseName: (dayName: string, exerciseName: string) => void;
  summaryCollapsedWeeks: string[];
  summaryCollapsedDays: string[];
  summaryCollapsedExercises: string[];
  toggleSummaryWeekCollapse: (weekKey: string) => void;
  toggleSummaryDayCollapse: (dayKey: string) => void;
  toggleSummaryExerciseCollapse: (exerciseId: string) => void;


  toggleExerciseLogExpansion: (dayName: string, logId: string, forceState?: 'open' | 'close') => void;
  addMuscleGroupLink: (dayName: string, muscle: string, link: string) => void;
  removeMuscleGroupLink: (dayName: string, muscle: string, id: string) => void;
  updateMuscleGroupLinkName: (dayName: string, muscle: string, id: string, name: string) => void;
  addFavoriteExercise: (exercise: { name: string; media: ExerciseMedia[]; dayTitle: string; notes?: string; }) => void;
  removeFavoriteExercise: (id: string) => void;
  removeFavoriteExerciseMedia: (favoriteId: string, mediaIndex: number) => void;
  addStretchingLink: (link: string) => void;
  removeStretchingLink: (id: string) => void;
  updateStretchingLinkName: (id: string, name: string) => void;
  addPostureLink: (link: string) => void;
  removePostureLink: (id: string) => void;
  updatePostureLinkName: (id: string, name: string) => void;
  exportData: () => void;
  importData: (jsonString: string) => void;
  exportSummaryData: () => void;
  removeWeekData: (weekStartDateISO: string) => void;
  exportWeekData: (weekStartDateISO: string) => void;
  exportDayData: (weekStartDateISO: string, dayName: string) => void;
  removeDayExercises: (weekStartDateISO: string, dayName: string) => void;
  exportDataAsText: () => void;
  exportSummaryDataAsText: () => void;
  exportWeekDataAsText: (weekStartDateISO: string) => void;
  exportDayDataAsText: (weekStartDateISO: string, dayName: string) => void;
  downloadJSON: (data: object, filename: string) => void;
  downloadTXT: (text: string, filename: string) => void;
  // Fix: Add missing function signatures for Cardio/Nada tracking.
  addNadaSession: (session: Omit<NadaSession, 'id' | 'sede' | 'isSavedToSummary' | 'savedState'>) => void;
  updateWorkoutDayForm: (dayName: string, field: string, value: any) => void;
  clearNadaForm: (dayName: string) => void;
  // Consejos
  consejos: ConsejoItem[];
  addConsejo: (consejo: Omit<ConsejoItem, 'id' | 'createdAt'>) => void;
  updateConsejo: (consejoId: string, updates: Partial<Omit<ConsejoItem, 'id'>>) => void;
  removeConsejo: (consejoId: string) => void;
  removeConsejoMedia: (consejoId: string, mediaIndex: number) => void;
  addConsejoVideoLink: (consejoId: string, linkUrl: string) => void;
  removeConsejoVideoLink: (consejoId: string, linkId: string) => void;
  updateConsejoVideoLinkName: (consejoId: string, linkId: string, newName: string) => void;
  // Peso
  weightHistory: WeightEntry[];
  addWeightEntry: (entry: Omit<WeightEntry, 'id' | 'imc'>) => void;
  updateWeightEntry: (entryId: string, updates: Partial<Omit<WeightEntry, 'id' | 'imc'>>) => void;
  removeWeightEntry: (entryId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const dayLabels: { [key:string]: string} = {
    'Día 5': 'Combinados',
    'Día 1': 'Pecho y Bíceps',
    'Día 2': 'Pierna y Glúteo',
    'Día 3': 'Hombro y Espalda',
    'Día 4': 'Tríceps y Antebrazo',
};

const LOCAL_STORAGE_KEY = 'gymProgressionAppState_v2';

// --- HELPERS ---
const parseMetric = (value: string | undefined): number | null => {
    if (value === undefined || value === null || value.trim() === '') return null;
    const num = parseFloat(value.replace(',', '.'));
    return isNaN(num) ? null : num;
};

const calculateIMC = (weight: string, height: string): string => {
    const weightNum = parseMetric(weight);
    const heightNum = parseMetric(height);
    if (weightNum && weightNum > 0 && heightNum && heightNum > 0) {
        const heightInMeters = heightNum / 100;
        const imc = weightNum / (heightInMeters * heightInMeters);
        return imc.toFixed(2);
    }
    return '';
};

const createInitialNadaFormData = (): NadaFormData => ({
    date: '',
    title: '',
    metrics: {
        speed: '',
        distance: '',
        distanceUnit: 'KM',
        incline: '',
        time: '',
        calories: '',
    },
    notes: '',
});


const createInitialSedeData = (): SedeData => {
  // Fix: Initialize WorkoutDayState with the 'nada' property for Cardio/Nada tracking form.
  const initialWorkoutDayState: WorkoutDayState = {
    expandedLogs: [],
    nada: createInitialNadaFormData(),
  };

  return {
    favoriteExercises: [],
    workoutDays: {
      'Día 1': JSON.parse(JSON.stringify(initialWorkoutDayState)),
      'Día 2': JSON.parse(JSON.stringify(initialWorkoutDayState)),
      'Día 3': JSON.parse(JSON.stringify(initialWorkoutDayState)),
      'Día 4': JSON.parse(JSON.stringify(initialWorkoutDayState)),
      'Día 5': JSON.parse(JSON.stringify(initialWorkoutDayState)),
    },
    muscleGroupLinks: {
      'Día 1': { 'Pecho': [], 'Bíceps': [] },
      'Día 2': { 'Pierna': [], 'Glúteo': [] },
      'Día 3': { 'Hombro': [], 'Espalda': [] },
      'Día 4': { 'Tríceps': [], 'Antebrazo': [] },
      'Día 5': { 'General': [] },
    },
    stretchingLinks: [],
    postureLinks: [],
    exerciseNames: {
      'Día 1': [],
      'Día 2': [],
      'Día 3': [],
      'Día 4': [],
      'Día 5': [],
    },
    summaryCollapsedWeeks: [],
    summaryCollapsedDays: [],
    summaryCollapsedExercises: [],
    consejos: [],
    weightHistory: [],
  };
};

const initialSedes = {
  'VENTAS': createInitialSedeData(),
  'LEGANÉS': createInitialSedeData(),
};

function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;

  // Handle new YYYY-MM-DD format reliably as a local date
  if (dateString.includes('-')) {
    // Appending T00:00:00 makes browsers interpret it as local time, not UTC
    const date = new Date(dateString + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Backwards compatibility for old format: "Lun, 26 ago"
  const monthMap: { [key: string]: number } = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };
  const cleanedString = dateString.toLowerCase().replace(/[,.]/g, '');
  const parts = cleanedString.split(' ');
  if (parts.length < 3) return null;
  
  const day = parseInt(parts[1], 10);
  const monthName = parts[2];
  const month = monthMap[monthName];
  
  if (isNaN(day) || month === undefined) return null;

  const today = new Date();
  let year = today.getFullYear();
  const potentialDate = new Date(year, month, day);

  // If the parsed date is far in the future, assume it was from last year
  if (potentialDate > today && (potentialDate.getTime() - today.getTime()) > 30 * 24 * 60 * 60 * 1000) {
    year -= 1;
  }
  
  const finalDate = new Date(year, month, day);
  finalDate.setHours(0, 0, 0, 0); // Explicitly set to midnight
  return finalDate;
}

const createLogSnapshot = (log: ExerciseLog): Partial<Omit<ExerciseLog, 'id' | 'sede' | 'day'>> => ({
    exerciseName: log.exerciseName,
    date: log.date,
    reps: log.reps,
    kilos: log.kilos,
    series: log.series,
    media: JSON.parse(JSON.stringify(log.media)),
    notes: log.notes,
    tiempo: log.tiempo,
    calorias: log.calorias,
    distanceUnit: log.distanceUnit,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const loadInitialState = (): AppState => {
    // Fix: Add Cardio/Nada sessions to the default state.
    const defaultState: AppState = {
        sedes: initialSedes,
        activeSede: null,
        dailyLogs: [],
        summaryLogs: [],
        dailyNadaSessions: [],
        summaryNadaSessions: [],
        sedeOrder: Object.keys(initialSedes),
        simulatedDate: null,
    };
    try {
      const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (serializedState === null) {
        return defaultState;
      }
      const savedState = JSON.parse(serializedState);
      
      // Migration: Split exerciseLogs into dailyLogs and summaryLogs
      if (savedState.exerciseLogs && !savedState.dailyLogs && !savedState.summaryLogs) {
        const newDailyLogs: ExerciseLog[] = [];
        const newSummaryLogs: ExerciseLog[] = [];
        const summaryIds = new Set<string>();

        for (const log of savedState.exerciseLogs) {
            if ((log.isSavedToSummary || log.wasEverSaved) && !summaryIds.has(log.id)) {
                // It's a summary log. Create a clean version from savedState if possible.
                const summaryData = log.savedState || log;
                const summaryLog: ExerciseLog = {
                    id: log.id,
                    exerciseName: summaryData.exerciseName,
                    date: summaryData.date,
                    reps: summaryData.reps,
                    kilos: summaryData.kilos,
                    series: summaryData.series,
                    day: log.day, 
                    media: summaryData.media ? JSON.parse(JSON.stringify(summaryData.media)) : [],
                    notes: summaryData.notes,
                    sede: summaryData.sede,
                    tiempo: summaryData.tiempo,
                    calorias: summaryData.calorias,
                    distanceUnit: summaryData.distanceUnit,
                };
                newSummaryLogs.push(summaryLog);
                summaryIds.add(log.id);
            }
            
            // Under the previous model, if a log was saved, it might have been only in summary.
            // For a smoother transition to the new model, we will create a daily log for EVERY log.
            const dailyLog: ExerciseLog = { ...log };
            if (log.isSavedToSummary) {
                dailyLog.savedState = log.savedState || createLogSnapshot(log);
            } else {
                delete (dailyLog as any).isSavedToSummary;
                delete (dailyLog as any).savedState;
            }
            delete (dailyLog as any).wasEverSaved;
            newDailyLogs.push(dailyLog);
        }
        savedState.dailyLogs = newDailyLogs;
        savedState.summaryLogs = newSummaryLogs;
        delete savedState.exerciseLogs;
      }

      // Fix: Removed code that was deleting Cardio/Nada data from saved state, to restore functionality.
      // Ensure workoutDays state is clean and populate exercise names
      if (savedState.sedes) {
        const allLogs = [...(savedState.dailyLogs || []), ...(savedState.summaryLogs || [])];
        for(const sedeName in savedState.sedes) {
            const sede = savedState.sedes[sedeName];
            if (sede.workoutDays) {
                for(const dayName in sede.workoutDays) {
                    if (!sede.workoutDays[dayName].nada) {
                       sede.workoutDays[dayName].nada = createInitialNadaFormData();
                    }
                    delete (sede.workoutDays[dayName] as any).isNadaFormVisible;
                }
            }
            // Migration for exerciseNames: ensure property exists and populate from logs
            if (!sede.exerciseNames) {
                sede.exerciseNames = createInitialSedeData().exerciseNames;
            }
            if (!sede.consejos) {
                sede.consejos = [];
            }
             // Migration for weight history and height
            if (sede.weightHistory) {
                const globalHeight = sede.height || '173'; // Use old global height or default
                sede.weightHistory = sede.weightHistory.map((entry: any) => ({
                    ...entry,
                    height: entry.height || globalHeight,
                    imc: entry.imc || calculateIMC(entry.weight, entry.height || globalHeight),
                }));
            } else {
                 sede.weightHistory = [];
            }
            delete sede.height; // Clean up old global height property


            const logsForSede = allLogs.filter(log => log.sede === sedeName);
            logsForSede.forEach(log => {
                if (log.day && log.exerciseName) {
                    const normalizedName = log.exerciseName.trim().toUpperCase();
                    if (normalizedName && sede.exerciseNames[log.day] && !sede.exerciseNames[log.day].includes(normalizedName)) {
                        sede.exerciseNames[log.day].push(normalizedName);
                    }
                }
            });
            // Fix: Explicitly type `dayNames` as `string[]` to resolve TypeScript error.
            Object.values(sede.exerciseNames).forEach((dayNames: string[]) => dayNames.sort());
            
            // Migration for summary expansion persistence: reset to new "collapsed" model
            if (sede.summaryCollapsedWeeks === undefined) sede.summaryCollapsedWeeks = [];
            if (sede.summaryCollapsedDays === undefined) sede.summaryCollapsedDays = [];
            if (sede.summaryCollapsedExercises === undefined) sede.summaryCollapsedExercises = [];
            delete (sede as any).summaryExpandedWeeks;
            delete (sede as any).summaryExpandedDays;
            delete (sede as any).summaryExpandedExercises;
        }
      }
      
      const mergedSedes = { ...initialSedes, ...savedState.sedes };
      const sedeOrder = savedState.sedeOrder || Object.keys(mergedSedes);

      return {
        ...defaultState,
        ...savedState,
        activeSede: null,
        sedes: mergedSedes,
        sedeOrder,
      };

    } catch (error) {
      console.error("Could not load state from local storage", error);
      return defaultState;
    }
  };

  const [appState, setAppState] = useState<AppState>(loadInitialState());
  const { activeSede, sedes, dailyLogs, summaryLogs } = appState;
  const activeSedeData = activeSede ? sedes[activeSede] : null;

  const todaysDateISO = useMemo(() => {
    if (appState.simulatedDate && /^\d{4}-\d{2}-\d{2}$/.test(appState.simulatedDate)) {
        return appState.simulatedDate;
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split('T')[0];
  }, [appState.simulatedDate]);

  useEffect(() => {
    try {
      const serializedState = JSON.stringify(appState);
      localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (error) {
      console.error("Could not save state to local storage", error);
    }
  }, [appState]);

  const setSimulatedDate = (date: string | null) => {
    setAppState(prev => ({...prev, simulatedDate: date }));
  };

  const sedeColorStyles = useMemo(() => {
    const colorSchemes: SedeColorStyles[] = [
      { // Cyan (Default)
        button: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-cyan-500/40 focus:ring-cyan-500/50',
        tag: 'bg-cyan-500 text-white',
      },
      { // Fuchsia
        button: 'bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-600 hover:shadow-lg hover:shadow-fuchsia-500/40 focus:ring-fuchsia-500/50',
        tag: 'bg-fuchsia-500 text-white',
      },
      { // Emerald
        button: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/40 focus:ring-emerald-500/50',
        tag: 'bg-emerald-500 text-white',
      },
      { // Amber
        button: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 hover:shadow-lg hover:shadow-amber-500/40 focus:ring-amber-500/50',
        tag: 'bg-amber-500 text-white',
      },
      { // Indigo
        button: 'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/40 focus:ring-indigo-500/50',
        tag: 'bg-indigo-500 text-white',
      },
      { // Rose
        button: 'bg-gradient-to-br from-rose-500 via-red-500 to-pink-600 hover:shadow-lg hover:shadow-rose-500/40 focus:ring-rose-500/50',
        tag: 'bg-rose-500 text-white',
      },
    ];
    
    const simpleStringHash = (str: string): number => {
      let hash = 0;
      if (str.length === 0) return hash;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };

    const map = new Map<string, SedeColorStyles>();
    appState.sedeOrder.forEach((name) => {
      const hash = simpleStringHash(name);
      const colorIndex = hash % colorSchemes.length;
      map.set(name, colorSchemes[colorIndex]);
    });
    return map;
  }, [appState.sedeOrder]);

  const updateSedeData = (updater: (prevSedeData: SedeData) => SedeData) => {
    if (!activeSede) return;
    setAppState(prev => {
      const currentSedeData = prev.sedes[activeSede];
      const updatedSedeData = updater(currentSedeData);
      return {
        ...prev,
        sedes: {
          ...prev.sedes,
          [activeSede]: updatedSedeData,
        },
      };
    });
  };

  const addExerciseName = (dayName: string, exerciseName: string) => {
    const normalizedName = exerciseName.trim().toUpperCase();
    if (!activeSede || !normalizedName) return;

    updateSedeData(sedeData => {
        const dayNames = sedeData.exerciseNames?.[dayName] || [];
        if (dayNames.includes(normalizedName)) {
            return sedeData; // Already exists
        }
        const newDayNames = [...dayNames, normalizedName].sort();
        return {
            ...sedeData,
            exerciseNames: {
                ...(sedeData.exerciseNames || {}),
                [dayName]: newDayNames,
            },
        };
    });
  };

  const removeExerciseName = (dayName: string, exerciseName: string) => {
    const normalizedName = exerciseName.trim().toUpperCase();
    if (!activeSede || !normalizedName) return;

    updateSedeData(sedeData => {
        const dayNames = sedeData.exerciseNames?.[dayName] || [];
        if (!dayNames.includes(normalizedName)) {
            return sedeData; // Not found
        }
        const newDayNames = dayNames.filter(name => name !== normalizedName);
        return {
            ...sedeData,
            exerciseNames: {
                ...(sedeData.exerciseNames || {}),
                [dayName]: newDayNames,
            },
        };
    });
  };

  const setActiveSede = (sede: string | null) => {
    if (sede === null) {
        setAppState(prev => ({ ...prev, activeSede: null }));
        return;
    }

    const normalizedSedeName = sede.trim().toUpperCase();
    if (!normalizedSedeName) return;

    setAppState(prev => {
        const existingSedeKey = Object.keys(prev.sedes).find(key => key.toUpperCase() === normalizedSedeName);
        
        if (existingSedeKey) {
            return { ...prev, activeSede: existingSedeKey };
        } else {
            const newOrder = [...prev.sedeOrder, normalizedSedeName];
            return {
                ...prev,
                activeSede: normalizedSedeName,
                sedes: {
                    ...prev.sedes,
                    [normalizedSedeName]: createInitialSedeData(),
                },
                sedeOrder: newOrder,
            };
        }
    });
  };
  
  const renameSede = (oldName: string, newName: string): boolean => {
    const normalizedNewName = newName.trim().toUpperCase();
    if (!normalizedNewName || normalizedNewName === oldName) return false;

    if (appState.sedes[normalizedNewName]) {
        alert('Ya existe una sede con ese nombre.');
        return false;
    }

    setAppState(prev => {
        const newSedes = { ...prev.sedes };
        const sedeData = newSedes[oldName];
        delete newSedes[oldName];
        newSedes[normalizedNewName] = sedeData;

        const newDailyLogs = prev.dailyLogs.map(l => l.sede === oldName ? { ...l, sede: normalizedNewName } : l);
        const newSummaryLogs = prev.summaryLogs.map(l => l.sede === oldName ? { ...l, sede: normalizedNewName } : l);
        const newSedeOrder = prev.sedeOrder.map(name => name === oldName ? normalizedNewName : name);

        return {
            ...prev,
            sedes: newSedes,
            dailyLogs: newDailyLogs,
            summaryLogs: newSummaryLogs,
            activeSede: prev.activeSede === oldName ? normalizedNewName : prev.activeSede,
            sedeOrder: newSedeOrder,
        };
    });
    return true;
  };

  const removeSedeAndData = (sedeName: string) => {
    setAppState(prev => {
        const newSedes = { ...prev.sedes };
        delete newSedes[sedeName];

        const newDailyLogs = prev.dailyLogs.filter(l => l.sede !== sedeName);
        const newSummaryLogs = prev.summaryLogs.filter(l => l.sede !== sedeName);
        const newSedeOrder = prev.sedeOrder.filter(name => name !== sedeName);

        return {
            ...prev,
            sedes: newSedes,
            dailyLogs: newDailyLogs,
            summaryLogs: newSummaryLogs,
            activeSede: prev.activeSede === sedeName ? null : prev.activeSede,
            sedeOrder: newSedeOrder,
        };
    });
  };

  const removeSedeOnly = (sedeName: string) => {
    setAppState(prev => {
        const newSedes = { ...prev.sedes };
        delete newSedes[sedeName];
        
        const newSedeOrder = prev.sedeOrder.filter(name => name !== sedeName);

        return {
            ...prev,
            sedes: newSedes,
            activeSede: prev.activeSede === sedeName ? null : prev.activeSede,
            sedeOrder: newSedeOrder,
        };
    });
  };

  const moveSede = (index: number, direction: 'up' | 'down') => {
    setAppState(prev => {
        const newOrder = [...prev.sedeOrder];
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        return { ...prev, sedeOrder: newOrder };
    });
  };

  const addDailyLog = (log: Omit<ExerciseLog, 'sede'>) => {
    if (!activeSede) return;
    addExerciseName(log.day, log.exerciseName);
    setAppState(prev => ({
      ...prev,
      dailyLogs: [{ ...log, sede: activeSede, isSavedToSummary: false }, ...prev.dailyLogs],
    }));
  };

  const updateDailyLog = (logId: string, updates: Partial<Omit<ExerciseLog, 'id'>>) => {
    if (updates.exerciseName) {
        const log = appState.dailyLogs.find(l => l.id === logId);
        if (log) {
            addExerciseName(log.day, updates.exerciseName);
        }
    }
    setAppState(prev => {
        if (!prev.activeSede) return prev;

        const logToUpdate = prev.dailyLogs.find(l => l.id === logId);
        if (!logToUpdate) return prev;

        const dayName = logToUpdate.day;
        const activeSedeData = prev.sedes[prev.activeSede];
        const dayState = activeSedeData.workoutDays[dayName];

        let newDailyLogs = [...prev.dailyLogs];
        const logIndex = newDailyLogs.findIndex(l => l.id === logId);
        if (logIndex === -1) return prev;

        const originalLog = newDailyLogs[logIndex];
        const updatedLog = { ...originalLog, ...updates };
        const dateChanged = updates.date && updates.date !== originalLog.date;

        let finalLogId = logId;
        let newExpandedLogs = dayState ? [...dayState.expandedLogs] : [];

        // Handle ID change on date edit for saved logs
        if (dateChanged && originalLog.isSavedToSummary) {
            const newId = crypto.randomUUID();
            finalLogId = newId;
            updatedLog.id = newId;
            delete updatedLog.isSavedToSummary;
            delete updatedLog.savedState;
            
            // If the old log was expanded, remove it, new one will be added below.
            const oldIdIndex = newExpandedLogs.indexOf(logId);
            if (oldIdIndex > -1) {
                newExpandedLogs.splice(oldIdIndex, 1);
            }
        } else if (updatedLog.isSavedToSummary && updatedLog.savedState) {
            // Standard "dirty" check for non-date changes on a saved log.
            const currentStateSnapshot = createLogSnapshot(updatedLog);
            if (JSON.stringify(currentStateSnapshot) !== JSON.stringify(updatedLog.savedState)) {
                updatedLog.isSavedToSummary = false;
            }
        }
        
        newDailyLogs[logIndex] = updatedLog;

        // Ensure the final log is marked as expanded
        if (!newExpandedLogs.includes(finalLogId)) {
            newExpandedLogs.push(finalLogId);
        }

        const finalDayState = dayState 
            ? { ...dayState, expandedLogs: newExpandedLogs } 
            : { expandedLogs: newExpandedLogs, nada: createInitialNadaFormData() };
        
        const newSedes = {
            ...prev.sedes,
            [prev.activeSede]: {
                ...activeSedeData,
                workoutDays: {
                    ...(activeSedeData.workoutDays || {}),
                    [dayName]: finalDayState,
                }
            }
        };

        return {
            ...prev,
            dailyLogs: newDailyLogs,
            sedes: newSedes,
        };
    });
  };

  const removeDailyLog = (id: string) => {
    setAppState(prev => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter(l => l.id !== id),
    }));
  };
  
  function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  const dateToYyyyMmDd = (date: Date): string => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
  };

  const saveLogToSummary = (logId: string) => {
    setAppState(prev => {
        const logToSave = prev.dailyLogs.find(log => log.id === logId);
        if (!logToSave || !prev.activeSede) return prev;

        const snapshot = createLogSnapshot(logToSave);
        const summaryVersion: ExerciseLog = { ...logToSave };
        delete summaryVersion.isSavedToSummary;
        delete summaryVersion.savedState;

        const existingSummaryIndex = prev.summaryLogs.findIndex(log => log.id === logId);
        const isNewToSummary = existingSummaryIndex === -1;
        
        let newSummaryLogs;
        if (isNewToSummary) {
            newSummaryLogs = [summaryVersion, ...prev.summaryLogs];
        } else {
            newSummaryLogs = [...prev.summaryLogs];
            newSummaryLogs[existingSummaryIndex] = summaryVersion;
        }

        const newDailyLogs = prev.dailyLogs.map(log => 
          log.id === logId 
            ? { ...log, isSavedToSummary: true, savedState: snapshot } 
            : log
        );

        let newSedes = prev.sedes;
        const activeSedeData = prev.sedes[prev.activeSede];

        if (activeSedeData) {
            const logDate = parseCustomDate(logToSave.date);
            if (logDate) {
                const monday = getMonday(logDate);
                const weekKey = dateToYyyyMmDd(monday);
                const dayKey = `${weekKey}-${logToSave.day}`;
                const groupKey = `${dayKey}-${logToSave.exerciseName}`;

                const currentCollapsedWeeks = activeSedeData.summaryCollapsedWeeks || [];
                const currentCollapsedDays = activeSedeData.summaryCollapsedDays || [];
                const currentCollapsedExercises = activeSedeData.summaryCollapsedExercises || [];
                
                const newCollapsedWeeks = currentCollapsedWeeks.filter(k => k !== weekKey);
                const newCollapsedDays = currentCollapsedDays.filter(k => k !== dayKey);
                const newCollapsedExercises = currentCollapsedExercises.filter(k => k !== groupKey);
                
                const needsUpdate = newCollapsedWeeks.length !== currentCollapsedWeeks.length ||
                                    newCollapsedDays.length !== currentCollapsedDays.length ||
                                    newCollapsedExercises.length !== currentCollapsedExercises.length;

                if (needsUpdate) {
                    const updatedSedeData = {
                        ...activeSedeData,
                        summaryCollapsedWeeks: newCollapsedWeeks,
                        summaryCollapsedDays: newCollapsedDays,
                        summaryCollapsedExercises: newCollapsedExercises,
                    };
                    newSedes = {
                        ...prev.sedes,
                        [prev.activeSede]: updatedSedeData,
                    };
                }
            }
        }

        return {
            ...prev,
            dailyLogs: newDailyLogs,
            summaryLogs: newSummaryLogs,
            sedes: newSedes,
        };
    });
  };
  
  const removeSummaryLog = (logId: string) => {
    setAppState(prev => {
      const newDailyLogs = prev.dailyLogs.map(log => {
        if (log.id === logId) {
          const { isSavedToSummary, savedState, ...rest } = log;
          return rest;
        }
        return log;
      });

      return {
        ...prev,
        summaryLogs: prev.summaryLogs.filter(log => log.id !== logId),
        dailyLogs: newDailyLogs,
      };
    });
  };
  
  const removeSummaryLogMedia = (logId: string, mediaIndex: number) => {
    setAppState(prev => ({
      ...prev,
      summaryLogs: prev.summaryLogs.map(log =>
        log.id === logId ? { ...log, media: log.media.filter((_, index) => index !== mediaIndex) } : log
      ),
    }));
  };

  const removeDailyLogMedia = (logId: string, mediaIndex: number) => {
    const log = dailyLogs.find(l => l.id === logId);
    if (!log) return;
    const updatedMedia = log.media.filter((_, i) => i !== mediaIndex);
    updateDailyLog(logId, { media: updatedMedia });
  };
  
  const updateWorkoutDays = (updater: (prevWorkoutDays: { [key: string]: WorkoutDayState }) => { [key: string]: WorkoutDayState }) => {
    updateSedeData(sedeData => ({
      ...sedeData,
      workoutDays: updater(sedeData.workoutDays),
    }));
  };
  
  const toggleExerciseLogExpansion = (dayName: string, logId: string, forceState?: 'open' | 'close') => {
    updateWorkoutDays(prev => {
        const currentDay = prev[dayName];
        if (!currentDay) return prev;

        const currentExpanded = currentDay.expandedLogs || [];
        const isCurrentlyExpanded = currentExpanded.includes(logId);
        
        let newExpanded: string[];

        if (forceState === 'open') {
            if (isCurrentlyExpanded) return prev;
            newExpanded = [...currentExpanded, logId];
        } else if (forceState === 'close') {
            if (!isCurrentlyExpanded) return prev;
            newExpanded = currentExpanded.filter(id => id !== logId);
        } else { // Regular toggle behavior
             newExpanded = isCurrentlyExpanded
                ? currentExpanded.filter(id => id !== logId)
                : [...currentExpanded, logId];
        }
        
        return {
            ...prev,
            [dayName]: { ...currentDay, expandedLogs: newExpanded },
        };
    });
  };
  
  const toggleSummaryWeekCollapse = (weekKey: string) => {
    updateSedeData(sedeData => {
        const currentCollapsed = sedeData.summaryCollapsedWeeks || [];
        const newCollapsed = currentCollapsed.includes(weekKey)
            ? currentCollapsed.filter(key => key !== weekKey)
            : [...currentCollapsed, weekKey];
        return { ...sedeData, summaryCollapsedWeeks: newCollapsed };
    });
  };

  const toggleSummaryDayCollapse = (dayKey: string) => {
    updateSedeData(sedeData => {
        const currentCollapsed = sedeData.summaryCollapsedDays || [];
        const newCollapsed = currentCollapsed.includes(dayKey)
            ? currentCollapsed.filter(key => key !== dayKey)
            : [...currentCollapsed, dayKey];
        return { ...sedeData, summaryCollapsedDays: newCollapsed };
    });
  };

  const toggleSummaryExerciseCollapse = (exerciseId: string) => {
    updateSedeData(sedeData => {
        const currentCollapsed = sedeData.summaryCollapsedExercises || [];
        const newCollapsed = currentCollapsed.includes(exerciseId)
            ? currentCollapsed.filter(id => id !== exerciseId)
            : [...currentCollapsed, exerciseId];
        return { ...sedeData, summaryCollapsedExercises: newCollapsed };
    });
  };

  const updateMuscleGroupLinks = (updater: (prevLinks: WorkoutDayLinks) => WorkoutDayLinks) => {
    updateSedeData(sedeData => ({ ...sedeData, muscleGroupLinks: updater(sedeData.muscleGroupLinks) }));
  };

  const addMuscleGroupLink = (dayName: string, muscle: string, linkUrl: string) => {
    if (!linkUrl) return;
    updateMuscleGroupLinks(prev => {
      const currentLinks = prev[dayName]?.[muscle] || [];
      if (currentLinks.some(l => l.url === linkUrl)) return prev;
      const newLink: LinkItem = { id: crypto.randomUUID(), url: linkUrl, name: `Video ${currentLinks.length + 1}` };
      return { ...prev, [dayName]: { ...prev[dayName], [muscle]: [...currentLinks, newLink] } };
    });
  };

  const removeMuscleGroupLink = (dayName: string, muscle: string, id: string) => {
    updateMuscleGroupLinks(prev => ({
      ...prev,
      [dayName]: { ...prev[dayName], [muscle]: prev[dayName][muscle].filter((link) => link.id !== id) },
    }));
  };

  const updateMuscleGroupLinkName = (dayName: string, muscle: string, id: string, name: string) => {
    updateMuscleGroupLinks(prev => ({
      ...prev,
      [dayName]: { ...prev[dayName], [muscle]: prev[dayName][muscle].map(link => (link.id === id ? { ...link, name } : link)) },
    }));
  };

  const addFavoriteExercise = (exercise: { name: string; media: ExerciseMedia[]; dayTitle: string; notes?: string; }) => {
    updateSedeData(sedeData => {
        const existingIndex = sedeData.favoriteExercises.findIndex(fav => fav.name.toUpperCase() === exercise.name.toUpperCase());
        let newFavorites;
        if (existingIndex > -1) {
            newFavorites = [...sedeData.favoriteExercises];
            const existingMedia = newFavorites[existingIndex].media || [];
            newFavorites[existingIndex] = { ...newFavorites[existingIndex], media: [...existingMedia, ...exercise.media], dayTitle: exercise.dayTitle, notes: exercise.notes };
        } else {
            newFavorites = [...sedeData.favoriteExercises, { ...exercise, id: crypto.randomUUID() }];
        }
        return { ...sedeData, favoriteExercises: newFavorites };
    });
  };

  const removeFavoriteExercise = (id: string) => {
    updateSedeData(sedeData => ({ ...sedeData, favoriteExercises: sedeData.favoriteExercises.filter(fav => fav.id !== id) }));
  };

  const removeFavoriteExerciseMedia = (favoriteId: string, mediaIndex: number) => {
    updateSedeData(sedeData => ({
        ...sedeData,
        favoriteExercises: sedeData.favoriteExercises.map(fav =>
            fav.id === favoriteId ? { ...fav, media: fav.media.filter((_, index) => index !== mediaIndex) } : fav
        ),
    }));
  };

  const addStretchingLink = (linkUrl: string) => {
    updateSedeData(sedeData => {
      if (linkUrl && !sedeData.stretchingLinks.some(l => l.url === linkUrl)) {
        const newLink: LinkItem = { id: crypto.randomUUID(), url: linkUrl, name: `Video ${sedeData.stretchingLinks.length + 1}` };
        return { ...sedeData, stretchingLinks: [...sedeData.stretchingLinks, newLink] };
      }
      return sedeData;
    });
  };

  const removeStretchingLink = (id: string) => {
    updateSedeData(sedeData => ({ ...sedeData, stretchingLinks: sedeData.stretchingLinks.filter((link) => link.id !== id) }));
  };

  const updateStretchingLinkName = (id: string, name: string) => {
    updateSedeData(sedeData => ({ ...sedeData, stretchingLinks: sedeData.stretchingLinks.map(link => (link.id === id ? { ...link, name } : link)) }));
  };

  const addPostureLink = (linkUrl: string) => {
    updateSedeData(sedeData => {
      if (linkUrl && !sedeData.postureLinks.some(l => l.url === linkUrl)) {
        const newLink: LinkItem = { id: crypto.randomUUID(), url: linkUrl, name: `Video ${sedeData.postureLinks.length + 1}` };
        return { ...sedeData, postureLinks: [...sedeData.postureLinks, newLink] };
      }
      return sedeData;
    });
  };

  const removePostureLink = (id: string) => {
    updateSedeData(sedeData => ({ ...sedeData, postureLinks: sedeData.postureLinks.filter((link) => link.id !== id) }));
  };

  const updatePostureLinkName = (id: string, name: string) => {
    updateSedeData(sedeData => ({ ...sedeData, postureLinks: sedeData.postureLinks.map(link => (link.id === id ? { ...link, name } : link)) }));
  };

  // Fix: Add missing functions for Cardio/Nada tracking.
  const addNadaSession = (session: Omit<NadaSession, 'id' | 'sede' | 'isSavedToSummary' | 'savedState'>) => {
      if (!activeSede) return;
      const newSession: NadaSession = {
          id: crypto.randomUUID(),
          ...session,
          sede: activeSede,
      };
      setAppState(prev => ({
          ...prev,
          summaryNadaSessions: [newSession, ...(prev.summaryNadaSessions || [])],
      }));
  };

  const updateWorkoutDayForm = (dayName: string, field: string, value: any) => {
      if (!activeSede) return;
      updateSedeData(sedeData => {
          const dayState = sedeData.workoutDays[dayName];
          if (!dayState) return sedeData;

          const newNadaState = { ...dayState.nada };

          if (['date', 'title', 'notes'].includes(field)) {
              (newNadaState as any)[field] = value;
          } else if (field === 'distanceUnit' || Object.keys(newNadaState.metrics).includes(field)) {
              newNadaState.metrics = { ...newNadaState.metrics, [field]: value };
          }

          return {
              ...sedeData,
              workoutDays: {
                  ...sedeData.workoutDays,
                  [dayName]: {
                      ...dayState,
                      nada: newNadaState
                  }
              }
          };
      });
  };

  const clearNadaForm = (dayName: string) => {
      if (!activeSede) return;
      updateSedeData(sedeData => {
          const dayState = sedeData.workoutDays[dayName];
          if (!dayState) return sedeData;
          return {
              ...sedeData,
              workoutDays: {
                  ...sedeData.workoutDays,
                  [dayName]: {
                      ...dayState,
                      nada: createInitialNadaFormData(),
                  }
              }
          };
      });
  };

  const addConsejo = (consejo: Omit<ConsejoItem, 'id' | 'createdAt'>) => {
    updateSedeData(sedeData => {
      const newConsejo: ConsejoItem = {
        ...consejo,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        videoLinks: consejo.videoLinks || [],
      };
      const newConsejos = [newConsejo, ...(sedeData.consejos || [])];
      return { ...sedeData, consejos: newConsejos };
    });
  };

  const updateConsejo = (consejoId: string, updates: Partial<Omit<ConsejoItem, 'id'>>) => {
    updateSedeData(sedeData => {
      const newConsejos = (sedeData.consejos || []).map(c => 
        c.id === consejoId ? { ...c, ...updates } : c
      );
      return { ...sedeData, consejos: newConsejos };
    });
  };

  const removeConsejo = (consejoId: string) => {
    updateSedeData(sedeData => {
      const newConsejos = (sedeData.consejos || []).filter(c => c.id !== consejoId);
      return { ...sedeData, consejos: newConsejos };
    });
  };
  
  const removeConsejoMedia = (consejoId: string, mediaIndex: number) => {
    updateSedeData(sedeData => {
      const newConsejos = (sedeData.consejos || []).map(c => {
        if (c.id === consejoId) {
          const newMedia = c.media.filter((_, index) => index !== mediaIndex);
          return { ...c, media: newMedia };
        }
        return c;
      });
      return { ...sedeData, consejos: newConsejos };
    });
  };

  const addConsejoVideoLink = (consejoId: string, linkUrl: string) => {
    if (!linkUrl) return;
    updateSedeData(sedeData => {
      const newConsejos = (sedeData.consejos || []).map(c => {
        if (c.id === consejoId) {
          const currentLinks = c.videoLinks || [];
          if (currentLinks.some(l => l.url === linkUrl)) return c;
          const newLink: LinkItem = { id: crypto.randomUUID(), url: linkUrl, name: `Video ${currentLinks.length + 1}` };
          return { ...c, videoLinks: [...currentLinks, newLink] };
        }
        return c;
      });
      return { ...sedeData, consejos: newConsejos };
    });
  };

  const removeConsejoVideoLink = (consejoId: string, linkId: string) => {
    updateSedeData(sedeData => {
      const newConsejos = (sedeData.consejos || []).map(c => {
        if (c.id === consejoId) {
          return { ...c, videoLinks: (c.videoLinks || []).filter(l => l.id !== linkId) };
        }
        return c;
      });
      return { ...sedeData, consejos: newConsejos };
    });
  };

  const updateConsejoVideoLinkName = (consejoId: string, linkId: string, newName: string) => {
    updateSedeData(sedeData => {
      const newConsejos = (sedeData.consejos || []).map(c => {
        if (c.id === consejoId) {
          const newLinks = (c.videoLinks || []).map(l => (l.id === linkId ? { ...l, name: newName } : l));
          return { ...c, videoLinks: newLinks };
        }
        return c;
      });
      return { ...sedeData, consejos: newConsejos };
    });
  };

  const addWeightEntry = (entry: Omit<WeightEntry, 'id' | 'imc'>) => {
    updateSedeData(sedeData => {
      const imc = calculateIMC(entry.weight, entry.height);
      const newEntry: WeightEntry = { ...entry, id: crypto.randomUUID(), imc };
      const newHistory = [newEntry, ...(sedeData.weightHistory || [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { ...sedeData, weightHistory: newHistory };
    });
  };

  const updateWeightEntry = (entryId: string, updates: Partial<Omit<WeightEntry, 'id' | 'imc'>>) => {
    updateSedeData(sedeData => {
      const newHistory = (sedeData.weightHistory || [])
        .map(entry => {
            if (entry.id === entryId) {
              const updatedEntry = { ...entry, ...updates };
              const imc = calculateIMC(updatedEntry.weight, updatedEntry.height);
              return { ...updatedEntry, imc };
            }
            return entry;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { ...sedeData, weightHistory: newHistory };
    });
  };
  
  const removeWeightEntry = (entryId: string) => {
    updateSedeData(sedeData => ({
      ...sedeData,
      weightHistory: (sedeData.weightHistory || []).filter(entry => entry.id !== entryId),
    }));
  };


  const downloadJSON = (data: object, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/octet-stream' });
    const file = new File([blob], filename, { type: 'application/octet-stream' });

    // Use Web Share API if available (best for mobile, especially iOS Safari)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: `Exportar: ${filename}`,
      }).catch((error) => {
        // AbortError is expected if the user cancels the share dialog.
        if (error.name !== 'AbortError') {
          console.error('Error al compartir:', error);
          alert('Error: No se pudo compartir el archivo.');
        }
      });
    } else {
      // Fallback for desktop or browsers without Web Share API
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  const downloadTXT = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/octet-stream' });
    const file = new File([blob], filename, { type: 'application/octet-stream' });

    // Use Web Share API if available
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: `Exportar: ${filename}`,
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error al compartir:', error);
          alert('Error: No se pudo compartir el archivo.');
        }
      });
    } else {
      // Fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const exportData = () => {
    const dataToExport = {
      sedes: appState.sedes,
      activeSede: appState.activeSede,
      dailyLogs: appState.dailyLogs,
      summaryLogs: appState.summaryLogs,
      sedeOrder: appState.sedeOrder,
      dailyNadaSessions: appState.dailyNadaSessions || [],
      summaryNadaSessions: appState.summaryNadaSessions || [],
      simulatedDate: appState.simulatedDate,
    };
    const date = new Date().toISOString().slice(0, 10);
    downloadJSON(dataToExport, `progreso-gym-completo-${date}.json`);
  };
  
  const exportSummaryData = () => {
    const stateToExport = {
      summaryLogs: appState.summaryLogs,
    };
    downloadJSON(stateToExport, `resumen-progreso-gym-global-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const importData = (jsonString: string) => {
    try {
      const importedData = JSON.parse(jsonString);

      if (typeof importedData !== 'object' || importedData === null) {
        throw new Error("El archivo JSON no es válido.");
      }

      const isFullImport = 'sedes' in importedData && 'activeSede' in importedData && 'sedeOrder' in importedData;

      if (isFullImport) {
        // Full import: replace the entire state
        const newState: AppState = {
          sedes: importedData.sedes || {},
          activeSede: importedData.activeSede === undefined ? null : importedData.activeSede,
          dailyLogs: importedData.dailyLogs || [],
          summaryLogs: importedData.summaryLogs || [],
          sedeOrder: importedData.sedeOrder || Object.keys(importedData.sedes || {}),
          dailyNadaSessions: importedData.dailyNadaSessions || [],
          summaryNadaSessions: importedData.summaryNadaSessions || [],
          simulatedDate: importedData.simulatedDate || null,
        };
        
        // Repopulate exercise names from the imported logs
        const allLogs = [...(newState.dailyLogs || []), ...(newState.summaryLogs || [])];
        for (const sedeName in newState.sedes) {
          if (Object.prototype.hasOwnProperty.call(newState.sedes, sedeName)) {
            const sedeData = newState.sedes[sedeName];
            if (!sedeData.exerciseNames) {
              sedeData.exerciseNames = createInitialSedeData().exerciseNames;
            }
            // Clear existing names to start fresh
             Object.keys(sedeData.exerciseNames).forEach(day => {
                if(sedeData.exerciseNames[day]) sedeData.exerciseNames[day] = [];
             });

            const logsForSede = allLogs.filter(log => log.sede === sedeName);
            logsForSede.forEach(log => {
              if (log.day && log.exerciseName && sedeData.exerciseNames[log.day]) {
                const normalizedName = log.exerciseName.trim().toUpperCase();
                if (normalizedName && !sedeData.exerciseNames[log.day].includes(normalizedName)) {
                  sedeData.exerciseNames[log.day].push(normalizedName);
                }
              }
            });
            Object.values(sedeData.exerciseNames).forEach(dayNames => dayNames.sort());
          }
        }
        setAppState(newState);
        alert('¡Datos importados con éxito! La aplicación se ha restaurado por completo.');
      } else {
        // Partial import: merge logs into existing state
        setAppState(prev => {
          const mergeById = (existing: ExerciseLog[], incoming?: ExerciseLog[]): ExerciseLog[] => {
            if (!incoming) return existing;
            const map = new Map(existing.map(item => [item.id, item]));
            incoming.forEach(item => map.set(item.id, item));
            return Array.from(map.values());
          };

          const newState = {
            ...prev,
            dailyLogs: mergeById(prev.dailyLogs, importedData.dailyLogs),
            summaryLogs: mergeById(prev.summaryLogs, importedData.summaryLogs),
          };

          // Add any new exercise names from the partial import
          const newLogs = [...(importedData.dailyLogs || []), ...(importedData.summaryLogs || [])];
          newLogs.forEach(log => {
            if(log.sede && newState.sedes[log.sede] && log.day && newState.sedes[log.sede].exerciseNames[log.day]) {
              const normalizedName = log.exerciseName.trim().toUpperCase();
              const nameList = newState.sedes[log.sede].exerciseNames[log.day];
              if (normalizedName && !nameList.includes(normalizedName)) {
                nameList.push(normalizedName);
                nameList.sort();
              }
            }
          });
          
          return newState;
        });
        alert('Registros importados y añadidos a tu historial.');
      }
    } catch (error) {
      console.error("Failed to import data:", error);
      throw new Error('El archivo de importación no es válido o está corrupto.');
    }
  };
  
  const removeWeekData = (weekStartDateISO: string) => {
    const startDate = parseCustomDate(weekStartDateISO);
    if (!startDate) return;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    setAppState(prev => {
        const isInWeek = (item: ExerciseLog) => {
            const itemDate = parseCustomDate(item.date);
            return itemDate && itemDate.getTime() >= startDate.getTime() && itemDate.getTime() < endDate.getTime();
        };

        const logIdsToRemove = new Set(prev.summaryLogs.filter(isInWeek).map(l => l.id));

        const newDailyLogs = prev.dailyLogs.map(log => {
            if (logIdsToRemove.has(log.id)) {
                const { isSavedToSummary, savedState, ...rest } = log;
                return rest;
            }
            return log;
        });

        const newSummaryLogs = prev.summaryLogs.filter(l => !isInWeek(l));

        return {
            ...prev,
            summaryLogs: newSummaryLogs,
            dailyLogs: newDailyLogs,
        };
    });
  };

  const exportWeekData = (weekStartDateISO: string) => {
    const startDate = parseCustomDate(weekStartDateISO);
    if (!startDate) return;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    const filterFn = (item: ExerciseLog) => {
        const itemDate = parseCustomDate(item.date);
        return itemDate && itemDate.getTime() >= startDate.getTime() && itemDate.getTime() < endDate.getTime();
    };

    const weekExercises = appState.summaryLogs.filter(filterFn);
    
    const weekNumber = Math.ceil(startDate.getDate() / 7);
    const month = startDate.toLocaleDateString('es-ES', { month: 'long' });
    const year = startDate.getFullYear();
    const filename = `resumen-semana-${weekNumber}-${month}-${year}.json`;

    downloadJSON({ summaryLogs: weekExercises }, filename);
  };

  const removeDayExercises = (weekStartDateISO: string, dayName: string) => {
    const startDate = parseCustomDate(weekStartDateISO);
    if (!startDate) return;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    const filterFn = (log: ExerciseLog) => {
        if (log.day !== dayName) return true;
        const logDate = parseCustomDate(log.date);
        return !logDate || logDate.getTime() < startDate.getTime() || logDate.getTime() >= endDate.getTime();
    };

    setAppState(prev => ({
      ...prev,
      summaryLogs: prev.summaryLogs.filter(filterFn)
    }));
  };

  const exportDayData = (weekStartDateISO: string, dayName: string) => {
    const startDate = parseCustomDate(weekStartDateISO);
    if (!startDate) return;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    let dataToExport: object = {};
    let filename = '';

    const dayTitle = dayLabels[dayName] || dayName;
    const filenamePart = dayTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, "y").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const filterByDate = (item: { date: string }) => {
      const itemDate = parseCustomDate(item.date);
      return itemDate && itemDate.getTime() >= startDate.getTime() && itemDate.getTime() < endDate.getTime();
    };

    const dayExercises = appState.summaryLogs.filter(log => log.day === dayName && filterByDate(log));
    dataToExport = { summaryLogs: dayExercises };
    filename = `resumen-ejercicios-${filenamePart}-${weekStartDateISO}.json`;

    if (Object.values(dataToExport).some(arr => Array.isArray(arr) && arr.length > 0)) {
        downloadJSON(dataToExport, filename);
    } else {
        alert('No hay datos para exportar.');
    }
  };

  // Fix: Removed duplicate 'getMonday' function to resolve redeclaration error.
  // --- TEXT EXPORT HELPERS ---

  const formatWeekRange = (start: Date) => {
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startDay = start.getDate();
      const startMonth = start.toLocaleDateString('es-ES', { month: 'long' });
      const endDay = end.getDate();
      const endMonth = end.toLocaleDateString('es-ES', { month: 'long' });
      const year = start.getFullYear();
      if (startMonth === endMonth) {
          return `Semana del ${startDay} al ${endDay} de ${startMonth}, ${year}`;
      }
      return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}, ${year}`;
  };

  const formatDisplayDate = (dateString: string): string => {
    const date = parseCustomDate(dateString);
    if (date) {
      const formatted = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      return (formatted.charAt(0).toUpperCase() + formatted.slice(1)).replace(/[,.]/g, '');
    }
    return dateString;
  };

  const formatExerciseLogAsText = (log: ExerciseLog): string => {
    const isNadaTab = log.day === 'Día 5';
    
    const lines = [
      `${log.exerciseName.toUpperCase()} - ${formatDisplayDate(log.date)} [Sede: ${log.sede}]`,
    ];

    if (isNadaTab) {
        if (log.tiempo) lines.push(`  - Tiempo: ${log.tiempo} Min`);
        const parts = [];
        if (log.series) parts.push(`Velocidad: ${log.series}`);
        if (log.reps) parts.push(`Distancia: ${log.reps}${log.distanceUnit ? ` ${log.distanceUnit === 'KM' ? 'Kilómetros' : 'Metros'}` : ''}`);
        if (parts.length > 0) lines.push(`  - ${parts.join(', ')}`);
        if (log.calorias) lines.push(`  - Calorías: ${log.calorias} Kcal`);
        if (log.kilos) lines.push(`  - Inclinación: ${log.kilos}`);
    } else {
        const metricsLine = `  - ${log.series || '-'} series x ${log.reps || '-'} reps @ ${log.kilos || '-'} kgs`;
        lines.push(metricsLine);
        if (log.tiempo) lines.push(`  - Tiempo: ${log.tiempo} Min`);
        if (log.calorias) lines.push(`  - Calorías: ${log.calorias} Kcal`);
    }

    if (log.notes) {
      lines.push(`  - Notas: ${log.notes}`);
    }
    return lines.join('\n');
  };
  
  const generateSummaryText = (exercises: ExerciseLog[]): string => {
      const allItems = [
        ...exercises.map(l => ({ ...l, type: 'exercise' as const, dateObj: parseCustomDate(l.date) })),
      ].filter(item => item.dateObj !== null);
  
      if (allItems.length === 0) return "No hay datos para exportar.";
  
      const groupedByWeek: { [weekKey: string]: typeof allItems } = {};
      allItems.forEach(item => {
          const monday = getMonday(item.dateObj!);
          const weekKey = monday.toISOString().split('T')[0];
          if (!groupedByWeek[weekKey]) {
              groupedByWeek[weekKey] = [];
          }
          groupedByWeek[weekKey].push(item);
      });
  
      const sortedWeekKeys = Object.keys(groupedByWeek).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let fullText = "PROGRESIÓN DE CARGA - RESUMEN\n===============================\n\n";
  
      sortedWeekKeys.forEach(weekKey => {
          const weekItems = groupedByWeek[weekKey];
          const startDate = new Date(weekKey);
          startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
          
          fullText += `${formatWeekRange(startDate).toUpperCase()}\n-------------------------------\n\n`;
  
          const groupedByDay: { [day: string]: typeof weekItems } = {};
          weekItems.forEach(item => {
              if (!groupedByDay[item.day]) {
                  groupedByDay[item.day] = [];
              }
              groupedByDay[item.day].push(item);
          });
          
          const dayOrder = ['Día 5', 'Día 1', 'Día 2', 'Día 3', 'Día 4'];
          dayOrder.forEach(dayName => {
              if (groupedByDay[dayName]) {
                  fullText += `*** ${dayLabels[dayName] || dayName} ***\n\n`;
                  const dayItems = groupedByDay[dayName];
                  dayItems.sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime());
                  dayItems.forEach(item => {
                      if (item.type === 'exercise') {
                        fullText += formatExerciseLogAsText(item as ExerciseLog) + '\n\n';
                      }
                  });
              }
          });
          fullText += "\n";
      });
      return fullText;
  };

  const exportDataAsText = () => {
    exportSummaryDataAsText();
  };

  const exportSummaryDataAsText = () => {
    const textContent = generateSummaryText(appState.summaryLogs);
    downloadTXT(textContent, `resumen-progreso-gym-global-${new Date().toISOString().slice(0, 10)}.txt`);
  };

  const exportWeekDataAsText = (weekStartDateISO: string) => {
    const startDate = parseCustomDate(weekStartDateISO);
    if (!startDate) return;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    const weekExercises = appState.summaryLogs.filter(l => {
        const d = parseCustomDate(l.date);
        return d && d.getTime() >= startDate.getTime() && d.getTime() < endDate.getTime();
    });
    const weekNumber = Math.ceil(startDate.getDate() / 7);
    const month = startDate.toLocaleDateString('es-ES', { month: 'long' });
    const year = startDate.getFullYear();
    const filename = `resumen-semana-${weekNumber}-${month}-${year}.txt`;
    const textContent = generateSummaryText(weekExercises);
    downloadTXT(textContent, filename);
  };
  
  const exportDayDataAsText = (weekStartDateISO: string, dayName: string) => {
    const startDate = parseCustomDate(weekStartDateISO);
    if (!startDate) return;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    const dayTitle = dayLabels[dayName] || dayName;
    const filenamePart = dayTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, "y").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const displayStartDate = new Date(startDate);
    displayStartDate.setMinutes(displayStartDate.getMinutes() + displayStartDate.getTimezoneOffset());

    let textContent = `Resumen para ${dayTitle} - ${formatWeekRange(displayStartDate)}\n\n`;
    let filename = '';
    
    const filterByDate = (item: { date: string }) => {
        const d = parseCustomDate(item.date);
        return d && d.getTime() >= startDate.getTime() && d.getTime() < endDate.getTime();
    };

    const dayExercises = appState.summaryLogs.filter(l => l.day === dayName && filterByDate(l));
    if (dayExercises.length === 0) { alert('No hay datos para exportar.'); return; }
    textContent += dayExercises.map(formatExerciseLogAsText).join('\n\n');
    filename = `resumen-ejercicios-${filenamePart}-${weekStartDateISO}.txt`;

    downloadTXT(textContent, filename);
  };

  const value: AppContextType = {
    activeSede,
    sedeNames: appState.sedeOrder,
    setActiveSede,
    renameSede,
    removeSedeAndData,
    removeSedeOnly,
    moveSede,
    dailyLogs,
    summaryLogs,
    addDailyLog,
    updateDailyLog,
    removeDailyLog,
    removeDailyLogMedia,
    saveLogToSummary,
    removeSummaryLog,
    removeSummaryLogMedia,
    todaysDateISO,
    simulatedDate: appState.simulatedDate,
    setSimulatedDate,
    workoutDays: activeSedeData?.workoutDays || {},
    sedeColorStyles,
    exerciseNames: activeSedeData?.exerciseNames || {},
    addExerciseName,
    removeExerciseName,
    summaryCollapsedWeeks: activeSedeData?.summaryCollapsedWeeks || [],
    summaryCollapsedDays: activeSedeData?.summaryCollapsedDays || [],
    summaryCollapsedExercises: activeSedeData?.summaryCollapsedExercises || [],
    toggleSummaryWeekCollapse,
    toggleSummaryDayCollapse,
    toggleSummaryExerciseCollapse,
    toggleExerciseLogExpansion,
    muscleGroupLinks: activeSedeData?.muscleGroupLinks || {},
    addMuscleGroupLink,
    removeMuscleGroupLink,
    updateMuscleGroupLinkName,
    favoriteExercises: activeSedeData?.favoriteExercises || [],
    addFavoriteExercise,
    removeFavoriteExercise,
    removeFavoriteExerciseMedia,
    stretchingLinks: activeSedeData?.stretchingLinks || [],
    addStretchingLink,
    removeStretchingLink,
    updateStretchingLinkName,
    postureLinks: activeSedeData?.postureLinks || [],
    addPostureLink,
    removePostureLink,
    updatePostureLinkName,
    exportData,
    importData,
    exportSummaryData,
    removeWeekData,
    exportWeekData,
    exportDayData,
    removeDayExercises,
    exportDataAsText,
    exportSummaryDataAsText,
    exportWeekDataAsText,
    exportDayDataAsText,
    downloadJSON,
    downloadTXT,
    // Fix: Expose Cardio/Nada functions through the context.
    addNadaSession,
    updateWorkoutDayForm,
    clearNadaForm,
    // Consejos
    consejos: activeSedeData?.consejos || [],
    addConsejo,
    updateConsejo,
    removeConsejo,
    removeConsejoMedia,
    addConsejoVideoLink,
    removeConsejoVideoLink,
    updateConsejoVideoLinkName,
    // Peso
    weightHistory: activeSedeData?.weightHistory || [],
    addWeightEntry,
    updateWeightEntry,
    removeWeightEntry,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
