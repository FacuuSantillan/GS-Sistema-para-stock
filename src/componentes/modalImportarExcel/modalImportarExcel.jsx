import React, { useState } from "react";
import Database from '@tauri-apps/plugin-sql';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

export default function ModalImportarExcel({ isOpen, onClose, onImportSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [datosPreview, setDatosPreview] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estado para alertas modales
  const [modalAlerta, setModalAlerta] = useState({ visible: false, titulo: "", mensaje: "", tipo: "error" });

  const mostrarAlerta = (titulo, mensaje, tipo = "error") => {
    setModalAlerta({ visible: true, titulo, mensaje, tipo });
  };

  const cerrarAlerta = () => {
    setModalAlerta({ visible: false, titulo: "", mensaje: "", tipo: "error" });
  };

  if (!isOpen) return null;

  // Leer y parsear el archivo CSV del portapapeles o input
  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivo(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const texto = event.target.result;
      parsearCSV(texto);
    };

    reader.readAsText(file, "UTF-8");
  };

  const parsearCSV = (texto) => {
    const lineas = texto.split("\n").filter(l => l.trim() !== "");
    if (lineas.length <= 1) {
      mostrarAlerta("Archivo vacío", "El archivo no contiene registros o filas válidas.", "warning");
      return;
    }

    // Detectar automáticamente si usa coma (,) o punto y coma (;) como separador
    const primeraLinea = lineas[0];
    const separador = primeraLinea.includes(";") ? ";" : ",";

    // Omitir cabecera (fila 0) y mapear filas
    const parsedRows = [];
    for (let i = 1; i < lineas.length; i++) {
      // Expresión regular para respetar valores entre comillas dobles
      const fila = lineas[i].split(new RegExp(`(?:^|\\${separador})(?:"([^"]*)"|([^\\${separador}]*))`)).filter(Boolean);
      
      // Limpiar comillas adicionales si las hubiera
      const limpiar = (val) => (val || "").replace(/^"|"$/g, "").trim();

      if (fila.length >= 3) {
        parsedRows.push({
          nombre: limpiar(fila[1] || fila[0]),
          sku: limpiar(fila[2] || fila[1]),
          categoria: limpiar(fila[3] || "General"),
          proveedor: limpiar(fila[4] || "Sin proveedor"),
          unidad_medida: limpiar(fila[5] || "U").toUpperCase() === "KG" ? "KG" : "U",
          lote: limpiar(fila[6] || "Sin lote"),
          vencimiento: limpiar(fila[7] || ""),
          stock: parseFloat(fila[8]) || 0,
          costo: parseFloat(fila[9]) || 0,
          precio: parseFloat(fila[10]) || 0,
        });
      }
    }

    setDatosPreview(parsedRows);
  };

  const confirmarImportacion = async () => {
    if (datosPreview.length === 0) {
      mostrarAlerta("Sin datos", "No hay filas válidas para importar.", "warning");
      return;
    }

    setCargando(true);
    try {
      const db = await Database.load("sqlite:suplementos.db");
      const fechaActual = new Date().toLocaleString("es-AR");

      let insertadosCount = 0;

      for (const p of datosPreview) {
        if (!p.sku || !p.nombre) continue;

        // Verificar si ya existe SKU + Lote
        const existe = await db.select(
          "SELECT id FROM suplementos WHERE sku = ? AND lote = ?",
          [p.sku, p.lote || "Sin lote"]
        );

        if (existe.length > 0) {
          // Actualizar stock sumando
          await db.execute(
            `UPDATE suplementos SET stock = stock + ?, costo = ?, precio = ?, unidad_medida = ? WHERE sku = ? AND lote = ?`,
            [p.stock, p.costo, p.precio, p.unidad_medida, p.sku, p.lote || "Sin lote"]
          );
        } else {
          // Insertar nuevo producto
          await db.execute(
            `INSERT INTO suplementos (nombre, sku, categoria, proveedor, lote, vencimiento, stock, costo, precio, unidad_medida) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.nombre, p.sku, p.categoria, p.proveedor, p.lote || "Sin lote", p.vencimiento, p.stock, p.costo, p.precio, p.unidad_medida]
          );
        }

        // Registrar en historial de movimientos
        await db.execute(
          `INSERT INTO movimientos (sku, nombre, lote, tipo, cantidad, motivo, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.sku, p.nombre, p.lote || "Sin lote", "ENTRADA", p.stock, "Importación masiva desde archivo CSV/Excel", fechaActual]
        );

        insertadosCount++;
      }

      window.dispatchEvent(new Event("stockActualizado"));
      setCargando(false);
      mostrarAlerta("¡Importación exitosa!", `Se procesaron e importaron ${insertadosCount} registros correctamente.`, "success");
      
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      setCargando(false);
      console.error("Error al importar masivamente:", error);
      mostrarAlerta("Error de importación", "Ocurrió un error al guardar en la base de datos: " + (error?.message || JSON.stringify(error)), "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-[#131b2e] border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0b0f17] border border-slate-700/60 rounded-2xl text-[#CCFF00]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importar Artículos desde Excel (CSV)</h2>
              <p className="text-xs text-slate-400">Sube un archivo delimitado por comas o punto y coma.</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-white bg-[#1a2333] p-2 rounded-xl border border-slate-700/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Archivo */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 hover:border-[#CCFF00]/60 bg-[#0b0f17] rounded-3xl p-6 text-center transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleArchivoChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="w-8 h-8 text-[#CCFF00]" />
              <p className="text-sm font-semibold text-white">
                {archivo ? archivo.name : "Haz clic aquí para seleccionar tu archivo CSV"}
              </p>
              <p className="text-xs text-slate-400">El formato debe coincidir con la estructura de exportación de la app.</p>
            </div>
          </div>

          {/* Vista previa de datos parseados */}
          {datosPreview.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#CCFF00] uppercase tracking-wider block">
                Vista Previa ({datosPreview.length} productos listos para importar)
              </span>
              <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl max-h-48 overflow-y-auto p-3 text-xs space-y-1.5 font-mono">
                {datosPreview.slice(0, 10).map((p, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-slate-800/60 pb-1">
                    <span className="text-white font-sans font-semibold truncate max-w-[200px]">{p.nombre}</span>
                    <span className="text-slate-400">SKU: {p.sku}</span>
                    <span className="text-emerald-400 font-bold">Stock: {p.stock} {p.unidad_medida}</span>
                  </div>
                ))}
                {datosPreview.length > 10 && (
                  <p className="text-center text-[11px] text-slate-500 pt-1">...y {datosPreview.length - 10} productos más.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-5 py-2.5 bg-[#1a2333] hover:bg-[#232f46] text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700/60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={datosPreview.length === 0 || cargando}
              onClick={confirmarImportacion}
              className={`cursor-pointer px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                datosPreview.length === 0 || cargando
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-[0_0_15px_rgba(204,255,0,0.25)]"
              }`}
            >
              {cargando ? "Importando..." : `Importar ${datosPreview.length} artículos`}
            </button>
          </div>
        </div>

        {/* Alertas Modales Personalizadas */}
        {modalAlerta.visible && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#131b2e] border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-100 flex flex-col items-center text-center">
              <div className={`p-3 rounded-2xl mb-4 border ${
                modalAlerta.tipo === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                modalAlerta.tipo === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}>
                {modalAlerta.tipo === "warning" && <AlertTriangle className="w-8 h-8" />}
                {modalAlerta.tipo === "error" && <XCircle className="w-8 h-8" />}
                {modalAlerta.tipo === "success" && <CheckCircle2 className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{modalAlerta.titulo}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">{modalAlerta.mensaje}</p>
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
    </div>
  );
}