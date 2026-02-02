import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CornerDownLeft, User, X, Calendar, Download, Package, Activity, Filter, MapPin, CheckCircle, XCircle, Truck, RotateCcw, FileClock, Ban, FileText, ShoppingCart, Edit} from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';
import Toast from '../../components/Toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';

const formatarData = (dataISO) => {
    if (!dataISO) return '--/--/----';
    return new Date(dataISO).toLocaleDateString('pt-PT');
};

const GestorDashboard = () => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes'); 
    const [selectedItem, setSelectedItem] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const [materiais, setMateriais] = useState([]); 
    
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pendente'); 
    
    const [carrinhoCount, setCarrinhoCount] = useState(0);

    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, action: null, id: null, novoEstado: null });

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const isGestor = user?.id_perfil === 2;

    useEffect(() => {
        if (!user || user.id_perfil !== 2) {
            navigate('/'); 
            return;
        }
        setItems([]); 
        loadData();
        setSearchTerm('');

        if (tab === 'requisicoes' || tab === 'eventos') {
        setStatusFilter('pendente');
        }
        const cart = JSON.parse(localStorage.getItem('carrinho')) || [];
        setCarrinhoCount(cart.length);
        
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
        setLoading(true);
        let url = '';
        
        if (tab === 'requisicoes') url = 'http://localhost:3002/api/requisicoes/todas';
        else if (tab === 'eventos') url = 'http://localhost:3002/api/eventos/todos';
        else if (tab === 'stock') url = 'http://localhost:3002/api/gestao/stock/historico';
        else if (tab === 'historico_req') url = 'http://localhost:3002/api/requisicoes/historico';
        
        try {
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (res.status === 401) { localStorage.clear(); navigate('/'); return; }
            if (!res.ok) throw new Error("Falha ao carregar dados");
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { 
            console.error("Erro ao carregar:", error);
            setToast({ type: 'error', message: "Erro de conexão ao carregar dados." });
            setItems([]);
        } finally { setLoading(false); }
    };

    const handleVerDetalhes = async (item) => {
        if (!item || tab === 'stock' || tab === 'historico_req') return; 
        
        setSelectedItem(item);
        setAnexos([]);
        setMateriais([]); 

        if (tab === 'eventos' && item.id_evento) {
            try {
                const res = await fetch(`http://localhost:3002/api/eventos/${item.id_evento}/anexos`, { headers: getAuthHeaders() });
                if(res.ok) setAnexos(await res.json());
            } catch (err) { console.error("Erro anexos:", err); }
        }

        if (tab === 'requisicoes' && item.id_req) {
            try {
                const res = await fetch(`http://localhost:3002/api/requisicoes/${item.id_req}/materiais`, { headers: getAuthHeaders() });
                if(res.ok) setMateriais(await res.json());
            } catch (err) { console.error("Erro materiais:", err); }
        }
    };

    const handleEditarComoGestor = () => {
        localStorage.setItem('evento_trabalho', JSON.stringify({
            id_req: selectedItem.id_req,
            nome: selectedItem.nome_evento || `Req #${selectedItem.id_req}`
        }));
        navigate('/explorar');
    };

    const prepararAcao = (id, id_estado_novo) => {
        if (!id) return;
        if (id_estado_novo === 5 || id_estado_novo === 6 || id_estado_novo === 3) {
            setModal({ isOpen: true, action: 'confirmar_acao', id, novoEstado: id_estado_novo });
        } else {
            executarAcao(id, id_estado_novo);
        }
    };

        const executarAcao = async (id = modal.id, id_estado_novo = modal.novoEstado) => {
        let url = '';
        let body = { id_estado: id_estado_novo };

        if (tab === 'requisicoes') {
            if (id_estado_novo === 5) {
                url = `http://localhost:3002/api/requisicoes/${id}/devolver`;
                body = { id_user: user.id_user }; 
            } 
            else if (id_estado_novo === 6) {
                url = `http://localhost:3002/api/requisicoes/${id}/cancelar`;
                body = { id_user: user.id_user };
            } 
            else {
                url = `http://localhost:3002/api/requisicoes/${id}/estado`;
            }
        } else {
            url = `http://localhost:3002/api/eventos/${id}/estado`;
        }

        try {
            const res = await fetch(url, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body) 
            });

            if (res.ok) {
                const acaoNome = id_estado_novo === 2 ? "Aprovada" : 
                                id_estado_novo === 3 ? "Rejeitada" : 
                                id_estado_novo === 5 ? "Devolvida" : 
                                id_estado_novo === 6 ? "Cancelada" : "Atualizada";
                
                setToast({ type: 'success', message: `${tab === 'eventos' ? 'Evento' : 'Requisição'} ${acaoNome} com sucesso!` });
                
                setSelectedItem(null);
                loadData(); 
            } else {
                const err = await res.json();
                setToast({ type: 'error', message: "Erro: " + (err.message || "Não foi possível concluir a ação.") });
            }
        } catch (err) { 
            setToast({ type: 'error', message: "Erro de conexão ao servidor." }); 
        }
        
        setModal({ isOpen: false, action: null, id: null, novoEstado: null });
    };

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

        if (tab === 'stock' || tab === 'historico_req') return matchesSearch;

        const statusNoItem = (item.estado_nome || item.status || '').toLowerCase();
        const filtro = statusFilter.toLowerCase();

        let matchesStatus = false;

        if (filtro === 'todos') {
            matchesStatus = true;
        } else if (filtro === 'aprovada') {
            matchesStatus = statusNoItem.includes('aprov') || statusNoItem.includes('agend');
        } else if (filtro === 'cancelada') {
            matchesStatus = statusNoItem.includes('cancel') || statusNoItem.includes('recus') || statusNoItem.includes('rejeit');
        } else {
            matchesStatus = statusNoItem.includes(filtro.substring(0, 4)); 
        }

        return matchesSearch && matchesStatus;
    });

    const handleLogout = () => {
        localStorage.clear();
        if (user?.onLogout) user.onLogout();
        navigate('/');
    };

    return (
        <div className="gestao-layout">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ModalConfirmacao isOpen={modal.isOpen} title="Confirmação" message="Prosseguir com a ação?" confirmText="Confirmar" onConfirm={() => executarAcao()} onCancel={() => setModal({ isOpen: false, action: null, id: null, novoEstado: null })} />

            <header className="fixed-header-esp">
                <div className="header-content-esp">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor: 'pointer'}} />
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <button onClick={() => setTab('requisicoes')} className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>EVENTOS</button>
                        <button onClick={() => setTab('historico_req')} className={`nav-item-esp ${tab === 'historico_req' ? 'active-tab-indicator' : ''}`}>HISTÓRICO REQ.</button>
                        <button onClick={() => setTab('stock')} className={`nav-item-esp ${tab === 'stock' ? 'active-tab-indicator' : ''}`}>HISTÓRICO STOCK</button>
                        <button className="nav-item-esp" onClick={() => navigate('/stock')} >STOCK ATUAL</button>
                    </nav>
                    <div className="header-icons-esp">
                        <div className="user-profile-badge" style={{ marginRight: '15px', textAlign: 'right' }}>
                            <span style={{ color: 'white', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                                {user?.nome?.split(' ')[0]}
                            </span>
                            <span style={{ color: '#3498db', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>
                                {user?.id_perfil === 2 ? 'GESTOR' : 'FUNCIONÁRIO'}
                            </span>
                        </div>
                        <Link to="/carrinho"><ShoppingCart size={24} className="icon-esp" /></Link>
                        <Link to="/perfil"><User size={24} className="icon-esp active-icon-indicator" /></Link>
                        <button onClick={handleLogout} className="logout-btn"><CornerDownLeft size={24} className="icon-esp" /></button>
                    </div>
                </div>
            </header>

            <main className="gestao-main">
                <div className="page-header-container">
                    <h2 className="gestao-title">{tab === 'requisicoes' ? 'GERIR REQUISIÇÕES' : tab === 'eventos' ? 'GERIR EVENTOS' : tab === 'stock' ? 'AUDITORIA DE STOCK' : 'AUDITORIA'}</h2>
                    <div className="filters-container">
                        <div className="search-input-wrapper">
                            <input 
                                type="text" 
                                placeholder={tab === 'stock' ? "Procurar material..." : "Procurar por ID ou nome..."} 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>

                        {tab !== 'stock' && tab !== 'historico_req' && (
                            <div className="filter-select-wrapper">
                                <Filter size={20} className="filter-icon" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="pendente">Pendentes (Urgente)</option>
                                    <option value="aprovada">Aprovadas / Agendadas</option>
                                    <option value="em curso">Em Curso</option>
                                    <option value="todos">Todos os Estados</option>
                                    <option value="finalizada">Finalizadas</option>
                                    <option value="cancelada">Canceladas</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="gestao-grid">
                    {loading ? (
                        <div className="loading-state"><Activity className="spin-animation" size={32}/><p>A carregar dados...</p></div>
                    ) : filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <div 
                                key={item.id_req || item.id_evento || item.id_hist || Math.random()} 
                                className="gestao-card" 
                                onClick={() => handleVerDetalhes(item)}
                                style={{ cursor: (tab === 'stock' || tab === 'historico_req') ? 'default' : 'pointer' }}
                            >
                                <div className="card-info">
                                    {tab === 'stock' ? (
                                        <>
                                            <strong><Package size={16} /> {item.item_nome}</strong>
                                            <p><User size={14} /> {item.nome_utilizador}</p>
                                            <p><Activity size={14} /> {item.tipo_movimento} ({item.quantidade_alt} un.)</p>
                                            <p style={{fontSize: '0.8em', color: '#888'}}>{formatarData(item.data_movimento)}</p>
                                        </>
                                    ) : tab === 'historico_req' ? (
                                        <>
                                            <strong><FileClock size={16} /> Req #{item.id_req} - {item.acao}</strong>
                                            <p><User size={14} /> Por: {item.nome_responsavel}</p>
                                            <p style={{fontStyle: 'italic', fontSize: '0.9em', color: '#555'}}>{item.detalhes}</p>
                                            <p style={{fontSize: '0.8em', color: '#888'}}>{formatarData(item.data_acao)}</p>
                                        </>
                                    ) : (
                                        <>
                                            <strong>{item.nome_evento || `Requisição #${item.id_req}`}</strong>
                                            <p>{item.requerente || item.localizacao}</p>
                                            <span className={`status-badge ${item.estado_nome?.toLowerCase().replace(' ', '-')}`}>
                                                {item.estado_nome}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-results">Nenhum resultado encontrado.</p>
                    )}
                </div>
            </main>

            {selectedItem && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content new-gestor-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{tab === 'eventos' ? `EVENTO #${selectedItem.id_evento}` : `REQUISIÇÃO #${selectedItem.id_req}`}</h3>
                            <button onClick={() => setSelectedItem(null)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body-scrollable">
                            <h2 className="modal-main-title">{selectedItem.nome_evento || `Requisição #${selectedItem.id_req}`}</h2>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="label">Requerente</span>
                                    <span className="value"><User size={14}/> {selectedItem.requerente || selectedItem.nome_utilizador}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Data</span>
                                    <span className="value">
                                        <Calendar size={14}/> 
                                            {selectedItem.data_inicio ? (
                                                <> {formatarData(selectedItem.data_inicio)} {selectedItem.data_fim && ` até ${formatarData(selectedItem.data_fim)}`} </>
                                            ) : (
                                                formatarData(selectedItem.data_pedido)
                                            )}
                                        </span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Estado Atual</span>
                                    <span className={`status-badge-large ${selectedItem.estado_nome?.toLowerCase().replace(' ', '-')}`}>
                                        {selectedItem.estado_nome}
                                    </span>
                                </div>
                                <div className="detail-item full-width">
                                    <span className="label">Localização</span>
                                    <span className="value">
                                        <MapPin size={14}/> 
                                            {selectedItem.localizacao || 'N/A'}
                                            {selectedItem.localizacao && (
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItem.localizacao)}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="map-link"
                                                    style={{marginLeft: '15px'}}
                                                >
                                                    VER NO MAPA
                                                </a>
                                            )}
                                    </span>
                                </div>
                            </div>

                            {tab === 'requisicoes' && materiais.length > 0 && (
                                <div className="section-block">
                                    <h4><Package size={16}/> LISTA DE MATERIAIS</h4>
                                    <div className="materials-list-gestor">
                                        {materiais.map((m, i) => (
                                            <div key={i} className="material-item-row">
                                                <div className="mat-info">
                                                    <span className="mat-name">{m.nome}</span>
                                                    <span className="mat-qty">{m.quantidade} un.</span>
                                                </div>
                                                <span className={`item-status-tag ${m.status_item?.toLowerCase() || 'aprovado'}`}>
                                                    {m.status_item || 'APROVADO'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tab === 'eventos' && anexos.length > 0 && (
                                <div className="section-block">
                                    <h4><FileText size={16}/> ANEXOS DO EVENTO</h4>
                                    <div className="anexos-grid">
                                        {anexos.map((file, i) => (
                                            <a key={i} href={`http://localhost:3002/uploads/${file.url}`} target="_blank" rel="noreferrer" className="anexo-link">
                                                <Download size={14} /> {file.nome_original || 'Documento'}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer-actions">
                            {tab === 'requisicoes' && (
                                <button onClick={handleEditarComoGestor} className="btn-action-outline" style={{borderColor: '#3b82f6', color:'#3b82f6'}}><Edit size={16}/> EDITAR</button>
                            )}
                            {selectedItem.estado_nome?.toLowerCase() === 'pendente' && (
                                <><button onClick={() => executarAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-action-outline danger">REJEITAR</button>
                                <button onClick={() => executarAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-action-solid success">APROVAR</button></>
                            )}
                            {tab === 'requisicoes' && selectedItem.estado_nome?.toLowerCase().includes('em curso') && (
                                <button onClick={() => prepararAcao(selectedItem.id_req, 5)} className="btn-action-solid success"><RotateCcw size={16}/> DEVOLVER</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <footer className="fixed-footer-esp">
                <div className="footer-items-wrapper">
                    <span className="footer-project-esp">Gestão de Ativos - Município de Esposende</span>
                </div>
            </footer>
        </div>
    );
};

export default GestorDashboard;