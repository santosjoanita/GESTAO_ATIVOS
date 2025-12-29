import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ShoppingCart, User, X } from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';

const GestorDashboard = ({ onLogout }) => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes');
    const [selectedEvent, setSelectedEvent] = useState(null); 
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));

    const loadData = async () => {
        const url = tab === 'requisicoes' ? '/api/gestao/requisicoes/todas' : '/api/gestao/eventos/todos';
        try {
            const res = await fetch(`http://localhost:3001${url}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    useEffect(() => { loadData(); }, [tab]);

    const getStatusColor = (status) => {
        const s = (status || '').toString().toLowerCase();
        if (s.includes('aprovad')) return 'aprovado';
        if (s.includes('rejeitad')) return 'rejeitado';
        return 'pendente';
    };

    const handleVerDetalhes = async (id) => {
        if (tab === 'eventos') {
            try {
                const res = await fetch(`http://localhost:3001/api/gestao/eventos/${id}/detalhes`);
                const data = await res.json();
                setSelectedEvent(data);
            } catch (err) {
                console.error("Erro ao carregar detalhes:", err);
            }
        }
    };

    const handleAcao = async (id, body) => {
    if (!id || id === 'undefined') {
        console.error("Erro: ID não definido para a ação.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3001/api/gestao/${tab}/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body) 
        });

        if (res.ok) {
            loadData(); 
        } else {
            const errorText = await res.text();
            console.error("Erro no servidor:", errorText);
        }
    } catch (err) {
        console.error("Erro ao atualizar estado:", err);
    }
};

    return (
        <div className="gestao-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp">
                        <img src={logo} alt="Logo" className="logo-img" />
                    </div>
                    <nav className="header-nav-esp">
                        <button 
                            onClick={() => setTab('requisicoes')} 
                            className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}
                        >
                            REQUISIÇÕES
                        </button>
                        <button 
                            onClick={() => setTab('eventos')} 
                            className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}
                        >
                            EVENTOS
                        </button>
                    </nav>
                    <div className="header-icons-esp">
                        <ShoppingCart size={22} className="icon-esp" />
                        <Link to="/perfil"><User size={22} className="icon-esp" /></Link>
                        <button onClick={onLogout} className="logout-btn">
                            <LogOut size={22} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="gestao-main centered-content">
                <div className="user-panel-esp">
                    <h2 className="user-title-esp">Olá, {user?.nome || 'Gestor'}.</h2>
                </div>

                <h2 className="gestao-title">GESTÃO DE {tab.toUpperCase()}</h2>
                
                <div className="gestao-grid">
                    {items.map(item => {
                        const statusColorClass = getStatusColor(item.estado_nome || item.estado);
                        const statusText = (item.estado_nome || item.estado || 'Pendente');
                        const itemId = item.id_req || item.id_evento;
                        
                        return (
                            <div key={itemId} className="gestao-card" onClick={() => handleVerDetalhes(itemId)}>
                                <div className="card-info">
                                    <strong>{item.nome_evento}</strong>
                                    <p>{item.requerente ? `Por: ${item.requerente}` : `Local: ${item.localizacao || 'N/A'}`}</p>
                                    <span className={`status-badge ${statusColorClass}`}>
                                        {statusText.toUpperCase()}
                                    </span>
                                </div>
                                
                                {statusText.toLowerCase().includes('pendente') && (
                            <div className="card-actions" onClick={e => e.stopPropagation()}>
                                {/* Usamos itemId em vez de item.id_req */}
                                <button 
                                    onClick={() => handleAcao(itemId, { id_estado: 2 })} 
                                    className="btn-approve"
                                > 
                                    APROVAR
                                </button>
                                <button 
                                    onClick={() => handleAcao(itemId, { id_estado: 3 })}  
                                    className="btn-reject"
                                >
                                    REJEITAR
                                </button>
                            </div>
                        )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MODAL DE DETALHES COM PROTEÇÃO PARA CAMPOS NULOS */}
            {selectedEvent && selectedEvent.evento && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalhes: {selectedEvent.evento.nome_evento}</h3>
                            <button className="close-btn" onClick={() => setSelectedEvent(null)}><X /></button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Criado por:</strong> {selectedEvent.evento.criador || 'N/A'}</p>
                            <p><strong>Local:</strong> {selectedEvent.evento.localizacao || 'N/A'}</p>
                            <hr />
                            <h4>Requisições associadas:</h4>
                            {selectedEvent.requisicoes && selectedEvent.requisicoes.length > 0 ? (
                                <ul className="modal-list-req">
                                    {selectedEvent.requisicoes.map(r => (
                                        <li key={r.id_req}>
                                            {r.requerente} - <span className={getStatusColor(r.estado_nome)}>
                                                {r.estado_nome || 'Pendente'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p>Sem requisições associadas.</p>}
                        </div>
                    </div>
                </div>
            )}

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper">
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp" onClick={() => navigate('/stock')}>ATUALIZAR STOCK</button>
                        <span className="footer-project-esp">MODO ADMINISTRADOR</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GestorDashboard;