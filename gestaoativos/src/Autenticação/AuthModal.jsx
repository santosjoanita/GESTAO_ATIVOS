import React from 'react';
import { User, Lock, X } from 'lucide-react'; 
import './AuthModal.css'; // Importa os estilos do modal

const AuthModal = ({ onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="auth-modal">
                
                {/* Botão de Fechar */}
                <button 
                    onClick={onClose} 
                    className="auth-modal-close-btn"
                >
                    <X size={24} />
                </button>

                <h2 className="auth-modal-title">AUTENTICAÇÃO</h2>
                
                {/* Campo Nome de Utilizador */}
                <div className="input-group">
                    <User className="input-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Nome de utilizador"
                        className="input-field"
                    />
                </div>

                {/* Campo Palavra-passe */}
                <div className="input-group">
                    <Lock className="input-icon" size={20} />
                    <input
                        type="password"
                        placeholder="Palavra-passe"
                        className="input-field"
                    />
                </div>

                {/* Esqueceu-se da password */}
                <a href="#" className="forgot-password-link">
                    ESQUECEU-SE DA PASSWORD?
                </a>

                {/* Botão Login */}
                <button
                    className="login-button"
                >
                    <span>ENTRAR</span>
                </button>

                {/* Registe-se aqui */}
                <a href="#" className="register-link">
                    REGISTE-SE AQUI
                </a>
            </div>
        </div>
    );
};

export default AuthModal;