import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Weight, Percent, Ruler, Plus, Trash2, Pencil, X, CalendarDays, History, ArrowUp, ArrowDown, Scale, Check, BarChart4, Trophy, HelpCircle } from 'lucide-react';
import type { WeightEntry } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import CalendarModal from '../components/CalendarModal';

// Helper functions for parsing and comparison
const parseMetric = (value: string | undefined): number | null => {
  if (value === undefined || value === null || value.trim() === '') return null;
  const num = parseFloat(value.replace(',', '.'));
  return isNaN(num) ? null : num;
};

// Helper function for IMC Classification
const getImcClassification = (imc: string | undefined) => {
  const imcNum = parseMetric(imc);
  if (imcNum === null) {
    return { classification: 'N/A', color: 'text-gray-400', bgColor: 'bg-gray-700/20' };
  }

  if (imcNum < 18.5) {
    return { classification: 'Bajo de Peso', color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
  } else if (imcNum >= 18.5 && imcNum < 25.08) {
    return { classification: 'Peso normal', color: 'text-green-400', bgColor: 'bg-green-500/10' };
  } else if (imcNum >= 25.08 && imcNum < 30) {
    return { classification: 'Sobrepeso', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
  } else if (imcNum >= 30 && imcNum < 35) {
    return { classification: 'Obesidad Ligera', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
  } else if (imcNum >= 35 && imcNum < 40) {
    return { classification: 'Obesidad', color: 'text-red-400', bgColor: 'bg-red-500/10' };
  } else { // imcNum >= 40
    return { classification: 'Obesidad Grave', color: 'text-red-500', bgColor: 'bg-red-500/20' };
  }
};

const getComparison = (current: number | null, prev: number | null): 'increase' | 'decrease' | 'same' | 'new' | null => {
  if (current === null) return null;
  if (prev === null) return 'new';
  if (current > prev) return 'increase';
  if (current < prev) return 'decrease';
  return 'same';
};

// Fix: Add `date` property to the initial entry data to align with the `formData` state type.
const createInitialEntryData = (): Omit<WeightEntry, 'id' | 'imc'> => {
  return {
      date: '',
      weight: '',
      fatPercentage: '',
      musclePercentage: '',
      visceralFat: '',
      height: '173',
  };
};

const formatFullDisplayDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  if (!isNaN(date.getTime())) {
    const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'long' });
    
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    
    return `${capitalize(weekday)} ${day} de ${capitalize(month)}`;
  }
  return dateString;
};

const MetricDisplay: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | undefined;
  unit: string;
  comparison?: 'increase' | 'decrease' | 'same' | 'new' | null;
  size?: 'large' | 'small';
}> = ({ icon: Icon, label, value, unit, comparison, size = 'large' }) => {
    const hasValue = value && value.trim() !== '';
    
    let colorClass = 'text-white';
    const lowerIsBetterMetrics = ['Peso', 'IMC', 'Grasa Corporal', 'Visceral'];

    if (lowerIsBetterMetrics.includes(label)) {
        // Lower is better: decrease is green, increase is red
        colorClass = comparison === 'increase' ? 'text-red-400' : comparison === 'decrease' ? 'text-green-400' : 'text-white';
    } else {
        // Higher is better (e.g., Muscle) or neutral (e.g., Height)
        colorClass = comparison === 'increase' ? 'text-green-400' : comparison === 'decrease' ? 'text-red-400' : 'text-white';
    }
    
    const iconSize = size === 'large' ? 'w-8 h-8' : 'w-5 h-5';
    const textSize = size === 'large' ? 'text-xl' : 'text-base';
    const labelSize = size === 'large' ? 'text-sm' : 'text-xs';

    return (
        <div className={`flex items-center gap-3 ${size === 'small' ? '' : 'p-4 rounded-lg bg-gray-800/50'}`}>
            <Icon className={`${iconSize} text-cyan-400 flex-shrink-0`} />
            <div>
                <p className={`${labelSize} text-gray-400`}>{label}</p>
                {hasValue ? (
                    <p className={`${textSize} font-bold flex items-center gap-1.5 ${colorClass}`}>
                        {comparison === 'increase' && <ArrowUp className="w-4 h-4" />}
                        {comparison === 'decrease' && <ArrowDown className="w-4 h-4" />}
                        {value}
                        <span className="text-sm font-normal text-gray-400">{unit}</span>
                    </p>
                ) : (
                    <p className={`${textSize} font-bold text-gray-500`}>-</p>
                )}
            </div>
        </div>
    );
};

