import React, { useState, useEffect } from "react";
import Database from '@tauri-apps/plugin-sql';
import { AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

export default function ModalAgregarProducto({ isOpen, onClose, onSave }) {
  const [productosExistentes, setProductosExistentes] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [porcentajeGanancia, setPorcentajeGanancia] = useState("");
  const [esExistente, setEsExistente] = useState(false);

  // Estado para el modal de error o alertas personalizadas
  const [modalAlerta, setModalAlerta] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
    tipo: "error", // "error" | "warning" | "success"
  });
  
  const [formData, setFormData] = useState({
    nombre: "",
    sku: "",
    categoria: "",
    proveedor: "",
    stock: "",
    unidad_medida: "U", 
    lote: "",
    vencimiento: "",
    costo: "",
    precio: "",
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
        unidad_medida: "U",
        lote: "",
        vencimiento: "",
        costo: "",
        precio: "",
      });
      setFiltroBusqueda("");
      setPorcentajeGanancia("");
      setEsExistente(false);
      cerrarAlerta();
    }
  }, [isOpen]);

  const cargarProductosExistentes = async () => {
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const resultado = await db.select(
        "SELECT DISTINCT nombre, sku, categoria, unidad_medida, proveedor, costo, precio FROM suplementos"
      );
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
      unidad_medida: prod.unidad_medida || "U",
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

      // Si estamos creando un producto nuevo, verificamos estrictamente si el SKU ya existe.
      if (!esExistente) {
        const skuDuplicado = await db.select(
          "SELECT id FROM suplementos WHERE sku = ?", 
          [formData.sku.trim()]
        );

        if (skuDuplicado.length > 0) {
          mostrarAlerta(
            "SKU Duplicado",
            `El código SKU "${formData.sku}" ya pertenece a otro producto registrado en la base de datos. No se permiten SKUs duplicados.`,
            "warning"
          );
          return; 
        }
      }

      // Si es KG permitimos decimales (parseFloat), si es U usamos enteros (parseInt)
      const unidadMedida = formData.unidad_medida || "U";
      const stockNumerico = unidadMedida === "KG"
        ? (parseFloat(formData.stock) || 0)
        : (parseInt(formData.stock, 10) || 0);

      // Verificamos si ya existe el mismo SKU y el mismo lote
      const loteExistente = await db.select(
        "SELECT id FROM suplementos WHERE sku = ? AND lote = ?",
        [formData.sku, formData.lote || "Sin lote"]
      );

      const esLotePrevio = loteExistente.length > 0;

      if (esLotePrevio) {
        await db.execute(
          `UPDATE suplementos 
           SET stock = stock + ?, vencimiento = ?, costo = ?, precio = ?, unidad_medida = ? 
           WHERE sku = ? AND lote = ?`,
          [
            stockNumerico,
            formData.vencimiento,
            parseFloat(formData.costo) || 0,
            parseFloat(formData.precio) || 0,
            unidadMedida,
            formData.sku,
            formData.lote || "Sin lote"
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO suplementos (nombre, sku, categoria, proveedor, lote, vencimiento, stock, costo, precio, unidad_medida) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            formData.nombre,
            formData.sku,
            formData.categoria,
            formData.proveedor,
            formData.lote || "Sin lote",
            formData.vencimiento,
            stockNumerico,
            parseFloat(formData.costo) || 0,
            parseFloat(formData.precio) || 0,
            unidadMedida
          ]
        );
      }

      // 📝 REGISTRAR EN LA TABLA DE MOVIMIENTOS PARA EL HISTORIAL
      const fechaActual = new Date().toLocaleString("es-AR");
      const unidadTexto = unidadMedida === "KG" ? "kg" : "u";
      const motivoDetalle = esLotePrevio
        ? `Reposición de lote (${formData.lote || "Sin lote"}) | Unidad: ${unidadTexto} | Costo: $${formData.costo || 0} | Venta: $${formData.precio || 0}`
        : `Alta inicial de producto | Cat: ${formData.categoria || "S/C"} | Prov: ${formData.proveedor || "S/P"} | Unidad: ${unidadTexto} | Costo: $${formData.costo || 0} | Venta: $${formData.precio || 0}`;

      await db.execute(
        `INSERT INTO movimientos (sku, nombre, lote, tipo, cantidad, motivo, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          formData.sku,
          formData.nombre,
          formData.lote || "Sin lote",
          "ENTRADA",
          stockNumerico,
          motivoDetalle,
          fechaActual
        ]
      );

      // 🚀 Disparar sincronización en tiempo real
      window.dispatchEvent(new Event("stockActualizado"));

      if (onSave) onSave(formData);
      onClose();
    } catch (error) {
      console.error("ERROR CRÍTICO AL GUARDAR EN SQLITE:", error);
      mostrarAlerta(
        "Error al Guardar",
        "Ocurrió un error en la base de datos: " + (error?.message || JSON.stringify(error)),
        "error"
      );
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
            type="button"
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
                readOnly={esExistente}
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
                readOnly={esExistente}
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Stock Inicial *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formData.unidad_medida === "KG" ? "Fraccionario (Kg)" : "Entero (U)"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  name="stock" 
                  required
                  step={formData.unidad_medida === "KG" ? "0.01" : "1"}
                  placeholder={formData.unidad_medida === "KG" ? "Ej. 2.50" : "25"} 
                  value={formData.stock}
                  onChange={handleChange}
                  className="flex-1 min-w-0 bg-[#0b0f17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] transition-all"
                />

                <select
                  name="unidad_medida"
                  value={formData.unidad_medida || "U"}
                  onChange={handleChange}
                  className="cursor-pointer bg-[#0b0f17] border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#CCFF00] focus:outline-none focus:border-[#CCFF00] transition-all"
                >
                  <option value="U">Unidad</option>
                  <option value="KG">Kg</option>
                </select>
              </div>
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
                type="button" 
                onClick={() => setIsSearchModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-white bg-[#1a2333] hover:bg-[#232f46] p-2 rounded-xl transition-all border border-slate-700/50"
              >
                ✕
              </button>
            </div>

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

      {/* SUB-MODAL PERSONALIZADO DE ALERTA / ERROR */}
      {modalAlerta.visible && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#131b2e] border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-100 flex flex-col items-center text-center">
            
            {/* Ícono dinámico según el tipo */}
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