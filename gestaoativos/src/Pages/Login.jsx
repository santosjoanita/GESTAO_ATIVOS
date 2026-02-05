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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const serverResponse = await response.json();

            if (response.ok) {
                const userToSave = {
                    ...serverResponse.user,   
                    token: serverResponse.token 
                };

                localStorage.clear();
                localStorage.setItem('user', JSON.stringify(userToSave));
                
                if (onLoginSuccess) onLoginSuccess(userToSave);

                setToast({ type: 'success', message: "Login efetuado com sucesso!" });
                setShowAuthModal(false);

                const perfil = userToSave.id_perfil;
                if (perfil === 1) navigate('/admin');
                else if (perfil === 2) navigate('/gestao'); 
                else if (perfil === 4) navigate('/explorar');
                else navigate('/home');

            } else {
                setError(serverResponse.erro || 'Credenciais inválidas.');
                setToast({ type: 'error', message: "Falha na autenticação." });
            }
        } catch (err) {
            console.error("Erro no login:", err);
            setError('Erro ao ligar ao servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.token) {
            const p = storedUser.id_perfil;
            if (p === 1) navigate('/admin');
            else if (p === 2) navigate('/gestao');
            else if (p === 4) navigate('/explorar');
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