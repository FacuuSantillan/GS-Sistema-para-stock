import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';
import { History, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function SeccionHistorial() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
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

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Cargando historial de movimientos...</div>;
  }

  return (
    <div className="mt-6 space-y-6 text-slate-100 animate-fadeIn">
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0b0f17] border border-slate-700/60 rounded-xl text-[#CCFF00]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Historial de Movimientos</h2>
              <p className="text-xs text-slate-400">Auditoría completa de entradas y salidas de stock.</p>
            </div>
          </div>
          <button
            onClick={cargarHistorial}
            className="cursor-pointer px-3 py-1.5 bg-[#0b0f17] hover:bg-[#1a2333] border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {movimientos.length > 0 ? (
                movimientos.map((m) => {
                  const esEntrada = m.tipo === "ENTRADA";
                  return (
                    <tr key={m.id} className="hover:bg-[#1a2333]/40 transition-all">
                      <td className="py-3.5 px-4 font-mono text-slate-300">{m.fecha}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          esEntrada ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {esEntrada ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{m.nombre}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.sku}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300">{m.lote || "S/N"}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white text-sm">
                        <span className={esEntrada ? "text-emerald-400" : "text-rose-400"}>
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{m.motivo || "Sin detalle"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    No hay movimientos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}