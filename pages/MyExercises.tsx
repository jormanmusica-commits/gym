


import React, { useState } from 'react';
import { Activity, PlusCircle, Trash2, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import SedeDeletionModal from '../components/SedeDeletionModal';

interface MyExercisesProps {
  onSedeSelected: (sedeName: string) => void;
}

const MyExercises: React.FC<MyExercisesProps> = ({ onSedeSelected }) => {
  const { activeSede, setActiveSede, sedeNames, removeSedeAndData, removeSedeOnly, renameSede, moveSede, sedeColorStyles } = useAppContext();
  const [sedeToDelete, setSedeToDelete] = useState<string | null>(null);

  const handleCreateSede = () => {
    const newSedeName = prompt('Introduce el nombre de la nueva sede:');
    if (newSedeName && newSedeName.trim()) {
      const normalizedSedeName = newSedeName.trim().toUpperCase();
      if (sedeNames.some(name => name.toUpperCase() === normalizedSedeName)) {
        alert('Ya existe una sede con ese nombre.');
        return;
      }
      onSedeSelected(normalizedSedeName);
    }
  };

  const handleRenameSede = (oldName: string) => {
    const newSedeName = prompt(`Introduce el nuevo nombre para la sede "${oldName}":`, oldName);
    if (newSedeName && newSedeName.trim()) {
      renameSede(oldName, newSedeName.trim());
    }
  };

  const handleConfirmDeleteOnly = () => {
    if (sedeToDelete) {
      removeSedeOnly(sedeToDelete);
      setSedeToDelete(null);
    }
  };

  const handleConfirmDeleteAll = () => {
    if (sedeToDelete) {
      removeSedeAndData(sedeToDelete);
      setSedeToDelete(null);
    }
  };
  
  if (activeSede) {
    return (
      <div className="flex flex-col items-center justify-center text-center animate-fadeInUp min-h-[calc(100vh-150px)] p-4">
        <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl shadow-cyan-500/10">
          <Activity className="w-20 h-20 mx-auto text-cyan-400 mb-6 animate-pulse-slow" />
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 tracking-tight">
            Sede Activa: {activeSede}
          </h1>
          <p className="text-gray-300 text-lg max-w-md mx-auto mb-8">
            Tu progreso se guardará aquí. ¡A entrenar!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={() => setActiveSede(null)}
              className="w-full sm:w-64 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-opacity-70 btn-active bg-gradient-to-r from-gray-600 to-gray-700 hover:shadow-gray-500/30 focus:ring-gray-500/50"
            >
              Elegir otra Sede
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fadeInUp min-h-[calc(100vh-150px)] p-4">
       <SedeDeletionModal
        isOpen={!!sedeToDelete}
        onClose={() => setSedeToDelete(null)}
        onConfirmDeleteOnly={handleConfirmDeleteOnly}
        onConfirmDeleteAll={handleConfirmDeleteAll}
        sedeName={sedeToDelete || ''}
      />
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-cyan-500/10 w-full max-w-md">
        <Activity className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-cyan-400 mb-6 animate-pulse-slow" />
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 tracking-tight">
          Tu Progreso Empieza Aquí
        </h1>
        <p className="text-gray-300 text-base sm:text-lg max-w-md mx-auto mb-8">
          Elige tu sede para empezar tu entrenamiento
        </p>
        <div className="flex flex-col items-center justify-center gap-4">
          {sedeNames.map((sedeName, index) => {
            const colorClasses = sedeColorStyles.get(sedeName);
            const buttonClass = colorClasses ? colorClasses.button : 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-cyan-500/40 focus:ring-cyan-500/50';

            return (
              <div 
                key={sedeName} 
                className="w-full flex items-center justify-center"
              >
                {/* Edit Icon Wrapper (Hover Area) */}
                <div className="group w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRenameSede(sedeName); }}
                    className="p-2.5 bg-gray-800/60 rounded-full text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Renombrar sede ${sedeName}`}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Sede Button with arrows */}
                <div className="relative flex-grow mx-2 max-w-[calc(100%-8rem)]">
                  <button
                    onClick={() => onSedeSelected(sedeName)}
                    className={`w-full text-white font-bold text-base py-3 px-6 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-opacity-70 btn-active relative ${buttonClass}`}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {sedeName}
                  </button>
                  
                  {/* Up Arrow hover area */}
                  <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center group">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSede(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Mover sede hacia arriba"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Down Arrow hover area */}
                  <div className="absolute inset-y-0 right-0 w-10 flex items-center justify-center group">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSede(index, 'down'); }}
                      disabled={index === sedeNames.length - 1}
                      className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Mover sede hacia abajo"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Delete Icon Wrapper (Hover Area) */}
                <div className="group w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSedeToDelete(sedeName); }}
                    className="p-2.5 bg-gray-800/60 rounded-full text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Eliminar sede ${sedeName}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
          <button
            onClick={handleCreateSede}
            className="w-full text-cyan-300 font-bold text-lg py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-opacity-70 btn-active bg-gray-800/50 border-2 border-dashed border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-500 flex items-center justify-center gap-3 mt-2"
          >
            <PlusCircle className="w-6 h-6" />
            Crear Sede
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyExercises;
