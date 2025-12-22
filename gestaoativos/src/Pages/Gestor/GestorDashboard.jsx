import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, LogOut, ShoppingCart, User, Search } from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';

const GestorDashboard = ({ onLogout }) => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes');

    const loadData = async () => {
        const url = tab === 'requisicoes' ? '/api/gestao/requisicoes/todas' : '/api/gestao/eventos/todos';
        const res = await fetch(`http://localhost:3001${url}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
    };

    useEffect(() => { loadData(); }, [tab]);

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
                    <img src={logo} alt="Logo" className="logo-img" />
                    <nav className="header-nav-esp">
                        <button onClick={() => setTab('requisicoes')} className={tab === 'requisicoes' ? 'active' : ''}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={tab === 'eventos' ? 'active' : ''}>EVENTOS</button>
                    </nav>
                    <div className="header-icons-esp">
                        <ShoppingCart size={22} color="white" />
                        <User size={22} color="white" />
                        <LogOut size={22} color="white" onClick={onLogout} style={{cursor:'pointer'}} />
                    </div>
                </div>
            </header>

            <main className="gestao-main centered-content">
                <h2 className="gestao-title">Gestão de Ativos - {tab.toUpperCase()}</h2>
                <div className="gestao-grid">
                    {items.map(item => {
                        const status = (item.estado || item.estado_nome || 'Pendente').toLowerCase();
                        return (
                            <div key={item.id_requisicao || item.id_evento} className="gestao-card">
                                <div className="card-info">
                                    <strong>{item.nome_evento}</strong>
                                    <p>{item.requerente ? `Por: ${item.requerente}` : `Status: ${status}`}</p>
                                </div>
                                {status === 'pendente' && (
                                    <div className="card-actions">
                                        <button onClick={() => handleAcao(item.id_requisicao || item.id_evento, tab === 'requisicoes' ? {estado:'Aprovada'} : {id_estado: 2})} className="btn-approve">APROVAR</button>
                                        <button onClick={() => handleAcao(item.id_requisicao || item.id_evento, tab === 'requisicoes' ? {estado:'Rejeitada'} : {id_estado: 3})} className="btn-reject">REJEITAR</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <span style={{color:'white'}}>PT | EN</span>
                    <button className="explore-btn"><Search size={16} /> VOLTAR À HOME</button>
                    <span style={{color:'white'}}>PAINEL ADMINISTRATIVO</span>
                </div>
            </footer>
        </div>
    );
};

export default GestorDashboard;