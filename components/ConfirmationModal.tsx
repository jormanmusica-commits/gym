import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-sm m-4 animate-scaleIn text-center" 
        onClick={e => e.stopPropagation()}
      >
        <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-all btn-active"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition-all btn-active"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
