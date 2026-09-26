import React, { useState } from "react";
import ModalAgregarProducto from "./AgregarProducto"; // Ajusta la ruta según donde tengas guardado el modal

export default function Encabezado({ onOpenMovement }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveProduct = async (nuevoProducto) => {
    console.log("Guardar en SQLite desde Encabezado:", nuevoProducto);
    // Aquí puedes realizar la inserción directamente o pasar la función hacia arriba si prefieres
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      {/* Títulos y Migas de pan */}
      <div>
        <div className="text-xs font-semibold tracking-wider mb-1 flex items-center gap-1.5">
          <span className="text-[#CCFF00]">PERFORMANCE</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400 font-normal">INVENTARIO</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Gestión de suplementos
        </h1>
     
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenMovement}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-[#1a2333] hover:bg-[#232f46] border border-slate-700/60 transition-all shadow-sm"
        >
          Registrar movimiento
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)]"
        >
          + Añadir producto
        </button>
      </div>

      {/* Modal integrado en el Encabezado */}
      <ModalAgregarProducto 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProduct}
      />
    </header>
  );
}