import React, { useState } from "react";

export default function ModalAgregarProducto({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    supplier: "",
    stock: "",
    batch: "",
    expiry_date: "",
    cost: "",
    price: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Añadir nuevo suplemento
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-[#1a2333] hover:bg-[#232f46] p-2 rounded-xl transition-all border border-slate-700/50"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Fila 1: Nombre y SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del producto *
              </label>
              <input 
                type="text" 
                name="name" 
                required
                placeholder="Ej. Creatina 500g" 
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                SKU / Código *
              </label>
              <input 
                type="text" 
                name="sku" 
                required
                placeholder="Ej. SUP-CRE-001" 
                value={formData.sku}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
          </div>

          {/* Fila 2: Categoría y Proveedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoría (Suplemento) *
              </label>
              <input 
                type="text" 
                name="category" 
                required
                placeholder="Ej. Proteínas, Creatina" 
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proveedor
              </label>
              <input 
                type="text" 
                name="supplier" 
                placeholder="Ej. MuscleTech" 
                value={formData.supplier}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
          </div>

          {/* Fila 3: Stock Inicial, Lote y Vencimiento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Stock Inicial *
              </label>
              <input 
                type="number" 
                name="stock" 
                required
                placeholder="25" 
                value={formData.stock}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lote
              </label>
              <input 
                type="text" 
                name="batch" 
                placeholder="LOT-884" 
                value={formData.batch}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vencimiento
              </label>
              <input 
                type="date" 
                name="expiry_date" 
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
          </div>

          {/* Fila 4: Costo Unitario y Precio de Venta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Costo Unitario ($) *
              </label>
              <input 
                type="number" 
                step="0.01"
                name="cost" 
                required
                placeholder="0.00" 
                value={formData.cost}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Precio de Venta ($) *
              </label>
              <input 
                type="number" 
                step="0.01"
                name="price" 
                required
                placeholder="0.00" 
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-[#1a2333] hover:bg-[#232f46] border border-slate-700/60 transition-all shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)]"
            >
              Guardar producto
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}