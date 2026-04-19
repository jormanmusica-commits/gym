
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Lightbulb, Plus, Trash2, Camera, X, Pencil, Video, ChevronDown, ChevronUp, ClipboardPaste, Shirt, Footprints, Shield, Hand, HeartPulse, Check } from 'lucide-react';
import type { ConsejoItem, ExerciseMedia, LinkItem } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { extractUrl } from '../lib/utils';

const dayConfig: { [key: string]: { title: string; icon: React.ElementType, subcategories: string[] } } = {
    'Día 1': { title: 'Pecho y Bíceps', icon: Shirt, subcategories: ['Pecho', 'Bíceps'] },
    'Día 2': { title: 'Pierna y Glúteo', icon: Footprints, subcategories: ['Pierna', 'Glúteo'] },
    'Día 3': { title: 'Hombro y Espalda', icon: Shield, subcategories: ['Hombro', 'Espalda'] },
    'Día 4': { title: 'Tríceps y Antebrazo', icon: Hand, subcategories: ['Tríceps', 'Antebrazo'] },
    'Día 5': { title: 'Combinados', icon: HeartPulse, subcategories: ['Combinados'] },
};

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
                    <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110" aria-label="Anterior"><Video className="w-6 h-6 rotate-180" /></button>
                    <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110" aria-label="Siguiente"><Video className="w-6 h-6" /></button>
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

function createInitialConsejoData(overrides: Partial<ConsejoItem> = {}): Partial<ConsejoItem> {
    return {
        title: '',
        content: '',
        media: [],
        videoLinks: [],
        ...overrides
    };
}

