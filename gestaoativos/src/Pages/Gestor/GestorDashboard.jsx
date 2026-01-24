import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, X, Calendar, Download, Package, Activity, Search, Filter, MapPin, CheckCircle, XCircle, Truck, RotateCcw, FileClock, Ban } from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';

const GestorDashboard = () => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes'); 
    const [selectedItem, setSelectedItem] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const [materiais, setMateriais] = useState([]); 
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user || user.id_perfil !== 2) {
            navigate('/'); 
            return;
        }
        loadData();
        setSearchTerm('');
        setStatusFilter('todos');
    }, [tab]);

    const getAuthHeaders = () => {
        const storedData = localStorage.getItem('user');
        const userData = storedData ? JSON.parse(storedData) : null;
        return {
            'Content-Type': 'application/json',
            'Authorization': userData && userData.token ? `Bearer ${userData.token}` : ''
        };
    };

    const loadData = async () => {
        let url = '';
        if (tab === 'requisicoes') url = 'http://localhost:3002/api/requisicoes/todas';
        else if (tab === 'eventos') url = 'http://localhost:3002/api/eventos/todos';
        else if (tab === 'stock') url = 'http://localhost:3002/api/gestao/stock/historico';
        else if (tab === 'historico_req') url = 'http://localhost:3002/api/requisicoes/historico';
        
        try {
            const res = await fetch(url, { headers: getAuthHeaders() });
            
            if (res.status === 401) {
                localStorage.clear();
                navigate('/');
                return;
            }

            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { 
            console.error("Erro ao carregar:", error);
            setItems([]);
        }
    };

    const handleVerDetalhes = async (item) => {
        if (tab === 'stock' || tab === 'historico_req') return;
        
        setSelectedItem(item);
        setAnexos([]);
        setMateriais([]); 

        if (tab === 'eventos') {
            try {
                const res = await fetch(`http://localhost:3002/api/eventos/${item.id_evento}/anexos`, { headers: getAuthHeaders() });
                if(res.ok) setAnexos(await res.json());
            } catch (err) { console.error(err); }
        }

        if (tab === 'requisicoes') {
            try {
                const res = await fetch(`http://localhost:3002/api/requisicoes/${item.id_req}/materiais`, { headers: getAuthHeaders() });
                if(res.ok) setMateriais(await res.json());
            } catch (err) { console.error(err); }
        }
    };

    // --- LÓGICA DE AÇÃO INTELIGENTE ---
    const handleAcao = async (id, id_estado_novo) => {
        let url = '';
        let body = { id_estado: id_estado_novo };

        if (tab === 'requisicoes') {
            if (id_estado_novo === 5) {
                if(!window.confirm("Isto irá devolver o stock ao armazém. Continuar?")) return;
                url = `http://localhost:3002/api/requisicoes/${id}/devolver`;
                body = { id_user: user.id_user }; 
            } 
            else if (id_estado_novo === 6) {
                if(!window.confirm("Tem a certeza que quer CANCELAR? Se já houver stock cativo, será reposto.")) return;
                url = `http://localhost:3002/api/requisicoes/${id}/cancelar`;
                body = { id_user: user.id_user };
            } 
            else {
                url = `http://localhost:3002/api/requisicoes/${id}/estado`;
            }
        } else {
            // Eventos
            url = `http://localhost:3002/api/eventos/${id}/estado`;
        }

        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: getAuthHeaders(), 
                body: JSON.stringify(body) 
            });

            if (res.ok) {
                alert("Ação realizada com sucesso!");
                setSelectedItem(null);
                loadData();
            } else {
                const err = await res.json();
                alert("Erro: " + (err.message || err.error));
            }
        } catch (err) { console.error(err); alert("Erro de conexão."); }
    };

    // --- LÓGICA DE FILTRAGEM ---
    const filteredItems = items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        let matchesSearch = false;
        
        if (tab === 'stock') {
             matchesSearch = (item.item_nome || '').toLowerCase().includes(searchLower) ||
                             (item.nome_utilizador || '').toLowerCase().includes(searchLower);
        } else if (tab === 'historico_req') {
             matchesSearch = (item.acao || '').toLowerCase().includes(searchLower) ||
                             (item.nome_responsavel || '').toLowerCase().includes(searchLower) ||
                             (item.id_req && item.id_req.toString().includes(searchLower));
        } else {
             matchesSearch = (item.nome_evento || '').toLowerCase().includes(searchLower) ||
                             (item.requerente || '').toLowerCase().includes(searchLower) ||
                             (item.id_req && item.id_req.toString().includes(searchLower));
        }

        let matchesStatus = true;
        if (tab !== 'stock' && tab !== 'historico_req' && statusFilter !== 'todos') {
            const st = (item.estado_nome || '').toLowerCase();
            if (statusFilter === 'aprovada') matchesStatus = st.includes('aprov') || st.includes('agend');
            else if (statusFilter === 'finalizada') matchesStatus = st.includes('final') || st.includes('concl');
            else if (statusFilter === 'cancelada') matchesStatus = st.includes('cancel') || st.includes('rejeit') || st.includes('recus');
            else matchesStatus = st.includes(statusFilter);
        }

        return matchesSearch && matchesStatus;
    });

    if (!user || user.id_perfil !== 2) return null;

    return (
        <div className="gestao-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor: 'pointer'}} />
                    <nav className="header-nav-esp">
                        <button onClick={() => setTab('requisicoes')} className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>EVENTOS</button>
                        <button onClick={() => setTab('historico_req')} className={`nav-item-esp ${tab === 'historico_req' ? 'active-tab-indicator' : ''}`}>HISTÓRICO REQ.</button>
                        <button onClick={() => setTab('stock')} className={`nav-item-esp ${tab === 'stock' ? 'active-tab-indicator' : ''}`}>HISTÓRICO STOCK</button>
                        <button className="nav-item-esp" onClick={() => navigate('/stock')} >STOCK ATUAL</button>
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
                <div className="page-header-container">
                    <h2 className="gestao-title">
                        {tab === 'stock' && 'AUDITORIA DE STOCK'}
                        {tab === 'historico_req' && 'AUDITORIA DE REQUISIÇÕES'}
                        {tab === 'requisicoes' && 'GERIR REQUISIÇÕES'}
                        {tab === 'eventos' && 'GERIR EVENTOS'}
                    </h2>
                    
                    <div className="filters-container">
                        <div className="search-input-wrapper">
                            <Search size={18} className="search-icon"/>
                            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                        </div>
                        
                        {tab !== 'stock' && tab !== 'historico_req' && (
                            <div className="filter-select-wrapper">
                                <Filter size={18} className="filter-icon"/>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="todos">Todos os Estados</option>
                                    <option value="pendente">Pendente</option>
                                    <option value="aprovada">Aprovada / Agendado</option>
                                    <option value="recusada">Recusada / Rejeitado</option>
                                    <option value="em curso">Em Curso</option>
                                    <option value="finalizada">Finalizada / Concluído</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="gestao-grid">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div key={item.id_req || item.id_evento || item.id_hist || Math.random()} 
                                 className="gestao-card"
                                 onClick={() => handleVerDetalhes(item)}
                                 style={{ cursor: (tab === 'stock' || tab === 'historico_req') ? 'default' : 'pointer' }}>
                                
                                <div className="card-info">
                                    {/* CARD STOCK */}
                                    {tab === 'stock' && (
                                        <>
                                            <strong><Package size={16} /> {item.item_nome}</strong>
                                            <p><User size={14} /> {item.nome_utilizador}</p>
                                            <p><Activity size={14} /> {item.tipo_movimento} ({item.quantidade_alt})</p>
                                            <p style={{fontSize:'0.8em', color:'#888'}}>{new Date(item.data_movimento).toLocaleString('pt-PT')}</p>
                                        </>
                                    )}

                                    {/* CARD HISTÓRICO REQUISIÇÕES */}
                                    {tab === 'historico_req' && (
                                        <>
                                            <strong><FileClock size={16} /> Req #{item.id_req} - {item.acao}</strong>
                                            <p><User size={14} /> Por: {item.nome_responsavel}</p>
                                            <p style={{fontStyle:'italic', color:'#555', fontSize:'0.9em'}}>{item.detalhes}</p>
                                            <p style={{fontSize:'0.8em', color:'#888'}}><Calendar size={12}/> {new Date(item.data_acao).toLocaleString('pt-PT')}</p>
                                        </>
                                    )}

                                    {/* CARD NORMAL */}
                                    {tab !== 'stock' && tab !== 'historico_req' && (
                                        <>
                                            <strong>{item.nome_evento || `Requisição #${item.id_req}`}</strong>
                                            <p>{item.requerente}</p>
                                            <span className={`status-badge ${item.estado_nome?.toLowerCase().replace(' ', '-')}`}>
                                                {item.estado_nome}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{gridColumn: '1/-1', textAlign:'center', color:'#888', padding:'20px'}}>Nenhum resultado encontrado.</p>
                    )}
                </div>
            </main>

            {/* MODAL GESTOR */}
            {selectedItem && tab !== 'stock' && tab !== 'historico_req' && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>DETALHES REQ #{selectedItem.id_req || selectedItem.id_evento}</h3>
                            <button onClick={() => setSelectedItem(null)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <h4 className="modal-main-title">{selectedItem.nome_evento || `Requisição #${selectedItem.id_req}`}</h4>
                            
                            <div className="info-grid-esp">
                                <p><User size={16} /> <strong>Requerente:</strong> {selectedItem.requerente}</p>
                                <p><Calendar size={16} /> <strong>Data:</strong> {selectedItem.data_inicio ? new Date(selectedItem.data_inicio).toLocaleDateString() : new Date(selectedItem.data_pedido).toLocaleDateString()}</p>
                                <p><strong>Estado:</strong> {selectedItem.estado_nome}</p>
                            </div>

                            {/* Materiais e Anexos (Visualização simplificada para brevidade) */}
                            {materiais.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    <label style={{fontWeight:'800', fontSize:'13px', color:'var(--primary-blue)'}}>MATERIAIS:</label>
                                    <ul style={{background:'#f8f9fa', padding:'10px', borderRadius:'8px', listStyle:'none'}}>
                                        {materiais.map((m, idx) => (<li key={idx} style={{padding:'3px 0', borderBottom:'1px solid #eee'}}>{m.nome} — <strong>{m.quantidade}</strong></li>))}
                                    </ul>
                                </div>
                            )}

                            {/* BOTÕES DE AÇÃO */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', flexWrap: 'wrap' }}>
                                {selectedItem.estado_nome?.toLowerCase() === 'pendente' && (
                                    <>
                                        <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-action-gestor btn-aprovar"><CheckCircle size={16} /> APROVAR</button>
                                        <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-action-gestor btn-rejeitar"><XCircle size={16} /> REJEITAR</button>
                                    </>
                                )}
                                
                                {tab === 'requisicoes' && (selectedItem.estado_nome?.toLowerCase().includes('aprov') || selectedItem.estado_nome?.toLowerCase().includes('agend')) && (
                                    <>
                                        <button onClick={() => handleAcao(selectedItem.id_req, 4)} className="btn-action-gestor btn-em-curso" style={{background:'#f39c12', color:'white'}}>
                                            <Truck size={16} /> MARCAR LEVANTAMENTO
                                        </button>
                                        {/* Botão Cancelar (Extra para Gestor) */}
                                        <button onClick={() => handleAcao(selectedItem.id_req, 6)} className="btn-action-gestor btn-cancelar" style={{background:'#e74c3c', color:'white'}}>
                                            <Ban size={16} /> CANCELAR
                                        </button>
                                    </>
                                )}

                                {tab === 'requisicoes' && selectedItem.estado_nome?.toLowerCase().includes('em curso') && (
                                    <button onClick={() => handleAcao(selectedItem.id_req, 5)} className="btn-action-gestor btn-finalizar" style={{background:'#2ecc71', color:'white'}}>
                                        <RotateCcw size={16} /> FINALIZAR (DEVOLVIDO)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <footer className="fixed-footer-esp">
                <div className="footer-items-wrapper"><span className="footer-project-esp">Gestão de Ativos & Eventos - Município de Esposende</span></div>
            </footer>
        </div>
    );
};

export default GestorDashboard;