// NEW COMPONENT: GoalCard
const GoalCard: React.FC<{ latestFatEntry: WeightEntry | null }> = ({ latestFatEntry }) => {
  const latestFatPercentage = parseMetric(latestFatEntry?.fatPercentage);
  const goalMin = 10;
  const goalMax = 15;

  if (latestFatPercentage !== null && latestFatPercentage >= goalMin && latestFatPercentage <= goalMax) {
    // Goal Met State
    return (
      <div className="bg-amber-900/20 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 sm:p-6 text-center animate-zoomInPop flex flex-col sm:flex-row items-center justify-center gap-4">
        <Trophy className="w-12 h-12 text-amber-400 animate-pulse-slow flex-shrink-0" />
        <div>
          <h2 className="text-xl font-extrabold text-amber-300">¡Felicidades! Estás en tu Prime Fisico</h2>
          <p className="text-amber-200/80">Tu porcentaje de grasa corporal ({latestFatPercentage}%) está en el rango ideal.</p>
        </div>
      </div>
    );
  }

  // Goal Not Met or No Data State
  return (
    <div className="bg-gray-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 text-center animate-zoomInPop flex flex-col sm:flex-row items-center justify-center gap-4">
       <div>
         <h2 className="text-xl font-extrabold text-white">
          Grasa Corporal:
          {latestFatPercentage !== null ? (
            <span className="text-cyan-400"> {latestFatPercentage}%</span>
          ) : (
            <span className="text-gray-500"> - %</span>
          )}
        </h2>
        <p className="text-gray-300">
          Meta: 10-15%.
          {latestFatPercentage !== null ? ' ¡Sigue así!' : ' Registra tu % de grasa para ver tu progreso.'}
        </p>
       </div>
    </div>
  );
};

// History Card Component
const HistoryCard: React.FC<{
  entry: WeightEntry;
  previousEntry: WeightEntry | null;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ entry, previousEntry, onEdit, onDelete }) => {

    const comparisons = useMemo(() => {
        const getMetricComparison = (metric: keyof Omit<WeightEntry, 'id'|'date'>) => 
            getComparison(parseMetric(entry[metric]), parseMetric(previousEntry?.[metric]));

        return {
            weight: getMetricComparison('weight'),
            fatPercentage: getMetricComparison('fatPercentage'),
            musclePercentage: getMetricComparison('musclePercentage'),
            visceralFat: getMetricComparison('visceralFat'),
            height: getMetricComparison('height'),
            imc: getMetricComparison('imc'),
        };
    }, [entry, previousEntry]);
    
    const imcData = getImcClassification(entry.imc);

    return (
        <button
            onClick={onEdit}
            className="w-full bg-black/20 rounded-xl p-4 border border-white/10 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            aria-label={`Editar registro de ${formatFullDisplayDate(entry.date)}`}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-bold text-lg text-white">{formatFullDisplayDate(entry.date)}</p>
                </div>
                <div className="flex-shrink-0">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }} 
                        className="relative z-10 p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-500/10" 
                        aria-label="Eliminar registro"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="pt-4 mt-3 border-t border-gray-700/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                    <MetricDisplay size="small" icon={Weight} label="Peso" value={entry.weight} unit="kg" comparison={comparisons.weight} />
                    <MetricDisplay size="small" icon={BarChart4} label="IMC" value={entry.imc} unit="" comparison={comparisons.imc} />
                    <MetricDisplay size="small" icon={Percent} label="Grasa Corporal" value={entry.fatPercentage} unit="%" comparison={comparisons.fatPercentage} />
                    <MetricDisplay size="small" icon={Scale} label="Músculo" value={entry.musclePercentage} unit="%" comparison={comparisons.musclePercentage} />
                </div>
            </div>
            {entry.imc && (
                <div className="flex justify-center mt-4">
                    <p className={`${imcData.bgColor} ${imcData.color} font-semibold px-2 py-0.5 rounded-full text-xs inline-block`}>
                        {imcData.classification}
                    </p>
                </div>
            )}
        </button>
    );
};

