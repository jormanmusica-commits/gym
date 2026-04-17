
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { ComparisonStatus } from '../hooks/useExerciseComparison';

interface MetricItemProps {
  label: string;
  value?: string;
  unit: string;
  Icon: React.ElementType;
  comparison?: ComparisonStatus;
}

export const MetricItem: React.FC<MetricItemProps> = ({ label, value, unit, Icon, comparison }) => {
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
