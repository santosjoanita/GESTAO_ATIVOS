import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, X, Calendar, Download, Package, Activity, Search, Filter } from 'lucide-react';
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
        if (user && user.id_perfil === 2) {
            loadData();
        }
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

        if (tab === 'eventos') {
            try {
                const res = await fetch(`http://localhost:3002/api/eventos/${item.id_evento}/anexos`, { headers: getAuthHeaders() });
                const data = await res.json();
                setAnexos(data);
            } catch (err) { console.error(err); }
        }

        if (tab === 'requisicoes') {
            try {
                const res = await fetch(`http://localhost:3002/api/requisicoes/${item.id_req}/materiais`, { headers: getAuthHeaders() });
                const data = await res.json();
                setMateriais(data);
            } catch (err) { console.error(err); }
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
                alert("Não foi possível atualizar o estado.");
            }
        } catch (err) { console.error(err); }
    };

    // --- LÓGICA DE FILTRAGEM ---
    const filteredItems = items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        let matchesSearch = false;
        
        if (tab === 'stock') {
             matchesSearch = (item.item_nome || '').toLowerCase().includes(searchLower) ||
                             (item.nome_utilizador || '').toLowerCase().includes(searchLower);
        } else {
             matchesSearch = (item.nome_evento || '').toLowerCase().includes(searchLower) ||
                             (item.requerente || '').toLowerCase().includes(searchLower) ||
                             (item.id_req && item.id_req.toString().includes(searchLower));
        }

        let matchesStatus = true;
        if (tab !== 'stock' && statusFilter !== 'todos') {
            matchesStatus = (item.estado_nome || '').toLowerCase() === statusFilter;
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
                <div className="page-header-container">
                    <h2 className="gestao-title">
                        PAINEL DE CONTROLO: {tab === 'stock' ? 'HISTÓRICO' : tab.toUpperCase().replace('REQUISICOES', 'REQUISIÇÕES')}
                    </h2>
                    
                    <div className="filters-container">
                        <div className="search-input-wrapper">
                            <Search size={18} className="search-icon"/>
                            <input 
                                type="text" 
                                placeholder="Pesquisar nome, ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {tab !== 'stock' && (
                            <div className="filter-select-wrapper">
                                <Filter size={18} className="filter-icon"/>
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="todos">Todos os Estados</option>
                                    <option value="pendente">Pendente</option>
                                    <option value="aprovado">Aprovado</option>
                                    <option value="rejeitado">Rejeitado</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="gestao-grid">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div key={item.id_req || item.id_evento || item.id_historico || Math.random()} 
                                 className="gestao-card"
                                 onClick={() => handleVerDetalhes(item)}
                                 style={{ cursor: tab === 'stock' ? 'default' : 'pointer' }}>
                                
                                <div className="card-info">
                                    {tab === 'stock' ? (
                                        <>
                                            <strong><Package size={16} /> {item.item_nome}</strong>
                                            <p><User size={14} /> <b>Quem:</b> {item.nome_utilizador}</p>
                                            <p><Activity size={14} /> {item.tipo_movimento} ({item.quantidade_alt})</p>
                                            <p><Calendar size={14} /> {new Date(item.data_movimento).toLocaleString('pt-PT')}</p>
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
                        ))
                    ) : (
                        <p style={{gridColumn: '1/-1', textAlign:'center', color:'#888', padding:'20px'}}>
                            Nenhum resultado encontrado.
                        </p>
                    )}
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
                            <h3>DETALHES</h3>
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
                                <label style={{ fontWeight: '800', color: 'var(--primary-blue)', fontSize: '14px' }}>DESCRIÇÃO:</label>
                                <div className="specs-box">
                                    {selectedItem.descricao || "Sem detalhes adicionais."}
                                </div>
                            </div>

                            {materiais.length > 0 && (
                                <div style={{ marginTop: '25px' }}>
                                    <label style={{ fontWeight: '800', color: 'var(--primary-blue)', fontSize: '14px' }}>MATERIAIS:</label>
                                    <ul style={{background:'#f8f9fa', padding:'10px', borderRadius:'8px', listStyle:'none'}}>
                                        {materiais.map((m, idx) => (
                                            <li key={idx} style={{padding:'5px 0', borderBottom:'1px solid #eee'}}>
                                                {m.nome} — <strong>{m.quantidade} un.</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {anexos.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <label style={{ fontWeight: '800', color: 'var(--primary-blue)', fontSize: '14px' }}>ANEXOS:</label>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
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
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-approve-custom" style={{flex:1, padding:'15px', border:'none', borderRadius:'12px', background:'var(--success-green)', color:'white', fontWeight:'bold', cursor:'pointer'}}>APROVAR</button>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-reject-custom" style={{flex:1, padding:'15px', border:'none', borderRadius:'12px', background:'var(--danger-red)', color:'white', fontWeight:'bold', cursor:'pointer'}}>REJEITAR</button>
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