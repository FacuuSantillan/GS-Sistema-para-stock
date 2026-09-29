import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';

export default function ModalRegistrarMovimiento({ isOpen, onClose, onSave }) {
  const [lotesDisponibles, setLotesDisponibles] = useState([]);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [movimiento, setMovimiento] = useState({
    sku: "",
    nombreProducto: "",
    lote: "",
    stockActualLote: 0,
    tipo: "ENTRADA",
    cantidad: "",
    motivo: "Compra a proveedor",
  });

  useEffect(() => {
    if (isOpen) {
      cargarLotes();
    } else {
      setMovimiento({
        sku: "",
        nombreProducto: "",
        lote: "",
        stockActualLote: 0,
        tipo: "ENTRADA",
        cantidad: "",
        motivo: "Compra a proveedor",
      });
      setFiltroBusqueda("");
    }
  }, [isOpen]);

  const cargarLotes = async () => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const resultado = await db.select("SELECT id, nombre, sku, lote, vencimiento, stock FROM suplementos");
      setLotesDisponibles(resultado);
    } catch (error) {
      console.error("Error al cargar lotes para movimiento:", error);
    }
  };

  const seleccionarLoteItem = (item) => {
    setMovimiento(prev => ({
      ...prev,
      sku: item.sku,
      nombreProducto: item.nombre,
      lote: item.lote || "Sin lote",
      stockActualLote: item.stock,
    }));
    setIsSearchOpen(false);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setMovimiento({ ...movimiento, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!movimiento.sku) {
      alert("Por favor selecciona un producto y lote.");
      return;
    }

    const cantidadNum = parseInt(movimiento.cantidad);
    if (!cantidadNum || cantidadNum <= 0) {
      alert("Ingresa una cantidad válida.");
      return;
    }

    if (movimiento.tipo === "SALIDA" && cantidadNum > movimiento.stockActualLote) {
      alert(`Stock insuficiente en este lote. Stock disponible: ${movimiento.stockActualLote}`);
      return;
    }

    try {
      const db = await Database.load("sqlite:suplementos.db");
      const operacion = movimiento.tipo === "ENTRADA" ? "+" : "-";
      
      // 1. Actualizar stock
      await db.execute(
        `UPDATE suplementos SET stock = stock ${operacion} ? WHERE sku = ? AND (lote = ? OR (lote IS NULL AND ? = 'Sin lote'))`,
        [cantidadNum, movimiento.sku, movimiento.lote === "Sin lote" ? null : movimiento.lote, movimiento.lote]
      );

      // 2. Registrar en historial de movimientos
      const fechaActual = new Date().toLocaleString("es-AR");
      await db.execute(
        `INSERT INTO movimientos (sku, nombre, lote, tipo, cantidad, motivo, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          movimiento.sku,
          movimiento.nombreProducto,
          movimiento.lote,
          movimiento.tipo,
          cantidadNum,
          movimiento.motivo,
          fechaActual
        ]
      );

      console.log("¡Movimiento registrado con éxito!");
      if (onSave) onSave(movimiento);
      onClose();
    } catch (error) {
      console.error("ERROR AL REGISTRAR MOVIMIENTO:", error);
      alert("Error al registrar movimiento: " + JSON.stringify(error));
    }
  };

  const lotesFiltrados = lotesDisponibles.filter(l =>
    l.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    l.sku.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    (l.lote && l.lote.toLowerCase().includes(filtroBusqueda.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Registrar Movimiento</h2>
            <p className="text-xs text-slate-400 mt-0.5">Controla entradas y salidas de stock por lote.</p>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-white bg-[#1a2333] p-2 rounded-xl border border-slate-700/50">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Producto y Lote seleccionado *</label>
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="cursor-pointer w-full bg-[#0b0f17] border border-slate-700/80 hover:border-[#CCFF00]/50 rounded-xl px-4 py-3 text-sm text-white flex justify-between items-center transition-all"
            >
              <span className={movimiento.nombreProducto ? "text-white font-medium" : "text-slate-500"}>
                {movimiento.nombreProducto ? `${movimiento.nombreProducto} (Lote: ${movimiento.lote} | Stock: ${movimiento.stockActualLote})` : "🔍 Buscar producto o lote..."}
              </span>
              <span className="text-xs bg-[#1a2333] text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">Seleccionar</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de movimiento *</label>
              <select 
                name="tipo"
                value={movimiento.tipo}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#CCFF00] cursor-pointer"
              >
                <option value="ENTRADA">➕ Entrada (Ingreso)</option>
                <option value="SALIDA">➖ Salida (Venta / Retiro)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cantidad *</label>
              <input 
                type="number" 
                name="cantidad"
                required
                min="1"
                placeholder="Ej. 5"
                value={movimiento.cantidad}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Motivo o Detalle</label>
            <input 
              type="text" 
              name="motivo"
              placeholder="Ej. Venta mostrador, Reposición..."
              value={movimiento.motivo}
              onChange={handleChange}
              className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
            />
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-800/80 mt-6">
            <button type="button" onClick={onClose} className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-[#1a2333] hover:bg-[#232f46] border border-slate-700/60">Cancelar</button>
            <button type="submit" className="cursor-pointer px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] shadow-[0_0_20px_rgba(204,255,0,0.25)]">Registrar movimiento</button>
          </div>
        </form>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Seleccionar Lote de Producto</h3>
              <button onClick={() => setIsSearchOpen(false)} className="cursor-pointer text-slate-400 hover:text-white p-2 bg-[#1a2333] rounded-xl">✕</button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o lote..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                autoFocus
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {lotesFiltrados.map((item, index) => (
                <div
                  key={index}
                  onClick={() => seleccionarLoteItem(item)}
                  className="cursor-pointer bg-[#0b0f17] hover:bg-[#1a2333] border border-slate-800 hover:border-[#CCFF00]/50 p-3.5 rounded-xl transition-all flex justify-between items-center group"
                >
                  <div>
                    <h4 className="font-bold text-white group-hover:text-[#CCFF00] text-sm">{item.nombre}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Lote: <span className="text-slate-200 font-semibold">{item.lote || "Sin lote"}</span></p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-[#CCFF00] bg-[#1a2333] px-2.5 py-1 rounded-lg mb-1">Stock: {item.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}