import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, PersonStanding, ClipboardPaste, Pencil, Check, X } from 'lucide-react';
import VideoPlayerModal from './VideoPlayerModal';
import ConfirmationModal from './ConfirmationModal';

const PostureManager: React.FC = () => {
  const { postureLinks, addPostureLink, removePostureLink, updatePostureLinkName } = useAppContext();
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{ id: string; name: string } | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<{ id: string; name: string } | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        addPostureLink(text.trim());
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };
  
  const handleSaveName = () => {
    if (editingLink && editingLink.name.trim()) {
      updatePostureLinkName(editingLink.id, editingLink.name.trim());
    }
    setEditingLink(null);
  };

  const handleConfirmDelete = () => {
    if (linkToDelete) {
      removePostureLink(linkToDelete.id);
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
        title="Eliminar Video de Postura"
        message={`¿Estás seguro de que quieres eliminar el video "${linkToDelete?.name}"?`}
      />
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <h3 className="text-xl font-extrabold mb-4 text-cyan-400 flex items-center justify-center gap-2 uppercase tracking-wider">
          <PersonStanding className="w-6 h-6" />
          Postura
        </h3>
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
        <div>
          {postureLinks.length > 0 && (
            <ul className="space-y-2">
              {postureLinks.map((link) => (
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
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 text-center truncate"
                      >
                        {link.name}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingLink({id: link.id, name: link.name}) }}
                        className="absolute top-1 left-1 text-white hover:text-cyan-400 transition p-1 bg-black/40 rounded-full opacity-0 group-hover:opacity-100" 
                        aria-label={`Editar nombre de ${link.name}`}>
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLinkToDelete({ id: link.id, name: link.name }); }}
                        className="absolute top-1 right-1 text-white hover:text-red-500 transition p-1 bg-black/40 rounded-full opacity-0 group-hover:opacity-100"
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
    </>
  );
};

export default PostureManager;