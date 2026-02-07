import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    CornerDownLeft, User, X, Calendar, Download, Package, Activity, 
    Filter, MapPin, CheckCircle, XCircle, Truck, RotateCcw, 
    FileClock, Ban, FileText, ShoppingCart, Edit, MessageSquare
} from 'lucide-react';
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

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token || ''}`
    });

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

            const dadosNormalizados = (Array.isArray(data) ? data : []).map(item => ({
                ...item,
                estado_texto_calc: (item.nome_estado || item.estado_nome || item.estado || 'Pendente').toLowerCase()
            }));

            setItems(dadosNormalizados);
        } catch (error) { 
            console.error("Erro ao carregar:", error);
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
        setModal({ isOpen: true, action: 'confirmar_acao', id, novoEstado: id_estado_novo });
    };

    const executarAcao = async (id = modal.id, id_estado_novo = modal.novoEstado) => {
    let url = '';
    
    const body = { id_estado: id_estado_novo };

    if (tab === 'requisicoes') {
        if (id_estado_novo === 5) {
            url = `http://localhost:3002/api/requisicoes/${id}/devolver`;
            body.id_user = user.id_user; 
        } 
        else if (id_estado_novo === 6) {
            url = `http://localhost:3002/api/requisicoes/${id}/cancelar`;
            body.id_user = user.id_user;
        } 
        else {
            url = `http://localhost:3002/api/requisicoes/${id}/estado`;
        }
    } else {
        url = `http://localhost:3002/api/eventos/${id}/estado`;
    }

    try {
        const res = await fetch(url, {
            method: 'PUT', 
            headers: getAuthHeaders(), 
            body: JSON.stringify(body) 
        });

        if (res.ok) {
            setToast({ type: 'success', message: "Operação realizada com sucesso!" });
            setSelectedItem(null);
            loadData(); 
        } else {
            const err = await res.json();
            setToast({ type: 'error', message: err.message || "Erro no servidor." });
        }
    } catch (err) { 
        setToast({ type: 'error', message: "Erro de conexão." }); 
    }
    setModal({ isOpen: false, action: null, id: null, novoEstado: null });
};
    const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        (item.nome_evento || '').toLowerCase().includes(searchLower) || 
        (item.id_req?.toString().includes(searchLower)) ||
        (item.id_evento?.toString().includes(searchLower));

    if (tab === 'stock' || tab === 'historico_req') return matchesSearch;

    const filtro = statusFilter.toLowerCase();
    if (filtro === 'todos') return matchesSearch;

    let matchesStatus = false;

    if (tab === 'requisicoes') {
        const id = parseInt(item.id_estado_req || 1);
        if (filtro === 'pendente') matchesStatus = (id === 1);
        else if (filtro === 'aprovada') matchesStatus = (id === 2);
        else if (filtro === 'em curso') matchesStatus = (id === 4); 
        else if (filtro === 'finalizada') matchesStatus = (id === 5);
        else if (filtro === 'cancelada') matchesStatus = (id === 3 || id === 6);
    } 
    else if (tab === 'eventos') {
        const id = parseInt(item.id_estado || 1);
        if (filtro === 'pendente') matchesStatus = (id === 1);
        else if (filtro === 'aprovada') matchesStatus = (id === 2);
        else if (filtro === 'finalizada') matchesStatus = (id === 4); 
        else if (filtro === 'cancelada') matchesStatus = (id === 3 || id === 5);
    }

    return matchesSearch && matchesStatus;
});

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="gestao-layout">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ModalConfirmacao isOpen={modal.isOpen} title="Confirmação" message="Deseja confirmar esta alteração de estado?" confirmText="Confirmar" onConfirm={() => executarAcao()} onCancel={() => setModal({ isOpen: false })} />

            <header className="fixed-header-esp">
                <div className="header-content-esp">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor: 'pointer'}} />
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <button onClick={() => setTab('requisicoes')} className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>EVENTOS</button>
                        <button onClick={() => setTab('historico_req')} className={`nav-item-esp ${tab === 'historico_req' ? 'active-tab-indicator' : ''}`}>HISTÓRICO REQ.</button>
                        <button onClick={() => setTab('stock')} className={`nav-item-esp ${tab === 'stock' ? 'active-tab-indicator' : ''}`}>HISTÓRICO STOCK</button>
                        <button onClick={() => navigate('/stock')} className='nav-item-esp'> STOCK ATUAL </button>  
                        </nav>
                    <div className="header-icons-esp">
                        <div className="user-profile-badge" style={{ marginRight: '15px', textAlign: 'right' }}>
                            <span style={{ color: 'white', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>{user?.nome?.split(' ')[0]}</span>
                            <span style={{ color: '#3498db', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>GESTOR</span>
                        </div>
                        <Link to="/carrinho" className="position-relative">
                        <ShoppingCart size={24} className="icon-esp" />
                        {carrinhoCount > 0 && <span className="cart-badge">{carrinhoCount}</span>}
                    </Link>
                        <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
                        <button onClick={handleLogout} className="icon-esp"><CornerDownLeft size={24} /></button>
                    </div>
                </div>
            </header>

            <main className="gestao-main">
                <div className="page-header-container">
                    <h2 className="gestao-title">{tab === 'requisicoes' ? 'GERIR REQUISIÇÕES' : tab === 'eventos' ? 'GERIR EVENTOS' : 'AUDITORIA'}</h2>
                    <div className="filters-container">
                        <div className="search-input-wrapper">
                            <input type="text" placeholder="Procurar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {tab !== 'stock' && tab !== 'historico_req' && (
                            <div className="filter-select-wrapper">
                                <Filter size={20} className="filter-icon" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-select-filter">
                                    <option value="pendente">Pendentes</option>
                                    <option value="aprovada">Aprovadas / Agendadas</option>
                                    <option value="em curso">Em Curso</option>
                                    <option value="todos">Todos os Estados</option>
                                    <option value="finalizada">Finalizadas</option>
                                    <option value="cancelada">Canceladas/Recusadas</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="gestao-grid">
            {loading ? (
                <div className="loading-state">
                    <Activity className="spin-animation" size={32} />
                </div>
            ) : filteredItems.map((item) => (
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
                                <p><Activity size={14} /> {item.tipo_movimento} ({item.quantidade_alt} un.)</p>
                                <p style={{ fontSize: '0.8em', color: '#888' }}>{formatarData(item.data_movimento)}</p>
                            </>
                         ) : tab === 'historico_req' ? (
                            <div className="hist-card-content">
                                <div className="hist-card-top">
                                    <strong><FileClock size={16} /> Requisição #{item.id_req}</strong>
                                    <span className="hist-data-text">{formatarData(item.data_acao)}</span>
                                </div>
                                
                                <div className="hist-card-info">
                                    <p><User size={14} /> <span>Requerente:</span> {item.nome_responsavel || 'N/A'}</p>
                                    <p><Activity size={14} /> <span>Ação:</span> {item.acao}</p>
                                    <p><MessageSquare size={14} /> <span>Observações:</span> {item.detalhes || 'Nenhuma observação'}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <strong>{item.nome_evento || `Requisição #${item.id_req}`}</strong>
                                <p>{item.requerente || item.localizacao || 'Local não definido'}</p>
                                <span className={`status-badge-gestor ${(item.estado_nome || 'pendente').toLowerCase().replace(/\s+/g, '-')}`}>
                                    {(item.estado_nome || 'PENDENTE').toUpperCase()}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            ))}
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
                                    <span className="label">Estado Atual</span>
                                    <span className={`status-badge-large ${(selectedItem.nome_estado || selectedItem.estado_nome || 'pendente').toLowerCase().replace(/\s+/g, '-')}`}>
                                        {selectedItem.nome_estado || selectedItem.estado_nome || 'PENDENTE'}
                                    </span>
                                </div>
                                <div className="detail-item full-width">
                                    <span className="label">Localização</span>
                                    <span className="value"><MapPin size={14}/> {selectedItem.localizacao || 'N/A'} 
                                        {selectedItem.localizacao && (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItem.localizacao)}`} target="_blank" rel="noreferrer" className="map-link" style={{marginLeft: '15px'}}>VER NO MAPA</a>
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
                                                <span className="mat-name">{m.nome}</span>
                                                <span className="mat-qty">{m.quantidade} un.</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tab === 'eventos' && anexos.length > 0 && (
                                <div className="section-block">
                                    <h4><FileText size={16}/> ANEXOS</h4>
                                    <div className="anexos-grid">
                                        {anexos.map((file, i) => (
                                            <a key={i} href={`http://localhost:3002/uploads/${file.nome_oculto}`} download className="anexo-link"><Download size={14} /> {file.nome}</a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer-actions">
                            {tab === 'requisicoes' && <button onClick={handleEditarComoGestor} className="btn-action-outline" style={{borderColor: '#3b82f6', color:'#3b82f6'}}><Edit size={16}/> EDITAR</button>}
                            
                            {parseInt(selectedItem.id_estado || selectedItem.id_estado_req) === 1 && (
                                <>
                                    <button onClick={() => executarAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-action-outline danger">REJEITAR</button>
                                    <button onClick={() => executarAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-action-solid success">APROVAR</button>
                                </>
                            )}
                            {parseInt(selectedItem.id_estado || selectedItem.id_estado_req) === 2 && (
                                <button onClick={() => prepararAcao(selectedItem.id_req || selectedItem.id_evento, 5)} className="btn-action-outline danger"><Ban size={16}/> CANCELAR</button>
                            )}
                            {tab === 'requisicoes' && parseInt(selectedItem.id_estado_req) === 6 && (
                                <button onClick={() => prepararAcao(selectedItem.id_req, 4)} className="btn-action-solid success"><RotateCcw size={16}/> DEVOLVER</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <footer className="fixed-footer-esp">
                <span className="footer-project-esp">Gestão de Ativos - Município de Esposende</span>
            </footer>
        </div>
    );
};

export default GestorDashboard;