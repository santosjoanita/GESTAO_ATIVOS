import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ShoppingCart, User, LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GestorDashboard.css'; 
import logo from '../../assets/img/esposende.png'; 

const GestorDashboard = ({ onLogout }) => {
    const [requisicoes, setRequisicoes] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [tab, setTab] = useState('requisicoes');
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const resReq = await fetch('http://localhost:3001/api/gestao/requisicoes/todas');
            setRequisicoes(await resReq.json());
            const resEv = await fetch('http://localhost:3001/api/gestao/eventos/todos'); 
            setEventos(await resEv.json());
        } catch (err) { console.error("Erro ao carregar dados:", err); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDecisaoReq = async (id, novoEstado) => {
        const res = await fetch(`http://localhost:3001/api/gestao/requisicoes/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: novoEstado })
        });
        if (res.ok) fetchData();
    };

    const handleDecisaoEvento = async (id, idEstado) => {
        const res = await fetch(`http://localhost:3001/api/gestao/eventos/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_estado: idEstado })
        });
        if (res.ok) fetchData();
    };

    return (
        <div className="gestao-page-layout">
            {/* HEADER PADRÃO ESPOSENDE */}
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp"><img src={logo} alt="Logo" className="logo-img" /></div>
                    <nav className="header-nav-esp">
                        <button onClick={() => setTab('requisicoes')} className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>EVENTOS</button>
                        <button onClick={() => setTab('stock')} className={`nav-item-esp ${tab === 'stock' ? 'active-tab-indicator' : ''}`}>STOCK</button>
                    </nav>
                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <User size={24} className="icon-esp" />
                        <button onClick={onLogout} className="logout-btn-clean">
                            <LogOut size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="gestao-main-content">
                <div className="gestao-centered-wrapper">
                    <h2 className="gestao-section-title">PAINEL DE GESTÃO - {tab.toUpperCase()}</h2>
                    
                    <div className="gestao-list-container">
                        {tab === 'requisicoes' && requisicoes.map(r => (
                            <div key={r.id_requisicao} className="gestao-item-card">
                                <div className="gestao-info">
                                    <span className="item-main-text">{r.nome_evento}</span>
                                    <span className="item-sub-text">Requerente: {r.requerente} | <strong>{r.estado}</strong></span>
                                </div>
                                {r.estado === 'Pendente' && (
                                    <div className="gestao-actions">
                                        <button onClick={() => handleDecisaoReq(r.id_requisicao, 'Aprovada')} className="btn-action btn-check"><CheckCircle size={20}/></button>
                                        <button onClick={() => handleDecisaoReq(r.id_requisicao, 'Rejeitada')} className="btn-action btn-cross"><XCircle size={20}/></button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {tab === 'eventos' && eventos.map(e => (
                            <div key={e.id_evento} className="gestao-item-card">
                                <div className="gestao-info">
                                    <span className="item-main-text">{e.nome_evento}</span>
                                    <span className="item-sub-text">Estado: {e.estado_nome}</span>
                                </div>
                                {e.estado_nome === 'Pendente' && (
                                    <div className="gestao-actions">
                                        <button onClick={() => handleDecisaoEvento(e.id_evento, 2)} className="btn-action btn-check">APROVAR</button>
                                        <button onClick={() => handleDecisaoEvento(e.id_evento, 3)} className="btn-action btn-cross">REJEITAR</button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {tab === 'stock' && (
                            <div className="gestao-empty-state">Módulo de Stock em desenvolvimento...</div>
                        )}
                    </div>
                </div>
            </main>

            {/* FOOTER PADRÃO ESPOSENDE */}
            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp" onClick={() => navigate('/home')}>
                            <Search size={16} /> VOLTAR À HOME
                        </button>
                        <span className="footer-project-esp">PAINEL ADMINISTRATIVO</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GestorDashboard;