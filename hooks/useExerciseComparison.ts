
import { useMemo } from 'react';
import type { ExerciseLog } from '../types';
import { parseCustomDate, parseMetric, parseTimeToSeconds } from '../lib/metrics';

export type ComparisonStatus = 'increase' | 'decrease' | 'same' | 'new';

export interface ComparisonResults {
    [key: string]: ComparisonStatus | undefined;
}

export const useExerciseComparison = (currentLog: Partial<ExerciseLog> & { date: string; exerciseName: string; sede: string; id?: string }, allLogs: ExerciseLog[]) => {
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

        const comparisons: ComparisonResults = {};
        
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
    }, [currentLog.id, currentLog.date, currentLog.exerciseName, currentLog.sede, currentLog.series, currentLog.reps, currentLog.kilos, currentLog.tiempo, currentLog.calorias, allLogs]);
};
