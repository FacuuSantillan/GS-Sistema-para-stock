import React, { useState } from "react";
import ModalAgregarProducto from "./AgregarProducto"; 
import ModalRegistrarMovimiento from "./ModalRegistrarMovimiento"; 

export default function Encabezado() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const handleSaveProduct = async (nuevoProducto) => {
    console.log("Guardar en SQLite desde Encabezado:", nuevoProducto);
  };

  const handleMovementSaved = (movimiento) => {
    console.log("Movimiento registrado:", movimiento);
    // Aquí puedes actualizar tu lista o tabla general si lo deseas
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      {/* Títulos y Migas de pan */}
      <div>
        <div className="text-xs font-semibold tracking-wider mb-1 flex items-center gap-1.5">
          <span className="text-[#CCFF00]">INVENTARIO</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Gestión de stock
        </h1>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsMovementModalOpen(true)}
          className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-[#1a2333] hover:bg-[#232f46] border border-slate-700/60 transition-all shadow-sm"
        >
          Registrar movimiento
        </button>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)]"
        >
          + Añadir producto
        </button>
      </div>

      {/* Modal para Añadir Producto */}
      <ModalAgregarProducto 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleSaveProduct}
      />

      {/* Modal para Registrar Movimiento */}
      <ModalRegistrarMovimiento
        isOpen={isMovementModalOpen} 
        onClose={() => setIsMovementModalOpen(false)} 
        onSave={handleMovementSaved}
      />
      
    </header>
  );
}