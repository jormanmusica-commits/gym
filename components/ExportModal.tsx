
import React from 'react';
import { FileJson, FileText, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJson: () => void;
  onExportText: () => void;
  title: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExportJson, onExportText, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-scaleIn text-center" 
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex justify-center items-center mb-6">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="absolute -top-2 -right-2 text-gray-400 hover:text-white transition-colors" aria-label="Cerrar">
              <X className="w-6 h-6" />
            </button>
        </div>

        <p className="text-gray-400 mb-6">Elige el formato para guardar tus datos.</p>
        
        <div className="space-y-4">
          <button 
            onClick={onExportJson} 
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold p-4 rounded-lg transition-all btn-active flex items-start text-left"
          >
            <FileJson className="w-10 h-10 mr-4 flex-shrink-0" />
            <div>
              <span className="font-bold">Archivo JSON</span>
              <p className="text-sm font-normal text-blue-100">Copia de seguridad completa. Se puede importar de nuevo a la aplicación.</p>
            </div>
          </button>
          
          <button 
            onClick={onExportText} 
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-white font-bold p-4 rounded-lg transition-all btn-active flex items-start text-left"
          >
            <FileText className="w-10 h-10 mr-4 flex-shrink-0" />
            <div>
              <span className="font-bold">Texto para Notas</span>
              <p className="text-sm font-normal text-green-100">Formato legible para copiar en notas o compartir. No se puede importar.</p>
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

export default ExportModal;
