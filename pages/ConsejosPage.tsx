

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Lightbulb, Plus, Trash2, Camera, X, Pencil, Check, ChevronLeft, ChevronRight, ClipboardPaste } from 'lucide-react';
import type { ConsejoItem, ExerciseMedia, LinkItem } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import VideoPlayerModal from '../components/VideoPlayerModal';

// Local Lightbox component (reused from other pages for consistency)
interface MediaLightboxProps {
  allMedia: ExerciseMedia[];
  startIndex: number;
  onClose: () => void;
  onDelete?: (indexToDelete: number) => void;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({ allMedia, startIndex, onClose, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : allMedia.length - 1));
    };
    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev < allMedia.length - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setCurrentIndex(prev => (prev > 0 ? prev - 1 : allMedia.length - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentIndex(prev => (prev < allMedia.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [allMedia.length, onClose]);
    
    if (!allMedia || allMedia.length === 0) return null;
    const currentMedia = allMedia[currentIndex];
    if (!currentMedia) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
            <button className="absolute top-4 right-4 text-white hover:text-cyan-400 transition z-20" aria-label="Cerrar vista previa" onClick={onClose}>
                <X className="w-8 h-8" />
            </button>
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(currentIndex);
                    }}
                    className="absolute bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 z-20 transition-transform duration-200 ease-in-out hover:scale-110"
                    aria-label="Eliminar media"
                >
                    <Trash2 className="w-6 h-6" />
                </button>
            )}

            {allMedia.length > 1 && (
                <>
                    <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110" aria-label="Anterior"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110" aria-label="Siguiente"><ChevronRight className="w-6 h-6" /></button>
                </>
            )}

            <div className="relative max-w-[90vw] max-h-[90vh] animate-scaleIn flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {currentMedia.type === 'image' ? (
                    <img src={currentMedia.dataUrl} alt="Vista previa" className="max-w-full max-h-full object-contain" />
                ) : (
                    <video src={currentMedia.dataUrl} controls autoPlay className="max-w-full max-h-full object-contain" />
                )}
            </div>
            
            {allMedia.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm rounded-full px-3 py-1 z-10">{currentIndex + 1} / {allMedia.length}</div>
            )}
        </div>
    );
};


const createInitialConsejoData = (): Omit<ConsejoItem, 'id' | 'createdAt'> => ({
    title: '',
    content: '',
    media: [],
    videoLinks: [],
});

