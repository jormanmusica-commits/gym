import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, Sparkles, X, ClipboardPaste, Pencil, Check } from 'lucide-react';
import VideoPlayerModal from '../components/VideoPlayerModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface StretchingManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const StretchingManager: React.FC<StretchingManagerProps> = ({ isOpen, onClose }) => {
  const { stretchingLinks, addStretchingLink, removeStretchingLink, updateStretchingLinkName } = useAppContext();
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{ id: string; name: string } | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<{ id: string; name: string } | null>(null);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        addStretchingLink(text.trim());
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };
  
  const handleSaveName = () => {
    if (editingLink && editingLink.name.trim()) {
      updateStretchingLinkName(editingLink.id, editingLink.name.trim());
    }
    setEditingLink(null);
  };
  
  const handleConfirmDelete = () => {
    if (linkToDelete) {
      removeStretchingLink(linkToDelete.id);
      setLinkToDelete(null);
    }
  };

  return (
    <>
      <VideoPlayerModal 
        isOpen={!!selectedVideoUrl}
        onClose={() => setSelectedVideoUrl(null)}
        videoUrl={selectedVideoUrl || ''}
      />
      <ConfirmationModal
        isOpen={!!linkToDelete}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Video de Estiramiento"
        message={`¿Estás seguro de que quieres eliminar el video "${linkToDelete?.name}"?`}
      />
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stretching-manager-title"
      >
        <div 
          className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex justify-center items-center mb-4">
            <h3 id="stretching-manager-title" className="text-xl font-bold text-cyan-400 flex items-center gap-2 uppercase">
              <Sparkles className="w-6 h-6" />
              Estiramientos
            </h3>
            <button onClick={onClose} className="absolute right-0 text-gray-400 hover:text-white transition-colors" aria-label="Cerrar">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex justify-center mb-4">
            <button
              onClick={handlePaste}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
              aria-label="Pegar y agregar link del portapapeles"
            >
              <ClipboardPaste className="w-5 h-5" />
              <span>Pegar Video</span>
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto pr-2">
            {stretchingLinks.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {stretchingLinks.map((link) => (
                  <li
                    key={link.id}
                    className="bg-gray-700/50 rounded-md w-full"
                  >
                   {editingLink?.id === link.id ? (
                      <div className="flex items-center p-2 gap-2">
                        <input
                          type="text"
                          value={editingLink.name}
                          onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                          onBlur={handleSaveName}
                          className="flex-grow bg-gray-600 text-white font-bold py-2 px-4 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                          autoFocus
                        />
                        <button onClick={handleSaveName} className="text-green-400 hover:text-green-300 p-1"><Check className="w-5 h-5"/></button>
                        <button onClick={() => setEditingLink(null)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5"/></button>
                      </div>
                   ) : (
                      <div className="relative group">
                        <button
                          onClick={() => setSelectedVideoUrl(link.url)}
                          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 text-center truncate"
                        >
                          {link.name}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingLink({id: link.id, name: link.name}) }}
                          className="absolute top-1 left-1 text-white hover:text-cyan-400 transition p-1 bg-black/40 rounded-full" 
                          aria-label={`Editar nombre de ${link.name}`}>
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLinkToDelete({ id: link.id, name: link.name }); }}
                          className="absolute top-1 right-1 text-white hover:text-red-500 transition p-1 bg-black/40 rounded-full"
                          aria-label={`Eliminar ${link.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                   )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StretchingManager;