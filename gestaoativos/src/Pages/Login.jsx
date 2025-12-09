

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../HomeLayout'; 
import AuthModal from '../Autenticação/AuthModal.jsx'; 

const Login = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate(); 
    
    const API_URL = 'http://localhost:3001/api/login';

    const handleAccessClick = () => {
        setShowAuthModal(true); 
        setError('');
    };

    const handleCloseAuthModal = () => {
        setShowAuthModal(false);
    };

    const handleLoginSubmit = async (username, password) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                
                setShowAuthModal(false); 
                navigate('/perfil'); 
                
            } else {
                
                setError(data.message || 'Credenciais inválidas. Tente novamente.');
            }
        } catch (err) {
            
            setError('Falha ao comunicar com o servidor de autenticação.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <HomeLayout onLoginButtonClick={handleAccessClick} />
            
            {showAuthModal && (
                <AuthModal 
                    onClose={handleCloseAuthModal}
                    onLoginSubmit={handleLoginSubmit} 
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </>
    );
};

export default Login;