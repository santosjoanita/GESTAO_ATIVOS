import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../HomeLayout'; 
import AuthModal from '../Autenticação/AuthModal.jsx'; 

const Login = ({ onLoginSuccess }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate(); 

    const handleLoginSubmit = async (username, password) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const user = await response.json();
                
                // Limpa sessões antigas e guarda a nova
                localStorage.clear();
                localStorage.setItem('user', JSON.stringify(user));
                
                if (onLoginSuccess) onLoginSuccess(user);
                setShowAuthModal(false);

                // Redirecionamento dinâmico
                if (user.id_perfil === 2) {
                    navigate('/gestao'); // José António
                } else {
                    navigate('/home');   // Bruno Ribeiro
                }
            } else {
                setError('Utilizador ou password incorretos.');
            }
        } catch (err) {
            setError('Erro ao ligar ao servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <HomeLayout onLoginButtonClick={() => setShowAuthModal(true)} />
            {showAuthModal && (
                <AuthModal 
                    onClose={() => setShowAuthModal(false)}
                    onLoginSubmit={handleLoginSubmit} 
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </>
    );
};

export default Login;