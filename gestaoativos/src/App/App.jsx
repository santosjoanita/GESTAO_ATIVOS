import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute.jsx"; 
import { appRoutes } from "../routes/appRoutes.jsx";
import '../assets/css/global.css';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {appRoutes.map((r) => (
                    <Route
                        key={r.path}
                        path={r.path}
                        element={
                            <ProtectedRoute auth={r.auth} permission={r.permission}>
                                {r.element}
                            </ProtectedRoute>
                        }
                    />
                ))}
                
                <Route path="*" element={
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <h1>404</h1>
                        <p>Página não encontrada.</p>
                        <a href="/home">Voltar ao início</a>
                    </div>
                } />
            </Routes>
        </BrowserRouter>
    );
};

export default App;