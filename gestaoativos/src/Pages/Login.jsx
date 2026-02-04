import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../HomeLayout'; 
import AuthModal from '../Autenticação/AuthModal.jsx'; 
import Toast from '../components/Toast';

const Login = ({ onLoginSuccess }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate(); 
    const [toast, setToast] = useState(null);

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
                setToast({ type: 'success', message: "Login efetuado com sucesso!" });

            setTimeout(() => {
                if (userToSave.id_perfil === 2) {
                    navigate('/gestao'); 
                } else if (userToSave.id_perfil === 4) {
                    navigate('/explorar');
                } else {
                    navigate('/home'); 
                }
            }, 1000);
                
                localStorage.clear();
                localStorage.setItem('user', JSON.stringify(userToSave));
                
                if (onLoginSuccess) onLoginSuccess(userToSave);
                setShowAuthModal(false);

                if (userToSave.id_perfil === 2) { 
                    navigate('/gestao'); 
                } else {
                    navigate('/home');   
                }
                if (userToSave.id_perfil === 4) {
                    navigate('/explorar'); 
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.erro || 'Utilizador ou palavra-passe incorretos.');
                setToast({ type: 'error', message: "Credenciais inválidas." });
            }
        } catch (err) {
            console.error("Erro no login:", err);
            setError('Erro ao ligar ao servidor de autenticação.');
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        if (user.id_perfil === 2) navigate('/gestao');
        else if (user.id_perfil === 4) navigate('/explorar'); 
        else navigate('/home');
    }
}, [navigate]);
    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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