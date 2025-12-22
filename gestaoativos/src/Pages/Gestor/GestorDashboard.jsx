import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, LogOut, ShoppingCart, User, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';

const GestorDashboard = ({ onLogout }) => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes');
    const [selectedEvent, setSelectedEvent] = useState(null); // Estado para o Modal
    const navigate = useNavigate();
    
    // Pega o utilizador do localStorage para o "Olá"
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

    // Função para ver detalhes 
    const handleVerDetalhes = async (id) => {
        if (tab === 'eventos') {
            const res = await fetch(`http://localhost:3001/api/gestao/eventos/${id}/detalhes`);
            const data = await res.json();
            setSelectedEvent(data);
        }
    };

    const handleAcao = async (id, body) => {
        await fetch(`http://localhost:3001/api/gestao/${tab}/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        loadData();
    };

    return (
        <div className="gestao-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp">
                        <img src={logo} alt="Logo" className="logo-img" />
                    </div>
                    <nav className="header-nav-esp">
                        <button onClick={() => setTab('requisicoes')} className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>EVENTOS</button>
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
                    <p className="user-email-esp">Painel de Administração</p>
                </div>

                <h2 className="gestao-title">GESTÃO DE {tab.toUpperCase()}</h2>
                
                <div className="gestao-grid">
                    {items.map(item => {
                        const status = (item.estado || item.estado_nome || 'Pendente').toLowerCase();
                        const id = item.id_requisicao || item.id_evento;
                        
                        return (
                            <div key={id} className="gestao-card" onClick={() => handleVerDetalhes(id)}>
                                <div className="card-info">
                                    <strong>{item.nome_evento}</strong>
                                    <p>{item.requerente ? `Por: ${item.requerente}` : `Local: ${item.localizacao || 'N/A'}`}</p>
                                    <span className={`status-badge ${status}`}>{status.toUpperCase()}</span>
                                </div>
                                
                                {status.includes('pendente') && (
                                    <div className="card-actions" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => handleAcao(item.id_req, { id_estado: 2 })} className="btn-approve">APROVAR
                                    </button>
                                        <button onClick={() => handleAcao(item.id_req, { id_estado: 3 })} className="btn-reject">REJEITAR
                                    </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MODAL DE DETALHES */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalhes: {selectedEvent.evento.nome_evento}</h3>
                            <button className="close-btn" onClick={() => setSelectedEvent(null)}><X /></button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Criado por:</strong> {selectedEvent.evento.criador}</p>
                            <p><strong>Local:</strong> {selectedEvent.evento.localizacao}</p>
                            <hr />
                            <h4>Requisições para este evento:</h4>
                            {selectedEvent.requisicoes.length > 0 ? (
                                <ul className="modal-list-req">
                                    {selectedEvent.requisicoes.map(r => (
                                        <li key={r.id_requisicao}>
                                            {r.requerente} - <span className={r.estado.toLowerCase()}>{r.estado}</span>
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