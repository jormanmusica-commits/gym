
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, X, ClipboardPaste, Pencil, Check, Shirt, Footprints, Shield, Hand, Layers3, Dumbbell, HeartPulse } from 'lucide-react';
import VideoPlayerModal from './VideoPlayerModal';
import ConfirmationModal from './ConfirmationModal';

const dayConfig: { [key: string]: { title: string; groups: string[]; icon: React.ElementType } } = {
  'Día 1': { title: 'Pecho y Bíceps', groups: ['Pecho', 'Bíceps'], icon: Shirt },
  'Día 2': { title: 'Pierna y Glúteo', groups: ['Pierna', 'Glúteo'], icon: Footprints },
  'Día 3': { title: 'Hombro y Espalda', groups: ['Hombro', 'Espalda'], icon: Shield },
  'Día 4': { title: 'Tríceps y Antebrazo', groups: ['Tríceps', 'Antebrazo'], icon: Hand },
  'Día 5': { title: 'Combinados', groups: ['General'], icon: HeartPulse },
};

interface MuscleLinkManagerProps {
  dayName: string;
  muscleName: string;
  onPlayVideo: (url: string) => void;
}

const MuscleLinkManager: React.FC<MuscleLinkManagerProps> = ({ dayName, muscleName, onPlayVideo }) => {
  const { muscleGroupLinks, addMuscleGroupLink, removeMuscleGroupLink, updateMuscleGroupLinkName } = useAppContext();
  const links = muscleGroupLinks[dayName]?.[muscleName] || [];
  const [editingLink, setEditingLink] = useState<{ id: string; name: string } | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<{ id: string; name: string } | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        addMuscleGroupLink(dayName, muscleName, text.trim());
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleSaveName = () => {
    if (editingLink && editingLink.name.trim()) {
      updateMuscleGroupLinkName(dayName, muscleName, editingLink.id, editingLink.name.trim());
    }
    setEditingLink(null);
  };
  
  const handleConfirmDelete = () => {
    if (linkToDelete) {
      removeMuscleGroupLink(dayName, muscleName, linkToDelete.id);
      setLinkToDelete(null);
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={!!linkToDelete}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar Video de ${muscleName}`}
        message={`¿Estás seguro de que quieres eliminar el video "${linkToDelete?.name}"?`}
      />
      <div className="bg-gray-900/40 p-3 rounded-lg">
        <h4 className="text-base font-bold mb-3 text-white text-center uppercase">{muscleName}</h4>
        <div className="flex justify-center mb-3">
          <button
            onClick={handlePaste}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm"
            aria-label={`Pegar y agregar link para ${muscleName}`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Pegar Video</span>
          </button>
        </div>
        {links.length > 0 && (
          <ul className="space-y-1.5">
            {links.map((link) => (
              <li key={link.id} className="bg-gray-700/50 rounded-md">
                {editingLink?.id === link.id ? (
                  <div className="flex items-center p-1.5 gap-1">
                    <input
                      type="text"
                      value={editingLink.name}
                      onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      onBlur={handleSaveName}
                      className="flex-grow bg-gray-600 text-white font-bold py-1.5 px-3 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="text-green-400 hover:text-green-300 p-1"><Check className="w-5 h-5"/></button>
                    <button onClick={() => setEditingLink(null)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5"/></button>
                  </div>
                ) : (
                  <div className="relative group">
                    <button 
                      onClick={() => onPlayVideo(link.url)} 
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold py-1.5 px-3 rounded-md transition-all duration-300 text-center truncate text-sm">
                      {link.name}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingLink({ id: link.id, name: link.name })}} 
                      className="absolute top-1 left-1 text-white hover:text-cyan-400 transition p-1 bg-black/40 rounded-full opacity-0 group-hover:opacity-100" aria-label={`Editar nombre de ${link.name}`}>
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
    </>
  );
};

interface MuscleGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayName: string;
  config: { title: string; groups: string[]; icon: React.ElementType };
}

const MuscleGroupModal: React.FC<MuscleGroupModalProps> = ({ isOpen, onClose, dayName, config }) => {
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const Icon = config.icon || Layers3;

  return (
    <>
      <VideoPlayerModal 
        isOpen={!!selectedVideoUrl}
        onClose={() => setSelectedVideoUrl(null)}
        videoUrl={selectedVideoUrl || ''}
      />
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="muscle-group-modal-title"
      >
        <div
          className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-xl m-4 animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex justify-center items-center mb-6">
            <h3 id="muscle-group-modal-title" className="text-xl font-bold text-cyan-400 flex items-center gap-2 uppercase">
              <Icon className="w-6 h-6" />
              {config.title}
            </h3>
            <button onClick={onClose} className="absolute right-0 text-gray-400 hover:text-white transition-colors" aria-label="Cerrar">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {config.groups.map((groupName) => (
              <MuscleLinkManager key={groupName} dayName={dayName} muscleName={groupName} onPlayVideo={setSelectedVideoUrl} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

interface MuscleGroupLinksProps {
  dayName: string;
}

const MuscleGroupLinks: React.FC<MuscleGroupLinksProps> = ({ dayName }) => {
  const config = dayConfig[dayName];
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!config) {
    return null;
  }
  
  const Icon = config.icon || Layers3;
  const isCardioDay = dayName === 'Día 5';

  if (isCardioDay) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-2">
        <h3 className="text-2xl font-extrabold text-cyan-400 flex items-center justify-center gap-3 uppercase p-2 tracking-wider">
            <Icon className="w-7 h-7" />
            {config.title}
        </h3>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-2 transition-all duration-300 hover:border-cyan-400/30">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 rounded-lg"
          aria-label={`Abrir gestor de ${config.title}`}
        >
          <h3 className="text-2xl font-extrabold text-cyan-400 flex items-center justify-center gap-3 uppercase group-hover:text-cyan-300 transition-colors p-2 tracking-wider">
              <Icon className="w-7 h-7 group-hover:scale-110 transition-transform" />
              {config.title}
          </h3>
        </button>
      </div>
      <MuscleGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayName={dayName}
        config={config}
      />
    </>
  );
};

export default MuscleGroupLinks;
