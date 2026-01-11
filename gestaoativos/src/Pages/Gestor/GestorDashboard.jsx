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
    const [materiais, setMateriais] = useState([]); 
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
        if (tab === 'stock') return;
        setSelectedItem(item);
        setAnexos([]);
        setMateriais([]); 

        // Se for Evento, carrega Anexos
        if (tab === 'eventos') {
            try {
                const res = await fetch(`http://localhost:3002/api/eventos/${item.id_evento}/anexos`, {
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                setAnexos(data);
            } catch (err) { console.error("Erro nos anexos:", err); }
        }

        // Se for Requisição, carrega os Materiais associados
        if (tab === 'requisicoes') {
            try {
                const res = await fetch(`http://localhost:3002/api/requisicoes/${item.id_req}/materiais`, {
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                setMateriais(data);
            } catch (err) { console.error("Erro nos materiais:", err); }
        }
    };

    const handleAcao = async (id, id_estado) => {
    const tipo = tab === 'requisicoes' ? 'requisicoes' : 'eventos';
    
    try {
        const res = await fetch(`http://localhost:3002/api/gestao/${tipo}/${id}/estado`, {
            method: 'PUT',
            headers: getAuthHeaders(), 
            body: JSON.stringify({ id_estado }) 
        });

        if (res.ok) {
            setSelectedItem(null);
            loadData();
        } else {
            const erroTexto = await res.text();
            console.error("Erro do servidor:", erroTexto);
            alert("Não foi possível atualizar o estado.");
        }
    } catch (err) { 
        console.error("Erro na ligação ao servidor:", err);
        alert("Erro de rede ao tentar atualizar.");
    }
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
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor: 'pointer'}} />
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
                                        <strong><Package size={16} /> {item.item_nome}</strong>
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

                            {/* SECÇÃO DE MATERIAIS (Só para Requisições) */}
                            {materiais.length > 0 && (
                                <div style={{ marginTop: '25px' }}>
                                    <label style={{ fontWeight: '800', color: 'var(--primary-blue)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Package size={18} /> MATERIAIS REQUISITADOS:
                                    </label>
                                    <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f8f9fa', borderRadius: '12px' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '12px' }}>Item</th>
                                                    <th style={{ padding: '12px' }}>Qtd</th>
                                                    <th style={{ padding: '12px' }}>Datas Reserva</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {materiais.map((m, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: '12px', fontWeight: '600' }}>{m.nome}</td>
                                                        <td style={{ padding: '12px' }}>{m.quantidade} un.</td>
                                                        <td style={{ padding: '12px', fontSize: '12px' }}>
                                                            {new Date(m.data_levantamento).toLocaleDateString()} - {new Date(m.data_devolucao).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {anexos.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <label style={{ fontWeight: '800', color: 'var(--primary-blue)', fontSize: '14px' }}>ANEXOS:</label>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        {anexos.map(anexo => (
                                            <a key={anexo.id_anexo} href={`http://localhost:3002/uploads/${anexo.nome_oculto}`} target="_blank" rel="noreferrer" className="anexo-link-estilo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', background: '#f0f2f5', padding: '8px 12px', borderRadius: '8px', color: '#1f3a52', fontWeight: 'bold', fontSize: '13px' }}>
                                                <Download size={14} /> {anexo.nome}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedItem.estado_nome?.toLowerCase() === 'pendente' && (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-approve-custom" style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '12px', background: 'var(--success-green)', color: 'white', fontWeight: '800', cursor: 'pointer' }}>APROVAR</button>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-reject-custom" style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '12px', background: 'var(--danger-red)', color: 'white', fontWeight: '800', cursor: 'pointer' }}>REJEITAR</button>
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