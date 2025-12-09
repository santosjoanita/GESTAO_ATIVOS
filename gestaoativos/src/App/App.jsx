import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeLayout from '../HomeLayout'; 
import Login from '../Pages/Login';     
import Perfil from '../Pages/Perfil';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Rota principal: usa o componente Login para gerir a autenticação */}
        <Route path="/" element={<Login />} />        
        
        {/* Rota de destino após o login */}
        <Route path="/perfil" element={<Perfil />} />  
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;