// Add/Edit Modal Component
const WeightEntryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<WeightEntry, 'id' | 'imc'>) => void;
  initialData?: WeightEntry | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
    const { todaysDateISO, weightHistory } = useAppContext();
    const [formData, setFormData] = useState<Omit<WeightEntry, 'id' | 'imc'>>(createInitialEntryData());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const { id, imc, ...data } = initialData;
                setFormData(data);
            } else {
                const lastHeight = weightHistory.length > 0 ? weightHistory[0].height : '173';
                setFormData({ ...createInitialEntryData(), date: todaysDateISO, height: lastHeight });
            }
        }
    }, [isOpen, initialData, todaysDateISO, weightHistory]);

    const calculatedIMC = useMemo(() => {
        const weightNum = parseMetric(formData.weight);
        const heightNum = parseMetric(formData.height);
        if (weightNum && weightNum > 0 && heightNum && heightNum > 0) {
            const heightInMeters = heightNum / 100;
            const imc = weightNum / (heightInMeters * heightInMeters);
            return imc.toFixed(2);
        }
        return '';
    }, [formData.weight, formData.height]);
    
    if (!isOpen) return null;
    
    const handleInputChange = (field: keyof Omit<WeightEntry, 'id' | 'imc' | 'date'>, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = () => {
        onSave(formData);
    };

    const inputClasses = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 transition duration-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500/70";

    return (
        <>
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} currentDate={formData.date} onSelectDate={(date) => setFormData(prev => ({...prev, date}))} />
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
                <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold text-cyan-400">{initialData ? 'Editar Registro' : 'Nuevo Registro de Peso'}</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsCalendarOpen(true)} className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 transition text-white text-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/70">
                                <CalendarDays className="w-4 h-4"/>
                                {new Date(formData.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </button>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                        </div>
                    </div>
                    <div className="overflow-y-auto pr-2 space-y-4 no-scrollbar">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Weight className="w-4 h-4 text-cyan-400" />Peso (kg)</label>
                                <input type="text" inputMode="decimal" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Ruler className="w-4 h-4 text-cyan-400" />Altura (cm)</label>
                                <input type="text" inputMode="numeric" value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} className={inputClasses} />
                            </div>
                             <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1">
                                    <BarChart4 className="w-4 h-4 text-cyan-400" />
                                    <span>IMC (calculado)</span>
                                    <button
                                        type="button"
                                        onClick={() => alert(
                                            "El Índice de Masa Corporal (IMC) es una medida que relaciona el peso y la altura para estimar la grasa corporal de una persona.\\n\\n" +
                                            "Fórmula: peso (kg) / [altura (m)]²\\n\\n" +
                                            "Clasificaciones de la OMS:\\n" +
                                            "• Menos de 18.5: Bajo de Peso\\n" +
                                            "• 18.5 - 24.9: Peso normal\\n" +
                                            "• 25.0 - 29.9: Sobrepeso\\n" +
                                            "• 30.0 - 34.9: Obesidad Ligera\\n" +
                                            "• 35.0 - 39.9: Obesidad\\n" +
                                            "• 40.0 o más: Obesidad Grave"
                                        )}
                                        className="text-gray-500 hover:text-cyan-400 transition-colors"
                                        aria-label="Más información sobre IMC"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                    </button>
                                </label>
                                <input type="text" value={calculatedIMC || '...'} readOnly className={`${inputClasses} bg-gray-800/60 cursor-not-allowed text-gray-400 font-bold`} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Percent className="w-4 h-4 text-cyan-400" />% Grasa Corporal</label>
                                <input type="text" inputMode="decimal" value={formData.fatPercentage || ''} onChange={(e) => handleInputChange('fatPercentage', e.target.value)} className={inputClasses} />
                            </div>
                             <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Scale className="w-4 h-4 text-cyan-400" />% Músculo</label>
                                <input type="text" inputMode="numeric" value={formData.musclePercentage || ''} onChange={(e) => handleInputChange('musclePercentage', e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><History className="w-4 h-4 text-cyan-400" />Grasa Visceral (1-59)</label>
                                <input type="text" inputMode="numeric" value={formData.visceralFat || ''} onChange={(e) => handleInputChange('visceralFat', e.target.value)} className={inputClasses} />
                            </div>
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

// Main Page Component
const PesoPage: React.FC = () => {
    const { weightHistory, addWeightEntry, updateWeightEntry, removeWeightEntry } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<WeightEntry | null>(null);

    const handleOpenModal = (entry: WeightEntry | null = null) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const handleSaveEntry = (entryData: Omit<WeightEntry, 'id' | 'imc'>) => {
        if (editingEntry) {
            updateWeightEntry(editingEntry.id, entryData);
        } else {
            addWeightEntry(entryData);
        }
        handleCloseModal();
    };

    const handleConfirmDelete = () => {
        if (entryToDelete) {
            removeWeightEntry(entryToDelete.id);
            setEntryToDelete(null);
        }
    };
    
    const latestEntryWithFat = useMemo(() => 
        weightHistory.find(e => e.fatPercentage && e.fatPercentage.trim() !== '') || null
    , [weightHistory]);

    return (
        <div className="space-y-6 pb-24 animate-fadeInUp">
            <ConfirmationModal
                isOpen={!!entryToDelete}
                onClose={() => setEntryToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Registro"
                message={`¿Seguro que quieres eliminar el registro del ${entryToDelete ? new Date(entryToDelete.date + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}?`}
            />
            <WeightEntryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEntry}
                initialData={editingEntry}
            />
            
            <GoalCard latestFatEntry={latestEntryWithFat} />
            
            {/* History */}
            <div className="space-y-4">
                {weightHistory.length === 0 ? (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="w-full text-center py-8 px-4 border-2 border-dashed border-gray-700 rounded-lg transition-colors hover:bg-gray-800 hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                        <Scale className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-white">Aún no has registrado tu peso</h3>
                        <p className="text-gray-400 mt-1">Haz clic aquí para añadir tu primer registro.</p>
                    </button>
                ) : (
                    weightHistory.map((entry, index) => (
                        <HistoryCard
                            key={entry.id}
                            entry={entry}
                            previousEntry={weightHistory[index + 1] || null}
                            onEdit={() => handleOpenModal(entry)}
                            onDelete={() => setEntryToDelete(entry)}
                        />
                    ))
                )}
            </div>

            <button
                onClick={() => handleOpenModal()}
                className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 w-16 h-16 flex items-center justify-center z-20"
                aria-label="Añadir nuevo registro de peso"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
    );
};

export default PesoPage;