const ConsejosPage: React.FC = () => {
    const { consejos, addConsejo, updateConsejo, removeConsejo, removeConsejoMedia, addConsejoVideoLink, removeConsejoVideoLink, updateConsejoVideoLinkName } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConsejo, setEditingConsejo] = useState<ConsejoItem | null>(null);
    const [consejoToDelete, setConsejoToDelete] = useState<ConsejoItem | null>(null);
    const [lightboxMedia, setLightboxMedia] = useState<{ allMedia: ExerciseMedia[]; startIndex: number; consejoId: string; } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // States for video links on main cards
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
    const [editingLink, setEditingLink] = useState<{ consejoId: string; linkId: string; name: string } | null>(null);
    const [linkToDelete, setLinkToDelete] = useState<{ consejoId: string; linkId: string; name: string } | null>(null);

    // States for the modal form
    const [formData, setFormData] = useState(createInitialConsejoData());

    useEffect(() => {
      if (isModalOpen) {
          setFormData(editingConsejo || createInitialConsejoData());
      }
    }, [isModalOpen, editingConsejo]);

    const handleOpenModal = (consejo: ConsejoItem | null = null) => {
        setEditingConsejo(consejo);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingConsejo(null);
    };
    
    const handleSave = () => {
        if (editingConsejo) {
            updateConsejo(editingConsejo.id, formData);
        } else {
            addConsejo(formData);
        }
        handleCloseModal();
    };

    const handleConfirmDelete = () => {
        if (consejoToDelete) {
            removeConsejo(consejoToDelete.id);
            setConsejoToDelete(null);
        }
    };
    
    const handleConfirmLinkDelete = () => {
      if (linkToDelete) {
        removeConsejoVideoLink(linkToDelete.consejoId, linkToDelete.linkId);
        setLinkToDelete(null);
      }
    };

    const handleSaveLinkName = () => {
      if (editingLink) {
        updateConsejoVideoLinkName(editingLink.consejoId, editingLink.linkId, editingLink.name);
        setEditingLink(null);
      }
    };

    const handleDeleteMediaFromConsejo = (consejoId: string, mediaIndex: number) => {
        removeConsejoMedia(consejoId, mediaIndex);
        setLightboxMedia(null); // Close lightbox after deletion
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const mediaType = file.type.startsWith('image') ? 'image' : 'video';
                const newMedia: ExerciseMedia = { type: mediaType, dataUrl };
                
                setFormData(prev => ({...prev, media: [...prev.media, newMedia] }));
            };
            reader.readAsDataURL(file);
        }
        if(event.target) event.target.value = '';
    };
    
    const handlePasteVideoLinkInModal = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
            const currentLinks = formData.videoLinks || [];
            if (currentLinks.some(l => l.url === text.trim())) return;
            const newLink: LinkItem = { id: crypto.randomUUID(), url: text.trim(), name: `Video ${currentLinks.length + 1}` };
            setFormData(prev => ({ ...prev, videoLinks: [...currentLinks, newLink] }));
        }
      } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
      }
    };

    const inputClasses = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 transition duration-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500/70";

    return (
        <div className="space-y-4 pb-24">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            
            <VideoPlayerModal isOpen={!!selectedVideoUrl} onClose={() => setSelectedVideoUrl(null)} videoUrl={selectedVideoUrl || ''} />
            
            {lightboxMedia && <MediaLightbox 
                allMedia={lightboxMedia.allMedia}
                startIndex={lightboxMedia.startIndex}
                onClose={() => setLightboxMedia(null)}
                onDelete={(indexToDelete) => handleDeleteMediaFromConsejo(lightboxMedia.consejoId, indexToDelete)}
            />}

            <ConfirmationModal 
                isOpen={!!consejoToDelete} 
                onClose={() => setConsejoToDelete(null)} 
                onConfirm={handleConfirmDelete} 
                title="Eliminar Consejo" 
                message={`¿Seguro que quieres eliminar la nota "${consejoToDelete?.title || 'sin título'}"?`}
            />

            <ConfirmationModal
              isOpen={!!linkToDelete}
              onClose={() => setLinkToDelete(null)}
              onConfirm={handleConfirmLinkDelete}
              title="Eliminar Video"
              message={`¿Estás seguro de que quieres eliminar el video "${linkToDelete?.name}"?`}
            />
            
            {/* Modal for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={handleCloseModal}>
                    <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h2 className="text-xl font-bold text-cyan-400">{editingConsejo ? 'Editar Consejo' : 'Nuevo Consejo'}</h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto pr-2 space-y-4 no-scrollbar">
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título de la nota" className={`${inputClasses} font-bold text-lg`} />
                            <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Escribe tu consejo o nota aquí..." className={`${inputClasses} h-40 resize-none`} />
                            
                            <div>
                              <h3 className="text-sm font-semibold text-gray-400 mb-2">Imágenes / Videos</h3>
                              <div className="flex flex-wrap gap-2">
                                  {formData.media.map((mediaItem, index) => (
                                      <div key={index} className="relative w-20 h-20 group">
                                          {mediaItem.type === 'image' ? <img src={mediaItem.dataUrl} className="rounded-lg object-cover w-full h-full" alt="" /> : <video src={mediaItem.dataUrl} muted loop playsInline className="rounded-lg object-cover w-full h-full" />}
                                          <button onClick={() => setFormData({...formData, media: formData.media.filter((_, i) => i !== index)})} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                      </div>
                                  ))}
                                  <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500 transition-colors">
                                      <Camera className="w-8 h-8"/>
                                  </button>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-semibold text-gray-400 mb-2">Links de Video</h3>
                               <div className="flex flex-wrap gap-2">
                                  {(formData.videoLinks || []).map((link, index) => (
                                      <div key={link.id} className="relative group bg-cyan-600 text-white font-semibold text-sm py-1 px-3 rounded-full flex items-center gap-2">
                                          <span>{link.name}</span>
                                          <button onClick={() => setFormData({...formData, videoLinks: (formData.videoLinks || []).filter(l => l.id !== link.id)})} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                                      </div>
                                  ))}
                                  <button onClick={handlePasteVideoLinkInModal} className="bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-orange-400 hover:border-orange-500 transition-colors py-1 px-3 gap-2 text-sm">
                                      <ClipboardPaste className="w-4 h-4"/> Pegar
                                  </button>
                              </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-4 flex-shrink-0">
                            <button onClick={handleCloseModal} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition">Cancelar</button>
                            <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Content */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6">
                <h1 className="text-2xl font-extrabold text-cyan-400 flex items-center justify-center gap-3 uppercase tracking-wider mb-6">
                    <Lightbulb className="w-7 h-7" />
                    Consejos
                </h1>
                
                <div className="space-y-4">
                    {consejos.length === 0 ? (
                         <div className="text-center p-8 border-2 border-dashed border-gray-600/50 rounded-lg animate-fadeIn">
                            <Lightbulb className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white">Tu bloc de notas personal</h3>
                            <p className="text-gray-400 mt-1">Añade tus primeros consejos, notas o recordatorios usando el botón `+`.</p>
                         </div>
                    ) : (
                        consejos.map((consejo, index) => (
                            <div key={consejo.id} style={{ animationDelay: `${index * 50}ms` }} className="bg-black/20 rounded-xl border border-white/10 p-4 animate-zoomInPop opacity-0">
                                <div className="flex justify-between items-start gap-4">
                                    <h3 className="font-bold text-lg text-white">{consejo.title || "Nota sin título"}</h3>
                                    <div className="flex-shrink-0 flex items-center gap-1">
                                        <button onClick={() => handleOpenModal(consejo)} className="p-2 text-gray-400 hover:text-cyan-400 transition rounded-full hover:bg-cyan-500/10" aria-label="Editar consejo"><Pencil className="w-5 h-5"/></button>
                                        <button onClick={() => setConsejoToDelete(consejo)} className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-500/10" aria-label="Eliminar consejo"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                {consejo.content && <p className="text-gray-300 mt-2 whitespace-pre-wrap">{consejo.content}</p>}
                                {consejo.media.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {consejo.media.map((mediaItem, index) => (
                                            <button key={index} onClick={() => setLightboxMedia({ allMedia: consejo.media, startIndex: index, consejoId: consejo.id})} className="relative w-24 h-24 group rounded-lg overflow-hidden">
                                                {mediaItem.type === 'image' ? (
                                                    <img src={mediaItem.dataUrl} alt={`Media ${index + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                ) : (
                                                    <video src={mediaItem.dataUrl} muted loop playsInline className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {(consejo.videoLinks || []).length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Videos de Referencia</h4>
                                      <ul className="space-y-2">
                                        {(consejo.videoLinks || []).map(link => (
                                          <li key={link.id} className="bg-gray-700/50 rounded-md">
                                            {editingLink?.linkId === link.id ? (
                                              <div className="flex items-center p-2 gap-2">
                                                <input
                                                  type="text"
                                                  value={editingLink.name}
                                                  onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLinkName()}
                                                  onBlur={handleSaveLinkName}
                                                  className="flex-grow bg-gray-600 text-white font-bold py-2 px-4 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                                  autoFocus
                                                />
                                                <button onClick={handleSaveLinkName} className="text-green-400 hover:text-green-300 p-1"><Check className="w-5 h-5"/></button>
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
                                                <button onClick={(e) => { e.stopPropagation(); setEditingLink({ consejoId: consejo.id, linkId: link.id, name: link.name })}} className="absolute top-1/2 -translate-y-1/2 left-2 text-white hover:text-cyan-400 transition p-1.5 bg-black/40 rounded-full opacity-0 group-hover:opacity-100" aria-label={`Editar nombre de ${link.name}`}><Pencil className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setLinkToDelete({ consejoId: consejo.id, linkId: link.id, name: link.name }) }} className="absolute top-1/2 -translate-y-1/2 right-2 text-white hover:text-red-500 transition p-1.5 bg-black/40 rounded-full opacity-0 group-hover:opacity-100" aria-label={`Eliminar ${link.name}`}><Trash2 className="w-4 h-4" /></button>
                                              </div>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                  </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <button
                onClick={() => handleOpenModal()}
                className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 w-16 h-16 flex items-center justify-center z-20"
                aria-label="Añadir nuevo consejo"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
    );
};

export default ConsejosPage;
