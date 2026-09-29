import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';

export default function ModalAgregarProducto({ isOpen, onClose, onSave }) {
  const [productosExistentes, setProductosExistentes] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [porcentajeGanancia, setPorcentajeGanancia] = useState("");
  const [esExistente, setEsExistente] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    sku: "",
    categoria: "",
    proveedor: "",
    stock: "",
    lote: "",
    vencimiento: "",
    costo: "",
    precio: "",
  });

  // Cargar productos de la base de datos al abrir el modal principal
  useEffect(() => {
    if (isOpen) {
      cargarProductosExistentes();
    } else {
      // Limpiar formulario al cerrar
      setFormData({
        nombre: "",
        sku: "",
        categoria: "",
        proveedor: "",
        stock: "",
        lote: "",
        vencimiento: "",
        costo: "",
        precio: "",
      });
      setFiltroBusqueda("");
      setPorcentajeGanancia("");
      setEsExistente(false);
    }
  }, [isOpen]);

  const cargarProductosExistentes = async () => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const resultado = await db.select("SELECT DISTINCT nombre, sku, categoria, proveedor, costo, precio FROM suplementos");
      setProductosExistentes(resultado);
    } catch (error) {
      console.error("Error al cargar productos existentes:", error);
    }
  };

  const seleccionarProducto = (prod) => {
    setFormData(prev => ({
      ...prev,
      nombre: prod.nombre || "",
      sku: prod.sku || "",
      categoria: prod.categoria || "",
      proveedor: prod.proveedor || "",
      costo: prod.costo || "",
      precio: prod.precio || "",
    }));
    setEsExistente(true);
    setIsSearchModalOpen(false);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === "costo" && porcentajeGanancia) {
        const costoNum = parseFloat(value) || 0;
        const porcNum = parseFloat(porcentajeGanancia) || 0;
        updated.precio = (costoNum * (1 + porcNum / 100)).toFixed(2);
      }
      return updated;
    });
  };

  const calcularPrecioPorcentaje = (porcentaje) => {
    setPorcentajeGanancia(porcentaje);
    const costoNum = parseFloat(formData.costo) || 0;
    const porcNum = parseFloat(porcentaje) || 0;
    
    if (costoNum > 0 && porcNum >= 0) {
      const precioCalculado = costoNum * (1 + porcNum / 100);
      setFormData(prev => ({ ...prev, precio: precioCalculado.toFixed(2) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const db = await Database.load("sqlite:suplementos.db");

      // Si estamos creando un producto nuevo (no seleccionado por autocompletar),
      // verificamos estrictamente si el SKU ya existe en la base de datos.
      if (!esExistente) {
        const skuDuplicado = await db.select(
          "SELECT id FROM suplementos WHERE sku = ?", 
          [formData.sku.trim()]
        );

        if (skuDuplicado.length > 0) {
          alert(`⚠️ El código SKU "${formData.sku}" ya pertenece a otro producto registrado. No se permiten SKUs duplicados.`);
          return; // Detenemos el guardado por completo
        }
      }

      // Si es un producto existente seleccionado, actualizamos o ingresamos el lote asegurando unicidad del SKU
      const loteExistente = await db.select(
        "SELECT id FROM suplementos WHERE sku = ? AND lote = ?",
        [formData.sku, formData.lote || "Sin lote"]
      );

      if (loteExistente.length > 0) {
        // Si el mismo SKU y el mismo lote ya existen, sumamos stock
        await db.execute(
          `UPDATE suplementos 
           SET stock = stock + ?, vencimiento = ?, costo = ?, precio = ? 
           WHERE sku = ? AND lote = ?`,
          [
            parseInt(formData.stock) || 0,
            formData.vencimiento,
            parseFloat(formData.costo) || 0,
            parseFloat(formData.precio) || 0,
            formData.sku,
            formData.lote || "Sin lote"
          ]
        );
      } else {
        // Insertamos nuevo registro asegurando que conserve el nombre del SKU único
        await db.execute(
          `INSERT INTO suplementos (nombre, sku, categoria, proveedor, lote, vencimiento, stock, costo, precio) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            formData.nombre,
            formData.sku,
            formData.categoria,
            formData.proveedor,
            formData.lote || "Sin lote",
            formData.vencimiento,
            parseInt(formData.stock) || 0,
            parseFloat(formData.costo) || 0,
            parseFloat(formData.precio) || 0
          ]
        );
      }

      console.log("¡Operación completada con éxito!");
      if (onSave) onSave(formData);
      onClose();
    } catch (error) {
      console.error("ERROR CRÍTICO AL GUARDAR EN SQLITE:", error);
      alert("Error al guardar: " + JSON.stringify(error));
    }
  };

  const productosFiltrados = productosExistentes.filter(prod =>
    prod.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    prod.sku.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Añadir nuevo suplemento / Ingreso de Lote
          </h2>
          <button 
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white bg-[#1a2333] hover:bg-[#232f46] p-2 rounded-xl transition-all border border-slate-700/50"
          >
            ✕
          </button>
        </div>

        {/* Botón para abrir el buscador de productos existentes */}
        {productosExistentes.length > 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0b0f17] hover:bg-[#1a2333] border border-[#CCFF00]/40 text-[#CCFF00] rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(204,255,0,0.1)]"
            >
              🔍 Buscar producto existente para autocompletar
            </button>
          </div>
        )}

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Fila 1: Nombre y SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del producto *
              </label>
              <input 
                type="text" 
                name="nombre" 
                required
                readOnly={esExistente} // Si es existente, el nombre oficial se mantiene atado al SKU
                placeholder="Ej. Creatina 500g" 
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all ${
                  esExistente 
                    ? "bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed" 
                    : "bg-[#0b0f17] border-slate-700/85 text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                SKU / Código * {esExistente && <span className="text-[#CCFF00] text-[10px]">(Bloqueado)</span>}
              </label>
              <input 
                type="text" 
                name="sku" 
                required
                readOnly={esExistente} // Bloqueado para prevenir duplicidad
                placeholder="Ej. SUP-CRE-001" 
                value={formData.sku}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all ${
                  esExistente 
                    ? "bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed" 
                    : "bg-[#0b0f17] border-slate-700/85 text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
                }`}
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
                name="categoria" 
                required
                readOnly={esExistente}
                placeholder="Ej. Proteínas, Creatina" 
                value={formData.categoria}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all ${
                  esExistente 
                    ? "bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed" 
                    : "bg-[#0b0f17] border-slate-700/85 text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proveedor
              </label>
              <input 
                type="text" 
                name="proveedor" 
                placeholder="Ej. MuscleTech" 
                value={formData.proveedor}
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
                name="lote" 
                placeholder="LOT-884" 
                value={formData.lote}
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
  name="vencimiento" 
  value={formData.vencimiento}
  onChange={handleChange}
  className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all [color-scheme:dark]"
/>
            </div>
          </div>

          {/* Sección de Costos y Margen por Porcentaje */}
          <div className="bg-[#0b0f17]/50 border border-slate-800/80 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#CCFF00] tracking-wide uppercase">
                Cálculo de Precios y Margen
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Margen rápido (%):</span>
                {["20", "30", "50", "100"].map((porc) => (
                  <button
                    key={porc}
                    type="button"
                    onClick={() => calcularPrecioPorcentaje(porc)}
                    className="cursor-pointer text-xs bg-[#1a2333] hover:bg-[#CCFF00] hover:text-black text-slate-200 px-2.5 py-1 rounded-lg font-bold transition-all border border-slate-700/60"
                  >
                    +{porc}%
                  </button>
                ))}
              </div>
            </div>

            {/* Fila 4: Costo Unitario, Porcentaje manual y Precio de Venta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Costo Unitario ($) *
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  name="costo" 
                  required
                  placeholder="0.00" 
                  value={formData.costo}
                  onChange={handleChange}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  % Ganancia / Recargo
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="Ej. 30" 
                  value={porcentajeGanancia}
                  onChange={(e) => calcularPrecioPorcentaje(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Precio de Venta ($) *
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  name="precio" 
                  required
                  placeholder="0.00" 
                  value={formData.precio}
                  onChange={handleChange}
                  className="w-full bg-[#131b2e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-[#1a2333] hover:bg-[#232f46] border border-slate-700/60 transition-all shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="cursor-pointer px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)]"
            >
              Guardar producto
            </button>
          </div>

        </form>
      </div>

      {/* SUB-MODAL: Buscador de productos existentes */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[80vh]">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Seleccionar producto</h3>
              <button 
                onClick={() => setIsSearchModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-white bg-[#1a2333] hover:bg-[#232f46] p-2 rounded-xl transition-all border border-slate-700/50"
              >
                ✕
              </button>
            </div>

            {/* Input de Búsqueda */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Escribe el nombre o SKU para buscar..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                autoFocus
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>

            {/* Lista de resultados filtrados */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map((prod, index) => (
                  <div
                    key={index}
                    onClick={() => seleccionarProducto(prod)}
                    className="cursor-pointer bg-[#0b0f17] hover:bg-[#1a2333] border border-slate-800 hover:border-[#CCFF00]/50 p-3.5 rounded-xl transition-all flex justify-between items-center group"
                  >
                    <div>
                      <h4 className="font-bold text-white group-hover:text-[#CCFF00] transition-colors">
                        {prod.nombre}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        SKU: <span className="text-slate-300 font-mono">{prod.sku}</span> | Cat: {prod.categoria}
                      </p>
                    </div>
                    <span className="text-xs bg-[#1a2333] group-hover:bg-[#CCFF00] group-hover:text-black text-slate-300 font-semibold px-3 py-1.5 rounded-lg transition-all">
                      Seleccionar
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No se encontraron productos con ese nombre o SKU.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}