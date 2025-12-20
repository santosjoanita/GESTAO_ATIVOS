import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../Pages/Login'; 
import Perfil from '../Pages/Perfil';
import Home from '../Pages/Home/Home';
import EventoForm from '../forms/EventoForm'; 
import Requisicao from '../forms/requisicao/Requisicao';
import GestorDashboard from '../Pages/Gestor/GestorDashboard';

const App = () => {
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    }); 

    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData); 
        localStorage.setItem('user', JSON.stringify(userData));
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('projeto_ativo');
    };

    const isAuthenticated = !!currentUser; 
    
    const ProtectedRoute = ({ element }) => {
        return isAuthenticated ? element : <Navigate to="/" replace />;
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
                    element={<ProtectedRoute element={<Requisicao onLogout={handleLogout} />} />} 
                />
                <Route 
                path="/gestao" 
                element={<ProtectedRoute element={<GestorDashboard onLogout={handleLogout} />} />} 
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;