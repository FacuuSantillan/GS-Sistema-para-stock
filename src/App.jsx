import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import Encabezado from "./componentes/encabezado/Encabezado";

function App() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white p-6">
      <Encabezado />
      <main>
        {/* Aquí irá el resto de tu contenido o tablas */}
      </main>
    </div>
  );
}

export default App;