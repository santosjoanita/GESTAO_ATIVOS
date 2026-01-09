import React from 'react';
import { useNavigate } from 'react-router-dom';

const SemPermissao = () => {
    const navigate = useNavigate();

    return (
        <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px', 
            fontFamily: 'sans-serif' 
        }}>
            <h1 style={{ color: '#e74c3c', fontSize: '3rem' }}>403</h1>
            <h2>Acesso Negado</h2>
            <p>Lamentamos, mas não tem permissão para aceder a esta página.</p>
            <button 
                onClick={() => navigate('/home')}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#1f4e79',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                Voltar à Página Inicial
            </button>
        </div>
    );
};

export default SemPermissao;