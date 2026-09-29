import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import Encabezado from "./componentes/encabezado/Encabezado";
import SeccionEstadisticas from "./componentes/estadisticas/Estadisticas";
import SeccionInventario from "./componentes/seccionInventario/SeccionInventario";
import SeccionHistorial from "./componentes/SeccionHistorial/SeccionHistorial";

function App() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white p-6">
      <Encabezado />
      <SeccionEstadisticas/>
      <SeccionInventario/>
      <SeccionHistorial/>
      <main>
        {/* Aquí irá el resto de tu contenido o tablas */}
      </main>
    </div>
  );
}

export default App;