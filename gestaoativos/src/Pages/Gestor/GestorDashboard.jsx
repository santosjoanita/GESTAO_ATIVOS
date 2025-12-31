import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ShoppingCart, User, X, ClipboardList } from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';

const GestorDashboard = () => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes');
    const [selectedEvent, setSelectedEvent] = useState(null); 
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.id_perfil !== 2) { 
        return (
            <div style={{textAlign: 'center', padding: '100px'}}>
                <h2>Acesso Negado</h2>
                <button onClick={() => navigate('/')}>Voltar</button>
            </div>
        );
    }

    const loadData = async () => {
        let url = '';
        if (tab === 'requisicoes') url = '/api/gestao/requisicoes/todas';
        else if (tab === 'eventos') url = '/api/gestao/eventos/todos';
        else if (tab === 'stock') url = '/api/stock/historico';
        try {
            const res = await fetch(`http://localhost:3001${url}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar:", error);
        }
    };

    useEffect(() => { loadData(); }, [tab]);

    const handleAcao = async (id, body) => {
        try {
            await fetch(`http://localhost:3001/api/gestao/${tab}/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body) 
            });
            loadData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="gestao-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" />
                    
                    <nav className="header-nav-esp">
                        <button onClick={() => setTab('requisicoes')} 
                            className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>
                            REQUISIÇÕES
                        </button>
                        <button onClick={() => setTab('eventos')} 
                            className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>
                            EVENTOS
                        </button>
                        <button onClick={() => setTab('stock')} 
                            className={`nav-item-esp ${tab === 'stock' ? 'active-tab-indicator' : ''}`}>
                            MOVIMENTOS STOCK
                        </button>
                         <button className="nav-item-esp" onClick={() => navigate('/stock')} >
                            STOCK
                        </button>
                    </nav>

                    <div className="header-icons-esp">
                        <Link to="/perfil"><User size={22} className="icon-esp" /></Link>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="logout-btn">
                            <LogOut size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="gestao-main">
                <h2 className="gestao-title">PAINEL DE CONTROLO: {tab.toUpperCase()}</h2>
                
                <div className="gestao-grid">
                    {items.map(item => (
                        <div key={item.id_req || item.id_historico} className="gestao-card">
                            <div className="card-info">
                                <strong>{item.item_nome || item.nome_evento}</strong>
                                
                                {tab === 'stock' ? (
                                    <>
                                        <p>Ação: {item.tipo_movimento}</p>
                                        <p>Por: {item.nome_utilizador}</p>
                                        <small>{new Date(item.data_movimento).toLocaleString()}</small>
                                    </>
                                ) : (
                                    <>
                                        <p>{item.requerente || item.localizacao}</p>
                                        <span className={`status-badge ${item.estado_nome?.toLowerCase()}`}>
                                            {item.estado_nome}
                                        </span>
                                    </>
                                )}
                            </div>

                            {tab !== 'stock' && item.estado_nome === 'Pendente' && (
                                <div className="card-actions">
                                    <button onClick={() => handleAcao(item.id_req || item.id_evento, { id_estado: 2 })} className="btn-approve">OK</button>
                                    <button onClick={() => handleAcao(item.id_req || item.id_evento, { id_estado: 3 })} className="btn-reject">X</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default GestorDashboard;