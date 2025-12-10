import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../Pages/Login'; 
import Perfil from '../Pages/Perfil';
import EventoForm from '../forms/EventoForm';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(true); 
    
    const handleLoginSuccess = (userData) => {
        setIsAuthenticated(true);
        // NOTA: Aqui o ID do utilizador (userData.id) deve ser guardado no localStorage
    };
    
    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    const ProtectedRoute = ({ element }) => {
        return isAuthenticated ? element : <Navigate to="/" replace />;
    };

    return (
        <BrowserRouter>
            <Routes>
                
                <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} /> 
                
                <Route 
                    path="/perfil" 
                    element={<ProtectedRoute element={<Perfil onLogout={handleLogout} />} />} 
                />  

                <Route 
                    path="/novo-evento" 
                    element={<ProtectedRoute element={<EventoForm onLogout={handleLogout} />} />} 
                /> 
                
                <Route 
                    path="/nova-requisicao" 
                    element={<ProtectedRoute element={<div>Formulário Requisição Futuro</div>} />} 
                /> 
            
            </Routes>
        </BrowserRouter>
    );
};

export default App;