const ConsejosPage: React.FC = () => {
    const { 
        consejos, addConsejo, updateConsejo, removeConsejo, removeConsejoMedia, 
        addConsejoVideoLink, removeConsejoVideoLink, updateConsejoVideoLinkName,
        consejosTitle, updateConsejosTitle
    } = useAppContext();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(consejosTitle);
    const [editingConsejo, setEditingConsejo] = useState<ConsejoItem | null>(null);
    const [consejoToDelete, setConsejoToDelete] = useState<ConsejoItem | null>(null);
    const [lightboxMedia, setLightboxMedia] = useState<{ allMedia: ExerciseMedia[]; startIndex: number; consejoId: string; } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState(createInitialConsejoData());
    
    const [editingLink, setEditingLink] = useState<{ consejoId: string; linkId: string; name: string } | null>(null);
    const [linkToDelete, setLinkToDelete] = useState<{ consejoId: string; linkId: string; name: string } | null>(null);

    // Collapsible states
    const [isNotasExpanded, setIsNotasExpanded] = useState(true);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [selectedInitialDay, setSelectedInitialDay] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

    useEffect(() => {
        setTempTitle(consejosTitle);
    }, [consejosTitle]);

    useEffect(() => {
        if (isModalOpen) {
            setFormData(editingConsejo || createInitialConsejoData({
                ...(selectedInitialDay ? { workoutDay: selectedInitialDay } : {}),
                ...(selectedSubcategory ? { subcategory: selectedSubcategory } : {})
            }));
        } else {
            setSelectedInitialDay(null);
            setSelectedSubcategory(null);
        }
    }, [isModalOpen, editingConsejo, selectedInitialDay, selectedSubcategory]);

    const handleOpenModal = (consejo: ConsejoItem | null = null, initialDay?: string, subcategory?: string) => {
        setEditingConsejo(consejo);
        if (initialDay) {
            setSelectedInitialDay(initialDay);
        }
        if (subcategory) {
            setSelectedSubcategory(subcategory);
        }
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

    const handlePasteVideoLinkInModal = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const url = extractUrl(text);
            if (url) {
                const newLink: LinkItem = {
                    id: Date.now().toString(),
                    name: 'Video ' + ((formData.videoLinks?.length || 0) + 1),
                    url: url
                };
                setFormData(prev => ({
                    ...prev,
                    videoLinks: [...(prev.videoLinks || []), newLink]
                }));
            }
        } catch (err) {
            console.error('Clipboard error:', err);
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

    const handleSaveTitle = () => {
        updateConsejosTitle(tempTitle);
        setIsEditingTitle(false);
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 animate-fadeIn" onClick={handleCloseModal}>
                    <div className="bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-cyan-400 uppercase">{editingConsejo ? 'Editar Consejo' : formData.subcategory ? `Nota: ${formData.subcategory}` : 'Nueva Nota'}</h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto pr-2 space-y-6 no-scrollbar flex-grow">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Título</label>
                                <input 
                                    type="text" 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    placeholder="Nombre de la nota..." 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold" 
                                />
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

            <div className="max-w-4xl mx-auto">
                <section className="space-y-6 mb-12">
                    <div className="flex flex-col items-center">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2 w-full max-w-md">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={tempTitle} 
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                    className="w-full bg-black/40 border border-cyan-500/50 rounded-xl py-3 px-4 text-white font-black text-2xl uppercase tracking-tighter text-center outline-none focus:ring-2 focus:ring-cyan-500/50"
                                />
                                <button 
                                    onClick={handleSaveTitle}
                                    className="p-3 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-600/20"
                                >
                                    <Check className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full relative group">
                                <button 
                                    onClick={() => setIsNotasExpanded(!isNotasExpanded)}
                                    className="w-full text-3xl font-black text-cyan-400 flex items-center justify-center gap-4 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:brightness-110 transition-all"
                                >
                                    <Lightbulb className="w-8 h-8" />
                                    {consejosTitle}
                                    {isNotasExpanded ? <ChevronUp className="w-6 h-6 text-cyan-500/50" /> : <ChevronDown className="w-6 h-6 text-cyan-500/50" />}
                                </button>
                                <button 
                                    onClick={() => setIsEditingTitle(true)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-cyan-500/30 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {isNotasExpanded && (
                        <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                            {consejos.length === 0 ? (
                                <div 
                                    onClick={() => handleOpenModal()}
                                    className="text-center p-12 bg-black/20 border-2 border-dashed border-white/5 rounded-3xl cursor-pointer hover:bg-black/40 hover:border-cyan-500/30 transition-all group"
                                >
                                    <Lightbulb className="w-16 h-16 text-gray-700 mx-auto mb-4 group-hover:text-cyan-400 transition-colors" />
                                    <h3 className="text-xl font-bold text-gray-400 group-hover:text-white transition-colors">¿Tienes algún consejo para ti?</h3>
                                    <p className="text-gray-600 max-w-xs mx-auto mt-2">Usa el botón inferior o toca aquí para guardar técnicas, comidas o recordatorios.</p>
                                    <div className="mt-8 flex justify-center">
                                        <div className="w-14 h-14 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-full flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-600/10 group-hover:scale-110 transition-all">
                                            <Plus className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                consejos.map((consejo, idx) => (
                                    <div key={consejo.id} className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/30">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="flex-grow">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {consejo.workoutDay && dayConfig[consejo.workoutDay] && (
                                                        <div className="flex items-center gap-1.5 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                                                            {React.createElement(dayConfig[consejo.workoutDay].icon, { className: "w-3 h-3 text-cyan-400" })}
                                                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{dayConfig[consejo.workoutDay].title}</span>
                                                        </div>
                                                    )}
                                                    {consejo.subcategory && (
                                                        <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-0.5 rounded-md">
                                                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{consejo.subcategory}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {consejo.title && <h3 className="text-xl font-black text-white leading-tight">{consejo.title}</h3>}
                                            </div>
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
                    )}
                </section>

                <section className="mb-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(dayConfig).map(([dayKey, config]) => (
                            <div key={dayKey} className="space-y-2">
                                <button
                                    onClick={() => setExpandedDay(expandedDay === dayKey ? null : dayKey)}
                                    className={`w-full bg-gray-900/60 backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-300 active:scale-[0.98] group flex flex-col items-center justify-center gap-2 ${expandedDay === dayKey ? 'border-cyan-400 bg-cyan-500/5' : 'border-cyan-500/50 hover:bg-cyan-500/10'}`}
                                >
                                    <div className="flex items-center justify-center gap-3 text-cyan-400">
                                        <config.icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                                        <span className="text-xl font-black uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                                            {config.title}
                                        </span>
                                        {config.subcategories.length > 0 && (
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedDay === dayKey ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </button>
                                
                                {expandedDay === dayKey && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 animate-fadeIn">
                                        {config.subcategories.map(sub => (
                                            <button
                                                key={sub}
                                                onClick={() => handleOpenModal(null, dayKey, sub)}
                                                className="bg-black/40 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-bold py-2.5 rounded-xl text-sm uppercase tracking-wider transition-all"
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <button onClick={() => handleOpenModal()} className="fixed bottom-8 right-8 bg-cyan-600 hover:bg-cyan-500 text-white w-16 h-16 rounded-full shadow-2xl shadow-cyan-600/30 flex items-center justify-center transform transition active:scale-95 z-30"><Plus className="w-9 h-9" /></button>
        </div>
    );
};

export default ConsejosPage;
