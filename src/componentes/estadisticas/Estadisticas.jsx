import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';
import { Package, Boxes, TrendingDown, AlertTriangle, Calendar, RefreshCw } from "lucide-react";

export default function SeccionEstadisticas() {
  const [estadisticas, setEstadisticas] = useState({
    totalProductosUnicos: 0,
    totalUnidades: 0,
    valorTotalInventario: 0,
    capitalInvertidoCosto: 0,
    stockBajo: 0,
    agotados: 0,
    vencidosProximos: 0,
    porCategoria: []
  });
  const [loading, setLoading] = useState(true);

useEffect(() => {
    calcularEstadisticas();

    // Escuchar el evento en tiempo real cuando se agregue, modifique o elimine stock
    const handleStockActualizado = () => {
      calcularEstadisticas();
    };

    window.addEventListener("stockActualizado", handleStockActualizado);

    // Limpiar el evento al desmontar el componente
    return () => {
      window.removeEventListener("stockActualizado", handleStockActualizado);
    };
  }, []);

  const calcularEstadisticas = async () => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const productos = await db.select("SELECT * FROM suplementos");

      let totalUnidades = 0;
      let valorVenta = 0;
      let valorCosto = 0;
      let stockBajo = 0;
      let agotados = 0;
      let alertasVencimiento = 0;
      
      const skusUnicos = new Set();
      const categoriasMap = {};

      const hoy = new Date();

      productos.forEach(p => {
        const stockCrudo = parseInt(p.stock) || 0;
        const stockEfectivo = Math.max(0, stockCrudo); // Si es negativo, cuenta como 0 para lo financiero/unidades
        const costo = parseFloat(p.costo) || 0;
        const precio = parseFloat(p.precio) || 0;

        // Contar productos únicos por SKU
        if (p.sku) skusUnicos.add(p.sku);

        totalUnidades += stockEfectivo;
        valorVenta += stockEfectivo * precio;
        valorCosto += stockEfectivo * costo;

        // Reglas de negocio para alertas
        if (stockCrudo === 0) {
          agotados++;
        } else if (stockCrudo > 0 && stockCrudo <= 5) {
          stockBajo++;
        }

        // Control de vencimientos próximos (en los próximos 30 días o vencidos)
        if (p.vencimiento) {
          const fechaVenc = new Date(p.vencimiento);
          const diferenciaDias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
          if (diferenciaDias <= 30) {
            alertasVencimiento++;
          }
        }

        // Agrupar por categoría
        const cat = p.categoria || "Sin categoría";
        if (!categoriasMap[cat]) {
          categoriasMap[cat] = { cantidadItems: 0, valorTotal: 0 };
        }
        categoriasMap[cat].cantidadItems += stockEfectivo;
        categoriasMap[cat].valorTotal += stockEfectivo * precio;
      });

      const porCategoria = Object.keys(categoriasMap).map(cat => ({
        categoria: cat,
        ...categoriasMap[cat]
      }));

      setEstadisticas({
        totalProductosUnicos: skusUnicos.size,
        totalUnidades,
        valorTotalInventario: valorVenta,
        capitalInvertidoCosto: valorCosto,
        stockBajo,
        agotados,
        vencidosProximos: alertasVencimiento,
        porCategoria
      });
      setLoading(false);
    } catch (error) {
      console.error("Error al calcular estadísticas desde SQLite:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 text-sm">
        Calculando métricas de inventario...
      </div>
    );
  }

  const gananciaEstimada = estadisticas.valorTotalInventario - estadisticas.capitalInvertidoCosto;

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn">
      
      {/* Encabezado de la sección */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Panel de Estadísticas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Stock, lotes y vencimientos bajo control.
          </p>
        </div>
        <button
          onClick={calcularEstadisticas}
          className="cursor-pointer px-4 py-2 bg-[#1a2333] hover:bg-[#232f46] border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar datos
        </button>
      </div>

      {/* 5 Tarjetas Superiores con Iconos de Lucide React */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Productos */}
        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#0b0f17] border border-slate-700/60 flex items-center justify-center text-[#CCFF00] mb-4">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Productos</span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {estadisticas.totalProductosUnicos}
            </div>
          </div>
        </div>

        {/* 2. Unidades */}
        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#0b0f17] border border-slate-700/60 flex items-center justify-center text-[#CCFF00] mb-4">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Unidades</span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {estadisticas.totalUnidades}
            </div>
          </div>
        </div>

        {/* 3. Stock bajo */}
        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#0b0f17] border border-slate-700/60 flex items-center justify-center text-amber-400 mb-4">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-amber-400/90 block mb-1">Stock bajo</span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {estadisticas.stockBajo}
            </div>
          </div>
        </div>

        {/* 4. Agotados */}
        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#0b0f17] border border-slate-700/60 flex items-center justify-center text-rose-400 mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-rose-300 block mb-1">Agotados</span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {estadisticas.agotados}
            </div>
          </div>
        </div>

        {/* 5. Alertas de vencimiento */}
        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#0b0f17] border border-slate-700/60 flex items-center justify-center text-amber-300 mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-amber-200 block mb-1">Alertas de vencimiento</span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {estadisticas.vencidosProximos}
            </div>
          </div>
        </div>

      </div>

      {/* Tarjetas Financieras Secundarias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor total (Venta)</span>
          <div className="text-2xl font-extrabold text-[#CCFF00] mt-2 font-mono">
            ${estadisticas.valorTotalInventario.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital Invertido (Costo)</span>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            ${estadisticas.capitalInvertidoCosto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131b2e] border border-slate-800 p-5 rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ganancia Potencial</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            ${gananciaEstimada.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

    </div>
  );
}