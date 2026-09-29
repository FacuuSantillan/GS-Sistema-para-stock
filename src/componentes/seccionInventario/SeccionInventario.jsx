import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';
import { 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Package, 
  RefreshCw,
  X,
  Check,
  Calendar,
  Tag,
  Building2,
  Barcode,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";

export default function SeccionInventario({ onProductoActualizado }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroVencimiento, setFiltroVencimiento] = useState("TODOS");
  const [filtroEstadoStock, setFiltroEstadoStock] = useState("TODOS");

  // Estado de Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    cargarInventario();
  }, []);

  // Cada vez que cambie cualquier filtro o búsqueda, volvemos a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroProveedor, filtroCategoria, filtroVencimiento, filtroEstadoStock]);

  const cargarInventario = async () => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const resultado = await db.select("SELECT * FROM suplementos ORDER BY id DESC");
      setProductos(resultado);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      setLoading(false);
    }
  };

  const ajustarStockRapido = async (p, cantidadCambio) => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const operacion = cantidadCambio > 0 ? "+" : "-";

      await db.execute(
        `UPDATE suplementos SET stock = stock ${operacion} ? WHERE id = ?`,
        [Math.abs(cantidadCambio), p.id]
      );

      const tipoMov = cantidadCambio > 0 ? "ENTRADA" : "SALIDA";
      const fechaActual = new Date().toLocaleString("es-AR");
      await db.execute(
        `INSERT INTO movimientos (sku, nombre, lote, tipo, cantidad, motivo, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.sku, p.nombre, p.lote || "Sin lote", tipoMov, Math.abs(cantidadCambio), "Ajuste rápido desde tabla", fechaActual]
      );

      cargarInventario();
      if (onProductoActualizado) onProductoActualizado();
    } catch (error) {
      console.error("Error al ajustar stock rápido:", error);
    }
  };

  const eliminarProducto = async (id, nombre, lote) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de "${nombre}" (Lote: ${lote || 'Sin lote'})?`)) {
      return;
    }

    try {
      const db = await Database.load("sqlite:suplementos.db");
      await db.execute("DELETE FROM suplementos WHERE id = ?", [id]);
      cargarInventario();
      if (onProductoActualizado) onProductoActualizado();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    try {
      const db = await Database.load("sqlite:suplementos.db");
      await db.execute(
        `UPDATE suplementos 
         SET nombre = ?, categoria = ?, proveedor = ?, stock = ?, costo = ?, precio = ?, vencimiento = ?, lote = ? 
         WHERE id = ?`,
        [
          productoSeleccionado.nombre,
          productoSeleccionado.categoria,
          productoSeleccionado.proveedor,
          parseInt(productoSeleccionado.stock) || 0,
          parseFloat(productoSeleccionado.costo) || 0,
          parseFloat(productoSeleccionado.precio) || 0,
          productoSeleccionado.vencimiento,
          productoSeleccionado.lote,
          productoSeleccionado.id
        ]
      );
      setIsEditing(false);
      setModalOpen(false);
      cargarInventario();
      if (onProductoActualizado) onProductoActualizado();
    } catch (error) {
      console.error("Error al actualizar producto:", error);
    }
  };

  // Función de exportación a Excel (CSV con Blob del navegador)
  const exportarAExcel = () => {
    if (productos.length === 0) {
      alert("No hay productos en el inventario para exportar.");
      return;
    }

    const cabeceras = ["ID", "Nombre", "SKU", "Categoría", "Proveedor", "Lote", "Vencimiento", "Stock", "Costo ($)", "Precio Venta ($)"];
    
    const filas = productos.map(p => [
      p.id,
      `"${(p.nombre || "").replace(/"/g, '""')}"`,
      `"${p.sku || ""}"`,
      `"${p.categoria || ""}"`,
      `"${p.proveedor || ""}"`,
      `"${p.lote || "S/N"}"`,
      p.vencimiento || "Sin fecha",
      p.stock,
      p.costo,
      p.precio
    ]);

    const contenidoCSV = [
      cabeceras.join(","),
      ...filas.map(f => f.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const fechaStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `Inventario_Stock_${fechaStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const proveedoresUnicos = ["TODOS", ...new Set(productos.map(p => p.proveedor).filter(Boolean))];
  const categoriasUnicas = ["TODAS", ...new Set(productos.map(p => p.categoria).filter(Boolean))];

  // Filtrado de productos
  const productosFiltrados = productos.filter(p => {
    const textoBusqueda = busqueda.toLowerCase();
    const coincideTexto = 
      (p.nombre && p.nombre.toLowerCase().includes(textoBusqueda)) ||
      (p.sku && p.sku.toLowerCase().includes(textoBusqueda)) ||
      (p.lote && p.lote.toLowerCase().includes(textoBusqueda));

    const coincideProveedor = filtroProveedor === "TODOS" || p.proveedor === filtroProveedor;
    const coincideCategoria = filtroCategoria === "TODAS" || p.categoria === filtroCategoria;

    const stock = parseInt(p.stock) || 0;
    let coincideEstadoStock = true;
    if (filtroEstadoStock === "DISPONIBLE") coincideEstadoStock = stock > 5;
    else if (filtroEstadoStock === "BAJO") coincideEstadoStock = stock > 0 && stock <= 5;
    else if (filtroEstadoStock === "AGOTADO") coincideEstadoStock = stock <= 0;

    let coincideVencimiento = true;
    if (p.vencimiento) {
      const hoy = new Date();
      const fechaVenc = new Date(p.vencimiento);
      const diffDias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
      if (filtroVencimiento === "PROXIMO") coincideVencimiento = diffDias >= 0 && diffDias <= 30;
      else if (filtroVencimiento === "VENCIDO") coincideVencimiento = diffDias < 0;
    } else if (filtroVencimiento === "PROXIMO" || filtroVencimiento === "VENCIDO") {
      coincideVencimiento = false;
    }

    return coincideTexto && coincideProveedor && coincideCategoria && coincideEstadoStock && coincideVencimiento;
  });

  // Cálculo de Paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina) || 1;
  const indiceUltimoProducto = paginaActual * productosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
  const productosPaginados = productosFiltrados.slice(indicePrimerProducto, indiceUltimoProducto);

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Cargando inventario activo...</div>;
  }

  return (
    <div className="mt-6 space-y-6 text-slate-100 animate-fadeIn">
      
      {/* Cabecera y Filtros */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0b0f17] border border-slate-700/60 rounded-xl text-[#CCFF00]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Inventario activo</h2>
              <p className="text-xs text-slate-400">Mostrando {productosFiltrados.length} productos en total</p>
            </div>
          </div>

          {/* Grupo de botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportarAExcel}
              className="cursor-pointer px-3 py-1.5 bg-[#0b0f17] hover:bg-[#1a2333] border border-[#CCFF00]/40 text-[#CCFF00] rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(204,255,0,0.1)]"
            >
              <Download className="w-3.5 h-3.5" /> Exportar a Excel (CSV)
            </button>

            <button
              onClick={cargarInventario}
              className="cursor-pointer px-3 py-1.5 bg-[#0b0f17] hover:bg-[#1a2333] border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Actualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Nombre, SKU o lote..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Proveedor</label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
            >
              {proveedoresUnicos.map((prov, i) => (
                <option key={i} value={prov}>{prov === "TODOS" ? "Todos los proveedores" : prov}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Categoría</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
            >
              {categoriasUnicas.map((cat, i) => (
                <option key={i} value={cat}>{cat === "TODAS" ? "Todas las categorías" : cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Vencimiento</label>
            <select
              value={filtroVencimiento}
              onChange={(e) => setFiltroVencimiento(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
            >
              <option value="TODOS">Todos</option>
              <option value="PROXIMO">Próximos a vencer (30 días)</option>
              <option value="VENCIDO">Vencidos</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estado de stock</label>
            <select
              value={filtroEstadoStock}
              onChange={(e) => setFiltroEstadoStock(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
            >
              <option value="TODOS">Todos</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="BAJO">Stock bajo (≤ 5)</option>
              <option value="AGOTADO">Agotados (0 o menos)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase bg-[#0b0f17]/40 tracking-wider">
                <th className="py-3.5 px-4">Producto / SKU</th>
                <th className="py-3.5 px-3">Categoría / Proveedor</th>
                <th className="py-3.5 px-3">Lote / Vencimiento</th>
                <th className="py-3.5 px-3">Stock (Ajuste rápido)</th>
                <th className="py-3.5 px-3">Costo / Venta</th>
                <th className="py-3.5 px-3">Margen</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {productosPaginados.length > 0 ? (
                productosPaginados.map((p) => {
                  const stock = parseInt(p.stock) || 0;
                  const costo = parseFloat(p.costo) || 0;
                  const precio = parseFloat(p.precio) || 0;
                  const margenCalculado = costo > 0 ? (((precio - costo) / costo) * 100).toFixed(0) + "%" : "—";

                  let badgeStockClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  let textoStock = "Disponible";
                  if (stock <= 0) {
                    badgeStockClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                    textoStock = "Agotado";
                  } else if (stock <= 5) {
                    badgeStockClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    textoStock = "Stock bajo";
                  }

                  return (
                    
                    <tr key={p.id} className="hover:bg-[#1a2333]/40 transition-all">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{p.nombre}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-semibold text-[#CCFF00] block">{p.categoria}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{p.proveedor || "Sin proveedor"}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-slate-200 font-medium block">Lote: {p.lote || "S/N"}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{p.vencimiento || "Sin vencimiento"}</span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{stock}</span>
                          <div className="flex items-center border border-slate-700/80 rounded-lg overflow-hidden bg-[#0b0f17]">
                            <button 
                              onClick={() => ajustarStockRapido(p, -1)}
                              title="Restar 1"
                              className="cursor-pointer px-2 py-0.5 hover:bg-rose-500/20 text-rose-400 transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => ajustarStockRapido(p, 1)}
                              title="Sumar 1"
                              className="cursor-pointer px-2 py-0.5 hover:bg-emerald-500/20 text-emerald-400 transition-all border-l border-slate-700/80"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStockClass}`}>
                          {textoStock}
                        </span>
                      </td>
                      <td className="py-4 px-3 font-mono">
                        <div className="text-slate-400 text-[11px]">${costo.toFixed(2)}</div>
                        <div className="text-white font-semibold">${precio.toFixed(2)}</div>
                      </td>
                      <td className="py-4 px-3 font-mono font-semibold text-emerald-400">
                        {margenCalculado}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => { setProductoSeleccionado(p); setIsEditing(false); setModalOpen(true); }}
                          title="Ver Detalle"
                          className="cursor-pointer p-1.5 bg-[#0b0f17] hover:bg-[#1a2333] text-slate-300 hover:text-white rounded-lg border border-slate-700/60 inline-flex"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setProductoSeleccionado(p); setIsEditing(true); setModalOpen(true); }}
                          title="Editar"
                          className="cursor-pointer p-1.5 bg-[#0b0f17] hover:bg-[#1a2333] text-blue-400 hover:text-blue-300 rounded-lg border border-slate-700/60 inline-flex"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => eliminarProducto(p.id, p.nombre, p.lote)}
                          title="Eliminar"
                          className="cursor-pointer p-1.5 bg-[#0b0f17] hover:bg-[#1a2333] text-rose-400 hover:text-rose-300 rounded-lg border border-slate-700/60 inline-flex"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador Inferior */}
        {productosFiltrados.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 bg-[#0b0f17]/40 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Mostrando <span className="font-bold text-white">{indicePrimerProducto + 1}</span> a <span className="font-bold text-white">{Math.min(indiceUltimoProducto, productosFiltrados.length)}</span> de <span className="font-bold text-white">{productosFiltrados.length}</span> resultados
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className={`cursor-pointer px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1 transition-all ${
                  paginaActual === 1 
                    ? "opacity-40 cursor-not-allowed bg-slate-900" 
                    : "bg-[#0b0f17] hover:bg-[#1a2333] text-white"
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              <span className="px-3 py-1 bg-[#131b2e] border border-slate-700 font-mono font-bold text-white rounded-xl">
                {paginaActual} / {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className={`cursor-pointer px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1 transition-all ${
                  paginaActual === totalPaginas 
                    ? "opacity-40 cursor-not-allowed bg-slate-900" 
                    : "bg-[#0b0f17] hover:bg-[#1a2333] text-white"
                }`}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal unificado Detalle / Edición */}
      {modalOpen && productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#131b2e] border border-slate-700/80 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0b0f17] border border-slate-700 flex items-center justify-center text-[#CCFF00]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{isEditing ? "Editando producto" : "Detalle del producto"}</h3>
                  <p className="text-xs text-slate-400 font-mono">SKU: {productoSeleccionado.sku}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isEditing ? "bg-[#1a2333] border-slate-700 text-slate-300" : "bg-[#CCFF00]/10 border-[#CCFF00]/40 text-[#CCFF00]"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "Ver Vista Previa" : "Modificar Datos"}
                </button>
                <button onClick={() => setModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-white p-2 bg-[#0b0f17] rounded-xl border border-slate-700/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                <div className="bg-[#0b0f17] border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#CCFF00] font-bold block mb-1">{productoSeleccionado.categoria}</span>
                    <h4 className="text-xl font-extrabold text-white">{productoSeleccionado.nombre}</h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" /> Proveedor: {productoSeleccionado.proveedor || "No especificado"}
                    </span>
                  </div>
                  <div className="text-right bg-[#131b2e] border border-slate-700/60 px-4 py-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Stock Actual</span>
                    <span className="text-2xl font-black text-white font-mono">{productoSeleccionado.stock}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#0b0f17]/60 border border-slate-800 p-3.5 rounded-2xl">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1"><Barcode className="w-3.5 h-3.5 text-[#CCFF00]" /> Lote</span>
                    <strong className="text-sm font-mono text-white">{productoSeleccionado.lote || "Sin lote"}</strong>
                  </div>
                  <div className="bg-[#0b0f17]/60 border border-slate-800 p-3.5 rounded-2xl">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5 text-amber-400" /> Vencimiento</span>
                    <strong className="text-sm font-mono text-white">{productoSeleccionado.vencimiento || "Sin fecha"}</strong>
                  </div>
                  <div className="bg-[#0b0f17]/60 border border-slate-800 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1"><Tag className="w-3.5 h-3.5 text-blue-400" /> Margen Est.</span>
                    <strong className="text-sm font-mono text-emerald-400">
                      {productoSeleccionado.costo > 0 ? (((productoSeleccionado.precio - productoSeleccionado.costo) / productoSeleccionado.costo) * 100).toFixed(0) + "%" : "—"}
                    </strong>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#0b0f17] to-[#1a2333]/40 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">Costo Unitario</span>
                    <span className="text-lg font-mono font-bold text-slate-300">${parseFloat(productoSeleccionado.costo).toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#CCFF00] block">Precio de Venta</span>
                    <span className="text-2xl font-mono font-black text-white">${parseFloat(productoSeleccionado.precio).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGuardarCambios} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del producto</label>
                  <input
                    type="text"
                    value={productoSeleccionado.nombre}
                    onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, nombre: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Categoría</label>
                    <input
                      type="text"
                      value={productoSeleccionado.categoria}
                      onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, categoria: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={productoSeleccionado.proveedor || ""}
                      onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, proveedor: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Stock</label>
                    <input
                      type="number"
                      value={productoSeleccionado.stock}
                      onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, stock: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold smudge mb-1">Lote</label>
                    <input
                      type="text"
                      value={productoSeleccionado.lote || ""}
                      onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, lote: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Vencimiento</label>
                    <input
                      type="date"
                      value={productoSeleccionado.vencimiento || ""}
                      onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, vencimiento: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Costo Unitario ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productoSeleccionado.costo}
                      onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, costo: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Precio de Venta ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productoSeleccionado.precio}
                      onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, precio: e.target.value })}
                      className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button type="button" onClick={() => setIsEditing(false)} className="cursor-pointer px-5 py-2.5 bg-[#1a2333] text-slate-200 rounded-xl font-medium">Cancelar</button>
                  <button type="submit" className="cursor-pointer px-5 py-2.5 bg-[#CCFF00] text-black font-bold rounded-xl shadow-[0_0_15px_rgba(204,255,0,0.25)] flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}