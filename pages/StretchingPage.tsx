
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, Sparkles, X, ClipboardPaste, Pencil, Check } from 'lucide-react';
import VideoPlayerModal from '../components/VideoPlayerModal';
import ConfirmationModal from '../components/ConfirmationModal';

const StretchingPage: React.FC = () => {
  const { stretchingLinks, addStretchingLink, removeStretchingLink, updateStretchingLinkName } = useAppContext();
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{ id: string; name: string } | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<{ id: string; name: string } | null>(null);

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
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 w-full max-w-2xl mx-auto animate-fadeInUp">
        <div className="flex justify-center items-center mb-6">
          <h1 id="stretching-manager-title" className="text-2xl font-extrabold text-cyan-400 flex items-center gap-3 uppercase tracking-wider">
            <Sparkles className="w-7 h-7" />
            Estiramientos
          </h1>
        </div>
        <div className="flex justify-center mb-6">
          <button
            onClick={handlePaste}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            aria-label="Pegar y agregar link del portapapeles"
          >
            <ClipboardPaste className="w-5 h-5" />
            <span>Pegar Video</span>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {stretchingLinks.length > 0 ? (
            <ul className="space-y-3">
              {stretchingLinks.map((link) => (
                <li
                  key={link.id}
                  className="bg-gray-700/50 rounded-md"
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
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 text-center truncate"
                      >
                        {link.name}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingLink({id: link.id, name: link.name}) }}
                        className="absolute top-1/2 -translate-y-1/2 left-2 text-white hover:text-cyan-400 transition p-1.5 bg-black/40 rounded-full opacity-0 group-hover:opacity-100" 
                        aria-label={`Editar nombre de ${link.name}`}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLinkToDelete({ id: link.id, name: link.name }); }}
                        className="absolute top-1/2 -translate-y-1/2 right-2 text-white hover:text-red-500 transition p-1.5 bg-black/40 rounded-full opacity-0 group-hover:opacity-100"
                        aria-label={`Eliminar ${link.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                 )}
                </li>
              ))}
            </ul>
          ) : (
             <div className="text-center p-8 border-2 border-dashed border-gray-600/50 rounded-lg">
                <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white">Aún no hay videos</h3>
                <p className="text-gray-400 mt-1">Usa el botón "Pegar Video" para añadir tu primer enlace de estiramiento.</p>
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StretchingPage;
