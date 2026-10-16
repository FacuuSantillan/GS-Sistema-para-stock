import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';
import { AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

export default function ModalRegistrarMovimiento({ isOpen, onClose, onSave }) {
  const [lotesDisponibles, setLotesDisponibles] = useState([]);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Estado para el modal de alertas personalizadas
  const [modalAlerta, setModalAlerta] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
    tipo: "error", // "error" | "warning" | "success"
  });

  const [movimiento, setMovimiento] = useState({
    sku: "",
    nombreProducto: "",
    lote: "",
    stockActualLote: 0,
    unidadMedida: "U",
    tipo: "ENTRADA",
    cantidad: "",
    motivo: "Compra a proveedor",
  });

  const mostrarAlerta = (titulo, mensaje, tipo = "error") => {
    setModalAlerta({
      visible: true,
      titulo,
      mensaje,
      tipo,
    });
  };

  const cerrarAlerta = () => {
    setModalAlerta({
      visible: false,
      titulo: "",
      mensaje: "",
      tipo: "error",
    });
  };

  useEffect(() => {
    if (isOpen) {
      cargarLotes();
    } else {
      setMovimiento({
        sku: "",
        nombreProducto: "",
        lote: "",
        stockActualLote: 0,
        unidadMedida: "U",
        tipo: "ENTRADA",
        cantidad: "",
        motivo: "Compra a proveedor",
      });
      setFiltroBusqueda("");
      cerrarAlerta();
    }
  }, [isOpen]);

  const cargarLotes = async () => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const resultado = await db.select(
        "SELECT id, nombre, sku, lote, vencimiento, stock, unidad_medida FROM suplementos"
      );
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
      unidadMedida: item.unidad_medida || "U",
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
      mostrarAlerta(
        "Selección requerida",
        "Por favor selecciona un producto y su lote correspondiente antes de continuar.",
        "warning"
      );
      return;
    }

    const esKilos = movimiento.unidadMedida === "KG";
    const cantidadNum = esKilos
      ? parseFloat(movimiento.cantidad)
      : parseInt(movimiento.cantidad, 10);

    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      mostrarAlerta(
        "Cantidad inválida",
        "Ingresa una cantidad válida mayor a 0 para registrar el movimiento.",
        "warning"
      );
      return;
    }

    if (movimiento.tipo === "SALIDA" && cantidadNum > movimiento.stockActualLote) {
      mostrarAlerta(
        "Stock insuficiente",
        `No hay suficiente stock en este lote para realizar la salida. Stock disponible: ${movimiento.stockActualLote} ${esKilos ? "kg" : "u"}.`,
        "error"
      );
      return;
    }

    try {
      const db = await Database.load("sqlite:suplementos.db");
      const operacion = movimiento.tipo === "ENTRADA" ? "+" : "-";

      // 1. Actualizar stock en suplementos
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

      // 3. Notificar a toda la interfaz
      window.dispatchEvent(new Event("stockActualizado"));

      if (onSave) onSave(movimiento);
      onClose();
    } catch (error) {
      console.error("ERROR AL REGISTRAR MOVIMIENTO:", error);
      mostrarAlerta(
        "Error al Registrar",
        "Ocurrió un error en la base de datos: " + (error?.message || JSON.stringify(error)),
        "error"
      );
    }
  };

  const lotesFiltrados = lotesDisponibles.filter(l =>
    l.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    l.sku.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    (l.lote && l.lote.toLowerCase().includes(filtroBusqueda.toLowerCase()))
  );

  const esKilos = movimiento.unidadMedida === "KG";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Registrar Movimiento</h2>
            <p className="text-xs text-slate-400 mt-0.5">Controla entradas y salidas de stock por lote.</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="cursor-pointer text-slate-400 hover:text-white bg-[#1a2333] hover:bg-[#232f46] p-2 rounded-xl border border-slate-700/50 transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Producto y Lote seleccionado *</label>
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="cursor-pointer w-full bg-[#0b0f17] border border-slate-700/80 hover:border-[#CCFF00]/50 rounded-xl px-4 py-3 text-sm text-white flex justify-between items-center transition-all"
            >
              <span className={movimiento.nombreProducto ? "text-white font-medium" : "text-slate-500"}>
                {movimiento.nombreProducto 
                  ? `${movimiento.nombreProducto} (Lote: ${movimiento.lote} | Stock: ${movimiento.stockActualLote} ${esKilos ? "kg" : "u"})` 
                  : "🔍 Buscar producto o lote..."}
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Cantidad *</label>
                <span className="text-[10px] text-[#CCFF00] font-mono font-bold">
                  {esKilos ? "Kilos (Kg)" : "Unidades (U)"}
                </span>
              </div>
              <input 
                type="number" 
                name="cantidad"
                required
                step={esKilos ? "0.01" : "1"}
                min={esKilos ? "0.01" : "1"}
                placeholder={esKilos ? "Ej. 1.25" : "Ej. 5"}
                value={movimiento.cantidad}
                onChange={handleChange}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
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
              className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
            />
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-800/80 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-[#1a2333] hover:bg-[#232f46] border border-slate-700/60 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="cursor-pointer px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)]"
            >
              Registrar movimiento
            </button>
          </div>
        </form>
      </div>

      {/* Buscador de Lotes */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Seleccionar Lote de Producto</h3>
              <button 
                type="button" 
                onClick={() => setIsSearchOpen(false)} 
                className="cursor-pointer text-slate-400 hover:text-white p-2 bg-[#1a2333] hover:bg-[#232f46] rounded-xl transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o lote..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                autoFocus
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-all"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {lotesFiltrados.map((item, index) => {
                const unidadItem = item.unidad_medida === "KG" ? "kg" : "u";
                const stockVisual = item.unidad_medida === "KG" 
                  ? Number(item.stock).toFixed(2) 
                  : item.stock;

                return (
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
                      <span className="block text-xs font-bold text-[#CCFF00] bg-[#1a2333] px-2.5 py-1 rounded-lg mb-1">
                        Stock: {stockVisual} {unidadItem}
                      </span>
                    </div>
                  </div>
                );
              })}
              {lotesFiltrados.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No se encontraron productos o lotes coincidentes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZADO DE ALERTA / ERROR */}
      {modalAlerta.visible && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#131b2e] border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-100 flex flex-col items-center text-center">
            
            <div className={`p-3 rounded-2xl mb-4 border ${
              modalAlerta.tipo === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : modalAlerta.tipo === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              {modalAlerta.tipo === "warning" && <AlertTriangle className="w-8 h-8" />}
              {modalAlerta.tipo === "error" && <XCircle className="w-8 h-8" />}
              {modalAlerta.tipo === "success" && <CheckCircle2 className="w-8 h-8" />}
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              {modalAlerta.titulo}
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {modalAlerta.mensaje}
            </p>

            <button
              type="button"
              onClick={cerrarAlerta}
              className="cursor-pointer w-full py-2.5 px-4 bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}