import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../HomeLayout'; 
import AuthModal from '../Autenticação/AuthModal.jsx'; 

const Login = ({ onLoginSuccess }) => {
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

    console.log("Ignorando validação do servidor para testes...");
    
    const mockUser = { 
        id: 1, 
        nome: 'Bruno Ribeiro', 
        id_perfil: 1, 
        email: 'bruno.ribeiro@cm-esposende.pt' 
    };

    localStorage.setItem('user', JSON.stringify(mockUser));

    if (onLoginSuccess) {
        onLoginSuccess(mockUser);
    }

    setShowAuthModal(false);
    setTimeout(() => {
        navigate('/home');
    }, 50);

    setIsLoading(false);
};
    return (
        <>
            {/* O HomeLayout é o componente da Landing Page */}
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