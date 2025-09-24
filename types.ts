
export interface ExerciseLog {
  id:string;
  exerciseName: string;
  date: string;
  reps: string;
  kilos: string;
  series: string;
  incline?: string;
  day: string;
  media: ExerciseMedia[];
  notes?: string;
  sede: string;
  isSavedToSummary?: boolean;
  savedState?: Partial<Omit<ExerciseLog, 'id' | 'sede' | 'day'>>;
  tiempo?: string;
  calorias?: string;
  distanceUnit?: 'KM' | 'M';
}

// Fix: Add missing types for Cardio/Nada tracking.
export interface NadaMetrics {
  speed: string;
  distance: string;
  distanceUnit: 'KM' | 'MTS';
  incline: string;
  time: string;
  calories: string;
}

export interface NadaFormData {
  date: string;
  title: string;
  metrics: NadaMetrics;
  notes: string;
}

export interface NadaSession {
    id: string;
    date: string;
    day: string;
    sede: string;
    title: string;
    metrics: NadaMetrics;
    notes?: string;
    isSavedToSummary?: boolean;
    savedState?: Partial<Omit<NadaSession, 'id' | 'sede' | 'day'>>;
}

export interface ExerciseMedia {
  type: 'image' | 'video';
  dataUrl: string;
}

export interface FavoriteExercise {
  id: string;
  name: string;
  dayTitle: string;
  media: ExerciseMedia[];
  notes?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  name: string;
}

export interface ExerciseFormData {
  id: string;
  exerciseName: string;
  date: string;
  reps: string;
  kilos: string;
  series: string;
  media: ExerciseMedia[];
  notes: string;
  tiempo: string;
  calorias: string;
  distanceUnit: 'KM' | 'M';
}

export interface WorkoutDayState {
  expandedLogs: string[];
  // Fix: Add missing 'nada' property to hold Cardio/Nada form state.
  nada: NadaFormData;
}

export interface MuscleGroupLinks {
  [muscle: string]: LinkItem[];
}

export interface WorkoutDayLinks {
  [dayName:string]: MuscleGroupLinks;
}

export interface ConsejoItem {
  id: string;
  title: string;
  content: string;
  media: ExerciseMedia[];
  createdAt: string; // ISO string
  videoLinks?: LinkItem[];
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: string;
  fatPercentage?: string;
  musclePercentage?: string;
  visceralFat?: string;
  height: string;
  imc?: string;
}

export interface SedeData {
  favoriteExercises: FavoriteExercise[];
  workoutDays: { [key: string]: WorkoutDayState };
  muscleGroupLinks: WorkoutDayLinks;
  stretchingLinks: LinkItem[];
  postureLinks: LinkItem[];
  exerciseNames: { [dayName: string]: string[] };
  summaryCollapsedWeeks: string[];
  summaryCollapsedDays: string[];
  summaryCollapsedExercises: string[];
  consejos: ConsejoItem[];
  weightHistory: WeightEntry[];
}
