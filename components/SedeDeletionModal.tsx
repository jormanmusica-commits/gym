
import React from 'react';
import { AlertTriangle, Trash2, Building } from 'lucide-react';

interface SedeDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeleteOnly: () => void;
  onConfirmDeleteAll: () => void;
  sedeName: string;
}

const SedeDeletionModal: React.FC<SedeDeletionModalProps> = ({ isOpen, onClose, onConfirmDeleteOnly, onConfirmDeleteAll, sedeName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-scaleIn text-center" 
        onClick={e => e.stopPropagation()}
      >
        <AlertTriangle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Eliminar Sede "{sedeName}"</h3>
        <p className="text-gray-400 mb-6">Elige una opción. Esta acción no se puede deshacer.</p>
        
        <div className="space-y-4">
          <button 
            onClick={onConfirmDeleteOnly} 
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:brightness-110 text-white font-bold p-4 rounded-lg transition-all btn-active flex items-start text-left"
          >
            <Building className="w-8 h-8 mr-4 flex-shrink-0" />
            <div>
              <span className="font-bold">Eliminar solo la Sede</span>
              <p className="text-sm font-normal text-yellow-100">Los registros de ejercicios y cardio se conservarán en el Resumen.</p>
            </div>
          </button>
          
          <button 
            onClick={onConfirmDeleteAll} 
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold p-4 rounded-lg transition-all btn-active flex items-start text-left"
          >
            <Trash2 className="w-8 h-8 mr-4 flex-shrink-0" />
            <div>
              <span className="font-bold">Eliminar Sede Y Todos Sus Datos</span>
              <p className="text-sm font-normal text-red-100">Esta acción es permanente y eliminará todos los registros asociados.</p>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-center">
            <button 
              onClick={onClose} 
              className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-8 rounded-md transition-all btn-active"
            >
              Cancelar
            </button>
        </div>
      </div>
    </div>
  );
};

export default SedeDeletionModal;
