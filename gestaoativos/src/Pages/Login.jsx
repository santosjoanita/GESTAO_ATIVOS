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
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const serverResponse = await response.json();
                
                const userToSave = {
                    ...serverResponse.user,   
                    token: serverResponse.token 
                };
                
                // Limpa sessões antigas e guarda a nova
                localStorage.clear();
                localStorage.setItem('user', JSON.stringify(userToSave));
                
                if (onLoginSuccess) onLoginSuccess(userToSave);
                setShowAuthModal(false);

                if (userToSave.id_perfil === 2) { 
                    navigate('/gestao'); 
                } else {
                    navigate('/home');   
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.erro || 'Utilizador ou palavra-passe incorretos.');
            }
        } catch (err) {
            console.error("Erro no login:", err);
            setError('Erro ao ligar ao servidor de autenticação.');
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