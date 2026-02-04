import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute.jsx"; 
import { appRoutes } from "../routes/appRoutes.jsx";
import '../assets/css/global.css';

const NotFound = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    const handleBack = () => {
        if (!user) {
            navigate('/');
        } else {
            if (user.id_perfil === 4) navigate('/explorar');
            else if (user.id_perfil === 2) navigate('/gestao');
            else navigate('/home');
        }
    };

    return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <h1 style={{fontSize: '60px', color: '#1f3a52'}}>404</h1>
            <p>Página não encontrada ou sem acesso.</p>
            <button 
                onClick={handleBack} 
                style={{ 
                    padding: '10px 20px', 
                    background: '#1f3a52', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    marginTop: '20px',
                    fontWeight: 'bold'
                }}
            >
                Voltar à página principal
            </button>
        </div>
    );
};

const App = () => {
    const handleLogoutAction = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    return (
        <BrowserRouter>
            <Routes>
                {appRoutes.map((r) => (
                    <Route
                        key={r.path}
                        path={r.path}
                        element={
                            <ProtectedRoute auth={r.auth} permission={r.permission}>
                                {React.cloneElement(r.element, { onLogout: handleLogoutAction })}
                            </ProtectedRoute>
                        }
                    />
                ))}
                
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;