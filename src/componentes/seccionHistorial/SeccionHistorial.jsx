import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';
import { 
  History, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  Info,
  Calendar,
  Layers,
  Tag,
  Package
} from "lucide-react";

export default function SeccionHistorial() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

  // Paginado (20 elementos por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 20;

  useEffect(() => {
    cargarHistorial();

    const handleActualizar = () => {
      cargarHistorial();
    };

    window.addEventListener("stockActualizado", handleActualizar);

    return () => {
      window.removeEventListener("stockActualizado", handleActualizar);
    };
  }, []);

  const cargarHistorial = async () => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const resultado = await db.select("SELECT * FROM movimientos ORDER BY id DESC");
      setMovimientos(resultado);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar historial:", error);
      setLoading(false);
    }
  };

  // Cálculo de páginas
  const totalPaginas = Math.ceil(movimientos.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const movimientosPaginados = movimientos.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const irPaginaAnterior = () => {
    setPaginaActual(prev => Math.max(prev - 1, 1));
  };

  const irPaginaSiguiente = () => {
    setPaginaActual(prev => Math.min(prev + 1, totalPaginas));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-400 text-sm">
        Cargando historial de movimientos...
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 text-slate-100 animate-fadeIn">
      {/* Encabezado */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0b0f17] border border-slate-700/60 rounded-2xl text-[#CCFF00] shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Historial de Movimientos</h2>
              <p className="text-xs text-slate-400 mt-0.5">Auditoría completa de entradas, salidas y altas de stock.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={cargarHistorial}
            className="cursor-pointer px-3.5 py-2 bg-[#0b0f17] hover:bg-[#1a2333] border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {/* Tabla con Paginado */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase bg-[#0b0f17]/40 tracking-wider">
                <th className="py-3.5 px-4">Fecha / Hora</th>
                <th className="py-3.5 px-3">Tipo</th>
                <th className="py-3.5 px-3">Producto / SKU</th>
                <th className="py-3.5 px-3">Lote</th>
                <th className="py-3.5 px-3">Cantidad</th>
                <th className="py-3.5 px-4">Motivo / Detalle</th>
                <th className="py-3.5 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {movimientosPaginados.length > 0 ? (
                movimientosPaginados.map((m) => {
                  const esEntrada = m.tipo === "ENTRADA";
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => setMovimientoSeleccionado(m)}
                      className="hover:bg-[#1a2333]/50 transition-all cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">{m.fecha}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          esEntrada ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {esEntrada ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white group-hover:text-[#CCFF00] transition-colors">{m.nombre}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.sku}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300 whitespace-nowrap">{m.lote || "S/N"}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white text-sm whitespace-nowrap">
                        <span className={esEntrada ? "text-emerald-400" : "text-rose-400"}>
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={m.motivo}>
                        {m.motivo || "Sin detalle"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovimientoSeleccionado(m);
                          }}
                          className="cursor-pointer px-2.5 py-1 bg-[#0b0f17] hover:bg-[#CCFF00] text-slate-300 hover:text-black rounded-lg border border-slate-700/60 transition-all inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No hay movimientos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Control de Paginado */}
        {movimientos.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-[#0b0f17]/30 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-slate-400">
              Mostrando <span className="text-white font-semibold">{indiceInicio + 1}</span> a{" "}
              <span className="text-white font-semibold">
                {Math.min(indiceInicio + elementosPorPagina, movimientos.length)}
              </span> de <span className="text-white font-semibold">{movimientos.length}</span> movimientos
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={irPaginaAnterior}
                disabled={paginaActual === 1}
                className={`px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs flex items-center gap-1 transition-all ${
                  paginaActual === 1 
                    ? "bg-slate-900/30 text-slate-600 border-slate-800 cursor-not-allowed" 
                    : "bg-[#0b0f17] hover:bg-[#1a2333] text-slate-200 cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="text-xs font-mono text-slate-300 px-2">
                Página <span className="text-[#CCFF00] font-bold">{paginaActual}</span> / {totalPaginas}
              </span>

              <button
                type="button"
                onClick={irPaginaSiguiente}
                disabled={paginaActual === totalPaginas}
                className={`px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs flex items-center gap-1 transition-all ${
                  paginaActual === totalPaginas 
                    ? "bg-slate-900/30 text-slate-600 border-slate-800 cursor-not-allowed" 
                    : "bg-[#0b0f17] hover:bg-[#1a2333] text-slate-200 cursor-pointer"
                }`}
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA VER DETALLES DEL MOVIMIENTO */}
      {movimientoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-slate-700 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative text-slate-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            {/* Cabecera del modal */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0b0f17] border border-slate-700/60 rounded-2xl text-[#CCFF00]">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Detalle de Movimiento</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Registro #{movimientoSeleccionado.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMovimientoSeleccionado(null)}
                className="cursor-pointer text-slate-400 hover:text-white bg-[#1a2333] hover:bg-[#232f46] p-2 rounded-xl transition-all border border-slate-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido detallado */}
            <div className="space-y-4">
              
              {/* Tarjeta de Producto */}
              <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-[#CCFF00]" />
                  <span>Información del Producto</span>
                </div>
                <div className="text-base font-bold text-white">
                  {movimientoSeleccionado.nombre}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Código SKU</span>
                    <span className="text-xs font-mono text-[#CCFF00] bg-[#1a2333] px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {movimientoSeleccionado.sku}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lote asignado</span>
                    <span className="text-xs font-mono text-slate-200 block mt-0.5">
                      {movimientoSeleccionado.lote || "Sin lote especificado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Tipo y Cantidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b0f17] border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block mb-1">Tipo de Movimiento</span>
                  <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                    movimientoSeleccionado.tipo === "ENTRADA" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {movimientoSeleccionado.tipo === "ENTRADA" ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    {movimientoSeleccionado.tipo === "ENTRADA" ? "Entrada (Ingreso)" : "Salida (Egreso)"}
                  </span>
                </div>
                <div className="bg-[#0b0f17] border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block mb-1">Cantidad Operada</span>
                  <span className="text-base font-extrabold font-mono text-white">
                    {movimientoSeleccionado.tipo === "ENTRADA" ? `+${movimientoSeleccionado.cantidad}` : `-${movimientoSeleccionado.cantidad}`}
                  </span>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Fecha y Hora de Registro</span>
                </div>
                <p className="text-xs font-mono text-slate-200 pt-1">{movimientoSeleccionado.fecha}</p>
              </div>

              {/* Motivo o Detalle Desglosado */}
              <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[#CCFF00] uppercase tracking-wider font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Motivo y Observaciones</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed break-words bg-[#131b2e]/60 p-3 rounded-xl border border-slate-800/80">
                  {movimientoSeleccionado.motivo || "Sin observaciones adicionales"}
                </p>
              </div>

            </div>

            {/* Botón de cierre */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setMovimientoSeleccionado(null)}
                className="cursor-pointer px-5 py-2.5 bg-[#1a2333] hover:bg-[#232f46] text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700/60"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}