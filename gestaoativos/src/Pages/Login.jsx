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
            // MUDANÇAS AQUI: Método POST e URL com /api/auth
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const user = await response.json();
                
                // Limpa sessões antigas e guarda a nova
                localStorage.clear();
                localStorage.setItem('user', JSON.stringify(user));
                
                if (onLoginSuccess) onLoginSuccess(user);
                setShowAuthModal(false);

                // Redirecionamento dinâmico baseado no perfil
                if (user.id_perfil === 2) {
                    navigate('/gestao'); 
                } else {
                    navigate('/home');   
                }
            } else {
                // Tenta ler a mensagem de erro vinda do backend se existir
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