
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Lightbulb, Plus, Trash2, Camera, X, Pencil, Check, ChevronLeft, ChevronRight, ClipboardPaste, Shirt, Footprints, Shield, Hand, HeartPulse, Video, GripVertical } from 'lucide-react';
import type { ConsejoItem, ExerciseMedia, LinkItem } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { extractUrl } from '../lib/utils';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const dayConfig: { [key: string]: { title: string; groups: string[]; icon: React.ElementType } } = {
    'Día 1': { title: 'Pecho y Bíceps', groups: ['Pecho', 'Bíceps'], icon: Shirt },
    'Día 2': { title: 'Pierna y Glúteo', groups: ['Pierna', 'Glúteo'], icon: Footprints },
    'Día 3': { title: 'Hombro y Espalda', groups: ['Hombro', 'Espalda'], icon: Shield },
    'Día 4': { title: 'Tríceps y Antebrazo', groups: ['Tríceps', 'Antebrazo'], icon: Hand },
    'Día 5': { title: 'Combinados', groups: ['General'], icon: HeartPulse },
};

const SortableVideoLink: React.FC<{
    link: LinkItem;
    type: 'muscle' | 'stretching' | 'posture';
    day?: string;
    muscle?: string;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ link, type, day, muscle, onEdit, onDelete }) => {
    const uniqueId = `${type}|${day || ''}|${muscle || ''}|${link.id}`;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: uniqueId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : 0
    };

    const bgColor = type === 'muscle' ? 'bg-cyan-600/10 hover:bg-cyan-600/20' : 
                   type === 'stretching' ? 'bg-green-600/5 hover:bg-green-600/10' : 
                   'bg-purple-600/5 hover:bg-purple-600/10';
    
    const borderColor = type === 'muscle' ? 'border-cyan-500/20' : 
                       type === 'stretching' ? 'border-green-500/10' : 
                       'border-purple-500/10';

    const textColor = type === 'muscle' ? 'text-cyan-300' : 
                     type === 'stretching' ? 'text-green-300' : 
                     'text-purple-300';

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="flex items-center gap-1 group relative"
        >
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                title="Mantén presionado para mover"
            >
                <GripVertical className="w-3.5 h-3.5" />
            </div>
            
            <div className={`flex-grow flex items-center justify-between ${bgColor} ${borderColor} border rounded-md transition-all duration-300 overflow-hidden`}>
                <button
                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                    className={`flex-grow text-left truncate py-2 px-3 text-xs font-semibold ${textColor}`}
                    title="Abrir video"
                >
                    {link.name}
                </button>
                
                <div className="flex items-center h-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 px-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 text-gray-300 hover:text-cyan-400 transition-colors"
                        title="Renombrar"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConsejosPage: React.FC = () => {
    const { 
        consejos, addConsejo, updateConsejo, removeConsejo, removeConsejoMedia, 
        addConsejoVideoLink, removeConsejoVideoLink, updateConsejoVideoLinkName,
        muscleGroupLinks, stretchingLinks, postureLinks,
        addMuscleGroupLink, addStretchingLink, addPostureLink,
        removeMuscleGroupLink, updateMuscleGroupLinkName,
        removeStretchingLink, updateStretchingLinkName,
        removePostureLink, updatePostureLinkName,
        reorderMuscleGroupLinks, reorderStretchingLinks, reorderPostureLinks, 
        moveMuscleGroupLink,
        moveStretchingToMuscleGroup, movePostureToMuscleGroup,
        moveMuscleGroupToStretching, moveMuscleGroupToPosture
    } = useAppContext();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConsejo, setEditingConsejo] = useState<ConsejoItem | null>(null);
    const [consejoToDelete, setConsejoToDelete] = useState<ConsejoItem | null>(null);
    const [lightboxMedia, setLightboxMedia] = useState<{ allMedia: ExerciseMedia[]; startIndex: number; consejoId: string; } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState(createInitialConsejoData());
    
    // States for video links on main cards (Consejos)
    const [editingLink, setEditingLink] = useState<{ consejoId: string; linkId: string; name: string } | null>(null);
    const [linkToDelete, setLinkToDelete] = useState<{ consejoId: string; linkId: string; name: string } | null>(null);

    // States for Library Links
    const [editingLibLink, setEditingLibLink] = useState<{ type: 'muscle' | 'stretching' | 'posture'; id: string; name: string; day?: string; muscle?: string } | null>(null);
    const [libLinkToDelete, setLibLinkToDelete] = useState<{ type: 'muscle' | 'stretching' | 'posture'; id: string; name: string; day?: string; muscle?: string } | null>(null);

    // Drag and Drop State and Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 250, // Long press simulation
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        if (activeId === overId) return;

        const [activeType, activeDay, activeGroup, activeLinkId] = activeId.split('|');
        const [overType, overDay, overGroup, overLinkId] = overId.split('|');

        // Handle Reordering within same container
        if (activeType === overType && activeDay === overDay && activeGroup === overGroup) {
            if (activeType === 'muscle') {
                const links = muscleGroupLinks[activeDay]?.[activeGroup] || [];
                const oldIndex = links.findIndex(l => l.id === activeLinkId);
                const newIndex = links.findIndex(l => l.id === overLinkId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    reorderMuscleGroupLinks(activeDay, activeGroup, arrayMove(links, oldIndex, newIndex));
                }
            } else if (activeType === 'stretching') {
                const oldIndex = stretchingLinks.findIndex(l => l.id === activeLinkId);
                const newIndex = stretchingLinks.findIndex(l => l.id === overLinkId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    reorderStretchingLinks(arrayMove(stretchingLinks, oldIndex, newIndex));
                }
            } else if (activeType === 'posture') {
                const oldIndex = postureLinks.findIndex(l => l.id === activeLinkId);
                const newIndex = postureLinks.findIndex(l => l.id === overLinkId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    reorderPostureLinks(arrayMove(postureLinks, oldIndex, newIndex));
                }
            }
            return;
        }

        // Handle Moving between containers
        if (activeType === 'muscle' && overType === 'muscle') {
            moveMuscleGroupLink(activeDay, activeGroup, overDay, overGroup, activeLinkId);
        } else if (activeType === 'stretching' && overType === 'muscle') {
            moveStretchingToMuscleGroup(activeLinkId, overDay, overGroup);
        } else if (activeType === 'posture' && overType === 'muscle') {
            movePostureToMuscleGroup(activeLinkId, overDay, overGroup);
        } else if (activeType === 'muscle' && overType === 'stretching') {
            moveMuscleGroupToStretching(activeDay, activeGroup, activeLinkId);
        } else if (activeType === 'muscle' && overType === 'posture') {
            moveMuscleGroupToPosture(activeDay, activeGroup, activeLinkId);
        }
    };

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

    const handleConfirmLibLinkDelete = () => {
        if (!libLinkToDelete) return;
        if (libLinkToDelete.type === 'muscle' && libLinkToDelete.day && libLinkToDelete.muscle) {
            removeMuscleGroupLink(libLinkToDelete.day, libLinkToDelete.muscle, libLinkToDelete.id);
        } else if (libLinkToDelete.type === 'stretching') {
            removeStretchingLink(libLinkToDelete.id);
        } else if (libLinkToDelete.type === 'posture') {
            removePostureLink(libLinkToDelete.id);
        }
        setLibLinkToDelete(null);
    };

    const handleSaveLibLinkName = () => {
        if (!editingLibLink || !editingLibLink.name.trim()) {
            setEditingLibLink(null);
            return;
        }
        if (editingLibLink.type === 'muscle' && editingLibLink.day && editingLibLink.muscle) {
            updateMuscleGroupLinkName(editingLibLink.day, editingLibLink.muscle, editingLibLink.id, editingLibLink.name.trim());
        } else if (editingLibLink.type === 'stretching') {
            updateStretchingLinkName(editingLibLink.id, editingLibLink.name.trim());
        } else if (editingLibLink.type === 'posture') {
            updatePostureLinkName(editingLibLink.id, editingLibLink.name.trim());
        }
        setEditingLibLink(null);
    };

    const handleSaveLinkName = () => {
      if (editingLink) {
        updateConsejoVideoLinkName(editingLink.consejoId, editingLink.linkId, editingLink.name);
        setEditingLink(null);
      }
    };

    const handleDeleteMediaFromConsejo = (consejoId: string, mediaIndex: number) => {
        removeConsejoMedia(consejoId, mediaIndex);
        setLightboxMedia(null);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const mediaType = file.type.startsWith('image') ? 'image' : 'video';
                setFormData(prev => ({...prev, media: [...prev.media, { type: mediaType, dataUrl }] }));
            };
            reader.readAsDataURL(file);
        }
        if(event.target) event.target.value = '';
    };

    const handlePasteMuscleLink = async (dayKey: string, muscleName: string) => {
        try {
            const text = await navigator.clipboard.readText();
            const url = extractUrl(text);
            if (url) addMuscleGroupLink(dayKey, muscleName, url);
        } catch (err) { console.error('Clipboard error:', err); }
    };

    const handlePasteStretchingLink = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const url = extractUrl(text);
            if (url) addStretchingLink(url);
        } catch (err) { console.error('Clipboard error:', err); }
    };

    const handlePastePostureLink = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const url = extractUrl(text);
            if (url) addPostureLink(url);
        } catch (err) { console.error('Clipboard error:', err); }
    };

    const handlePasteVideoLinkInModal = async () => {
      try {
        const text = await navigator.clipboard.readText();
        const linkUrl = extractUrl(text);
        if (linkUrl) {
            const currentLinks = formData.videoLinks || [];
            if (currentLinks.some(l => l.url === linkUrl)) return;
            const newLink = { id: crypto.randomUUID(), url: linkUrl, name: `Video ${currentLinks.length + 1}` };
            setFormData(prev => ({ ...prev, videoLinks: [...currentLinks, newLink] }));
        }
      } catch (err) { console.error('Clipboard error:', err); }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-4 pb-24 relative safe-area-inset-top">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            
            {lightboxMedia && (
                <MediaLightbox 
                    allMedia={lightboxMedia.allMedia}
                    startIndex={lightboxMedia.startIndex}
                    onClose={() => setLightboxMedia(null)}
                    onDelete={(index) => handleDeleteMediaFromConsejo(lightboxMedia.consejoId, index)}
                />
            )}

            <ConfirmationModal isOpen={!!consejoToDelete} onClose={() => setConsejoToDelete(null)} onConfirm={handleConfirmDelete} title="Eliminar Consejo" message={`¿Seguro que quieres eliminar "${consejoToDelete?.title || 'esta nota'}"?`} />
            <ConfirmationModal isOpen={!!linkToDelete} onClose={() => setLinkToDelete(null)} onConfirm={handleConfirmLinkDelete} title="Eliminar Video" message={`¿Deseas eliminar este video?`} />
            <ConfirmationModal isOpen={!!libLinkToDelete} onClose={() => setLibLinkToDelete(null)} onConfirm={handleConfirmLibLinkDelete} title="Eliminar de Biblioteca" message={`¿Eliminar "${libLinkToDelete?.name}"?`} />

            {editingLibLink && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Renombrar Video</h3>
                        <input
                            type="text"
                            value={editingLibLink.name}
                            onChange={(e) => setEditingLibLink({ ...editingLibLink, name: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveLibLinkName()}
                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-6"
                            placeholder="Nuevo nombre..."
                            autoFocus
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setEditingLibLink(null)} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all">Cancelar</button>
                            <button onClick={handleSaveLibLinkName} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-all">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 animate-fadeIn" onClick={handleCloseModal}>
                    <div className="bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-cyan-400 uppercase">{editingConsejo ? 'Editar Consejo' : 'Nuevo Consejo'}</h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto pr-2 space-y-6 no-scrollbar flex-grow">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Título</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título de la nota..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold text-lg" />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Videos de Referencia</label>
                                <div className="space-y-2">
                                    {(formData.videoLinks || []).map((link) => (
                                        <div key={link.id} className="bg-cyan-600/20 border border-cyan-500/30 rounded-xl flex items-center overflow-hidden">
                                            <button onClick={() => window.open(link.url, '_blank')} className="flex-grow py-3 px-4 text-left truncate text-cyan-300 font-bold text-sm tracking-tight">{link.name}</button>
                                            <button onClick={() => setFormData({...formData, videoLinks: (formData.videoLinks || []).filter(l => l.id !== link.id)})} className="p-3 text-cyan-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <button onClick={handlePasteVideoLinkInModal} className="w-full bg-gray-700/30 border-2 border-dashed border-gray-600/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-400 hover:border-orange-500/50 transition-all py-4 gap-2 text-sm font-bold uppercase tracking-widest">
                                        <ClipboardPaste className="w-5 h-5"/> Pegar Link
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Contenido</label>
                                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Escribe aquí..." className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none h-44 resize-none leading-relaxed" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Multimedia</label>
                                <div className="flex flex-wrap gap-3">
                                    {formData.media.map((media, idx) => (
                                        <div key={idx} className="relative w-24 h-24 group">
                                            {media.type === 'image' ? <img src={media.dataUrl} className="rounded-xl object-cover w-full h-full border border-white/10" alt="" /> : <video src={media.dataUrl} muted className="rounded-xl object-cover w-full h-full border border-white/10" />}
                                            <button onClick={() => setFormData({...formData, media: formData.media.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-gray-700/30 border-2 border-dashed border-gray-600/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"><Camera className="w-8 h-8"/></button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3 flex-shrink-0">
                            <button onClick={handleCloseModal} className="flex-grow bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl transition-all">Cerrar</button>
                            <button onClick={handleSave} className="flex-grow bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-600/20 transition-all">Guardar Consejo</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-10">
                <section className="space-y-6">
                    <h1 className="text-3xl font-black text-cyan-400 flex items-center justify-center gap-4 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                        <Lightbulb className="w-8 h-8" />
                        Notas Personales
                    </h1>
                    <div className="grid grid-cols-1 gap-4">
                        {consejos.length === 0 ? (
                            <div className="text-center p-12 bg-black/20 border-2 border-dashed border-white/5 rounded-3xl">
                                <Lightbulb className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">¿Tienes algún consejo para ti?</h3>
                                <p className="text-gray-600 max-w-xs mx-auto mt-2">Usa el botón inferior para guardar técnicas, comidas o recordatorios.</p>
                            </div>
                        ) : (
                            consejos.map((consejo, idx) => (
                                <div key={consejo.id} className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/30">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <h3 className="text-xl font-black text-white leading-tight">{consejo.title || "Sin título"}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(consejo)} className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition"><Pencil className="w-5 h-5"/></button>
                                            <button onClick={() => setConsejoToDelete(consejo)} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"><Trash2 className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                    {consejo.content && <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{consejo.content}</p>}
                                    {consejo.videoLinks && consejo.videoLinks.length > 0 && (
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {consejo.videoLinks.map(link => (
                                                <button key={link.id} onClick={() => window.open(link.url, '_blank')} className="bg-cyan-600/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-600/20 transition-all flex items-center gap-2">
                                                    <Video className="w-3.5 h-3.5" /> {link.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {consejo.media.length > 0 && (
                                        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {consejo.media.map((m, i) => (
                                                <button key={i} onClick={() => setLightboxMedia({ allMedia: consejo.media, startIndex: i, consejoId: consejo.id})} className="aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5">
                                                    {m.type === 'image' ? <img src={m.dataUrl} className="w-full h-full object-cover" alt="" /> : <video src={m.dataUrl} className="w-full h-full object-cover" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="pt-10 border-t border-white/10">
                    <h2 className="text-3xl font-black text-cyan-400 flex items-center justify-center gap-4 uppercase tracking-tighter mb-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                        <Video className="w-8 h-8" />
                        Biblioteca de Videos
                    </h2>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div className="space-y-12">
                            {Object.entries(dayConfig).map(([dayKey, config]) => {
                                const muscleLinks = muscleGroupLinks[dayKey] || {};
                                return (
                                    <div key={dayKey} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-0.5 flex-grow bg-gradient-to-r from-transparent to-white/10"></div>
                                            <div className="flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/10">
                                                <config.icon className="w-5 h-5 text-cyan-400" />
                                                <span className="text-lg font-black uppercase tracking-widest text-white">{config.title}</span>
                                            </div>
                                            <div className="h-0.5 flex-grow bg-gradient-to-l from-transparent to-white/10"></div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {config.groups.map((muscle) => {
                                                const links = muscleLinks[muscle] || [];
                                                return (
                                                    <div key={muscle} className="bg-gray-900/30 border border-white/5 rounded-3xl p-5 flex flex-col h-full">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">{muscle}</h4>
                                                            <button onClick={() => handlePasteMuscleLink(dayKey, muscle)} className="w-8 h-8 flex items-center justify-center bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <SortableContext id={`${dayKey}-${muscle}`} items={links.map(l => `muscle|${dayKey}|${muscle}|${l.id}`)} strategy={verticalListSortingStrategy}>
                                                                <div className="space-y-2 min-h-[40px]">
                                                                    {links.length > 0 ? links.map(link => (
                                                                        <SortableVideoLink 
                                                                            key={link.id} 
                                                                            link={link} 
                                                                            type="muscle" 
                                                                            day={dayKey} 
                                                                            muscle={muscle} 
                                                                            onEdit={() => setEditingLibLink({ type: 'muscle', id: link.id, name: link.name, day: dayKey, muscle })}
                                                                            onDelete={() => setLibLinkToDelete({ type: 'muscle', id: link.id, name: link.name, day: dayKey, muscle })}
                                                                        />
                                                                    )) : <div className="text-[10px] text-gray-700 italic text-center py-4 border border-dashed border-white/5 rounded-xl">Arrastra videos aquí o pega uno nuevo</div>}
                                                                </div>
                                                            </SortableContext>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-12 border-t border-white/10">
                                <div className="bg-gray-900/30 border border-white/5 rounded-[2.5rem] p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-green-400 uppercase tracking-tight flex items-center gap-3"><Video className="w-6 h-6"/> Estiramientos</h3>
                                        <button onClick={handlePasteStretchingLink} className="p-2 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors"><Plus className="w-5 h-5"/></button>
                                    </div>
                                    <SortableContext id="stretching" items={stretchingLinks.map(l => `stretching|||${l.id}`)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2 min-h-[40px]">
                                            {stretchingLinks.map(link => (
                                                <SortableVideoLink key={link.id} link={link} type="stretching" onEdit={() => setEditingLibLink({ type: 'stretching', id: link.id, name: link.name })} onDelete={() => setLibLinkToDelete({ type: 'stretching', id: link.id, name: link.name })} />
                                            ))}
                                            {stretchingLinks.length === 0 && <div className="text-[10px] text-gray-700 italic text-center py-6 border border-dashed border-white/5 rounded-2xl">Sin estiramientos</div>}
                                        </div>
                                    </SortableContext>
                                </div>
                                <div className="bg-gray-900/30 border border-white/5 rounded-[2.5rem] p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-purple-400 uppercase tracking-tight flex items-center gap-3"><Video className="w-6 h-6"/> Posturas</h3>
                                        <button onClick={handlePastePostureLink} className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 hover:bg-purple-600/20 transition-colors"><Plus className="w-5 h-5"/></button>
                                    </div>
                                    <SortableContext id="posture" items={postureLinks.map(l => `posture|||${l.id}`)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2 min-h-[40px]">
                                            {postureLinks.map(link => (
                                                <SortableVideoLink key={link.id} link={link} type="posture" onEdit={() => setEditingLibLink({ type: 'posture', id: link.id, name: link.name })} onDelete={() => setLibLinkToDelete({ type: 'posture', id: link.id, name: link.name })} />
                                            ))}
                                            {postureLinks.length === 0 && <div className="text-[10px] text-gray-700 italic text-center py-6 border border-dashed border-white/5 rounded-2xl">Sin posturas</div>}
                                        </div>
                                    </SortableContext>
                                </div>
                            </div>
                        </div>
                    </DndContext>
                </section>
            </div>

            <button onClick={() => handleOpenModal()} className="fixed bottom-8 right-8 bg-cyan-600 hover:bg-cyan-500 text-white w-16 h-16 rounded-full shadow-2xl shadow-cyan-600/30 flex items-center justify-center transform transition active:scale-95 z-30"><Plus className="w-9 h-9" /></button>
        </div>
    );
};

export default ConsejosPage;
