// gestaoativos/src/AuthModal.jsx
import React, { useState } from 'react';
import { User, Lock, X } from 'lucide-react'; 
import './AuthModal.css';

const AuthModal = ({ onClose, onLoginSubmit, isLoading, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLocalSubmit = (e) => {
        e.preventDefault();
        onLoginSubmit(username, password); 
    };

    return (
        <div className="modal-overlay">
            <div className="auth-modal">
                
                <button 
                    onClick={onClose} 
                    className="auth-modal-close-btn"
                >
                    <X size={24} />
                </button>

                <h2 className="auth-modal-title">AUTENTICAÇÃO</h2>
                
                <form onSubmit={handleLocalSubmit}>
                    
                    <div className="input-group">
                        <User className="input-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Nome de utilizador"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <Lock className="input-icon" size={20} />
                        <input
                            type="password"
                            placeholder="Palavra-passe"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="alert-error-message">{error}</div>}

                  

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        <span>{isLoading ? 'A ENTRAR...' : 'ENTRAR'}</span>
                    </button>

                </form>

              
            </div>
        </div>
    );
};

export default AuthModal;