import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../Pages/Login'; 
import Perfil from '../Pages/Perfil';
import Home from '../Pages/Home/Home';
import EventoForm from '../forms/EventoForm'; 


const App = () => {
    const [currentUser, setCurrentUser] = useState(null); 

    const handleLoginSuccess = (userData) => {
        // Guarda os dados do utilizador
        setCurrentUser(userData); 
        localStorage.setItem('currentUser', JSON.stringify(userData));
    };
    
    const handleLogout = () => {
        // Limpa os dados do utilizador e o storage
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    const isAuthenticated = !!currentUser; 

    const HomePlaceholder = () => <Navigate to="/home" replace />;
    
    // O componente ProtectedRoute mais simples
    const ProtectedRoute = ({ element }) => {
        if (isAuthenticated) {
            return element;
        } else {
            return <Navigate to="/" replace />;
        }
    };

    return (
        <BrowserRouter>
            <Routes>
                
                <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                
                <Route
                    path="/home"
                    element={<ProtectedRoute element={<Home onLogout={handleLogout} />} />}
                />

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