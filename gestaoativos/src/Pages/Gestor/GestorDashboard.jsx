import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, X, Calendar, Download, FileText, Package, Activity } from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';

const GestorDashboard = () => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes');
    const [selectedItem, setSelectedItem] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (user && user.id_perfil === 2) {
            loadData();
        }
    }, [tab]);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'x-user-profile': user?.id_perfil?.toString(),
        'x-user-name': user?.nome
    });

    const loadData = async () => {
        let url = '';
        if (tab === 'requisicoes') url = 'http://localhost:3002/api/requisicoes/todas';
        else if (tab === 'eventos') url = 'http://localhost:3002/api/eventos/todos';
        else if (tab === 'stock') url = 'http://localhost:3002/api/gestao/stock/historico';
        
        try {
            const res = await fetch(url, { headers: getAuthHeaders() });
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { 
            console.error("Erro ao carregar:", error);
            setItems([]);
        }
    };

    const handleVerDetalhes = async (item) => {
        if (tab === 'stock') return; // Stock não precisa de modal de aprovação
        setSelectedItem(item);
        setAnexos([]);
        if (tab === 'eventos') {
            try {
                const res = await fetch(`http://localhost:3002/api/eventos/${item.id_evento}/anexos`, {
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                setAnexos(data);
            } catch (err) { console.error("Erro nos anexos:", err); }
        }
    };

    const handleAcao = async (id, id_estado) => {
        const endpoint = tab === 'requisicoes' ? 'requisicoes' : 'eventos';
        try {
            const res = await fetch(`http://localhost:3002/api/${endpoint}/${id}/estado`, {
                method: 'PUT',
                headers: getAuthHeaders(), 
                body: JSON.stringify({ id_estado }) 
            });
            if (res.ok) {
                setSelectedItem(null);
                loadData();
            }
        } catch (err) { console.error(err); }
    };

    if (!user || user.id_perfil !== 2) { 
        return (
            <div style={{textAlign: 'center', padding: '100px'}}>
                <h2>Acesso Negado</h2>
                <button onClick={() => navigate('/')}>Voltar ao Login</button>
            </div>
        );
    }

    return (
        <div className="gestao-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp">
                    <img src={logo} alt="Logo" className="logo-img" />
                    <nav className="header-nav-esp">
                        <button onClick={() => setTab('requisicoes')} className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>EVENTOS</button>
                        <button onClick={() => setTab('stock')} className={`nav-item-esp ${tab === 'stock' ? 'active-tab-indicator' : ''}`}>MOVIMENTOS STOCK</button>
                        <button className="nav-item-esp" onClick={() => navigate('/stock')} >STOCK</button>
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
                <h2 className="gestao-title">PAINEL DE CONTROLO: {tab === 'stock' ? 'HISTÓRICO DE MOVIMENTOS' : tab.toUpperCase()}</h2>
                <div className="gestao-grid">
                    {items.map(item => (
                        <div key={item.id_req || item.id_evento || item.id_historico || Math.random()} 
                             className="gestao-card"
                             onClick={() => handleVerDetalhes(item)}
                             style={{ cursor: tab === 'stock' ? 'default' : 'pointer' }}>
                            
                            <div className="card-info">
                                {tab === 'stock' ? (
                                    <>
                                        <strong><Package size={16} inline /> {item.item_nome}</strong>
                                        <p><User size={14} /> <b>Utilizador:</b> {item.nome_utilizador}</p>
                                        <p><Activity size={14} /> <b>Ação:</b> {item.tipo_movimento} ({item.quantidade_alt} unidades)</p>
                                        <p><Calendar size={14} /> <b>Data:</b> {new Date(item.data_movimento).toLocaleString('pt-PT')}</p>
                                    </>
                                ) : (
                                    <>
                                        <strong>{item.nome_evento || `Requisição #${item.id_req}`}</strong>
                                        <p>{item.requerente}</p>
                                        <span className={`status-badge ${item.estado_nome?.toLowerCase()}`}>
                                            {item.estado_nome}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-items-wrapper">
                    <span className="footer-project-esp">Gestão de Ativos & Eventos - Município de Esposende</span>
                </div>
            </footer>

            {selectedItem && tab !== 'stock' && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>DETALHES DO REGISTO</h3>
                            <button onClick={() => setSelectedItem(null)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <h4 className="modal-main-title">{selectedItem.nome_evento || `Requisição #${selectedItem.id_req}`}</h4>
                            
                            <div className="info-grid-esp">
                                <p><User size={16} /> <strong>Requerente:</strong> {selectedItem.requerente}</p>
                                <p><Calendar size={16} /> <strong>Data:</strong> {selectedItem.data_inicio ? new Date(selectedItem.data_inicio).toLocaleDateString() : new Date(selectedItem.data_pedido).toLocaleDateString()}</p>
                                <p><strong>Estado:</strong> {selectedItem.estado_nome}</p>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <label style={{ fontWeight: '800', color: 'var(--primary-blue)', fontSize: '14px' }}>ESPECIFICAÇÕES:</label>
                                <div className="specs-box">
                                    {selectedItem.descricao || "Sem detalhes adicionais."}
                                </div>
                            </div>

                            {anexos.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <label style={{ fontWeight: '800', color: 'var(--primary-blue)', fontSize: '14px' }}>ANEXOS:</label>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        {anexos.map(anexo => (
                                            <a key={anexo.id_anexo} href={`http://localhost:3002/uploads/${anexo.nome_oculto}`} target="_blank" rel="noreferrer" className="anexo-link-estilo">
                                                <Download size={14} /> {anexo.nome}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedItem.estado_nome?.toLowerCase() === 'pendente' && (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-approve-custom">APROVAR</button>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-reject-custom">REJEITAR</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestorDashboard;