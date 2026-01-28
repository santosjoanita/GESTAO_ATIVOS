import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CornerDownLeft, User, X, Calendar, Download, Package, Activity, Search, Filter, MapPin, CheckCircle, XCircle, Truck, RotateCcw, FileClock, Ban, FileText } from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';
import Toast from '../../components/Toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';

const GestorDashboard = () => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes'); 
    const [selectedItem, setSelectedItem] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const [materiais, setMateriais] = useState([]); 
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');

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
        // CORREÇÃO: URLs corretos para cada tab
        if (tab === 'requisicoes') url = 'http://localhost:3002/api/requisicoes/todas';
        else if (tab === 'eventos') url = 'http://localhost:3002/api/eventos/todos';
        else if (tab === 'stock') url = 'http://localhost:3002/api/gestao/stock/historico';
        else if (tab === 'historico_req') url = 'http://localhost:3002/api/requisicoes/historico'; // Confirma se esta rota existe no backend!
        
        try {
            const res = await fetch(url, { headers: getAuthHeaders() });
            
            if (res.status === 401) {
                localStorage.clear();
                navigate('/');
                return;
            }

            if (!res.ok) throw new Error("Falha ao carregar dados");

            const data = await res.json();
            console.log(`Dados carregados para ${tab}:`, data); // Debug para veres se chegam dados
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { 
            console.error("Erro ao carregar:", error);
            setToast({ type: 'error', message: "Erro de conexão ao carregar dados." });
            setItems([]);
        }
    };

    const handleVerDetalhes = async (item) => {
        if (tab === 'stock' || tab === 'historico_req') return; // Histórico não tem modal de detalhes
        
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

    const prepararAcao = (id, id_estado_novo) => {
        // CORREÇÃO: Garante que ID não é undefined
        if (!id) {
            setToast({ type: 'error', message: "Erro: ID do item inválido." });
            return;
        }
        
        // Abre modal de confirmação para ações críticas
        if (id_estado_novo === 5 || id_estado_novo === 6 || id_estado_novo === 3) {
            setModal({ isOpen: true, action: 'confirmar_acao', id, novoEstado: id_estado_novo });
        } else {
            // Aprovar (2) ou Marcar Levantamento (4) vai direto
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
                // Rota genérica para mudar estado (Aprovar/Rejeitar/Em Curso)
                url = `http://localhost:3002/api/requisicoes/${id}/estado`;
            }
        } else {
            // Para Eventos
            url = `http://localhost:3002/api/eventos/${id}/estado`;
        }

        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: getAuthHeaders(), 
                body: JSON.stringify(body) 
            });

            if (res.ok) {
                setToast({ type: 'success', message: "Ação realizada com sucesso!" });
                setSelectedItem(null); // Fecha o modal
                loadData(); // Recarrega a lista para ver o novo estado
            } else {
                const err = await res.json();
                setToast({ type: 'error', message: "Erro: " + (err.message || err.error || "Falha na operação") });
            }
        } catch (err) { 
            console.error(err); 
            setToast({ type: 'error', message: "Erro de conexão." }); 
        }
        
        setModal({ isOpen: false, action: null, id: null, novoEstado: null });
    };

    const getModalText = () => {
        const st = modal.novoEstado;
        if (st === 5) return { title: "Finalizar & Devolver", msg: "Confirma a devolução dos materiais? O stock será reposto automaticamente.", color: "#2ecc71" };
        if (st === 6) return { title: "Cancelar Requisição", msg: "Tem a certeza? Se já houver stock reservado, ele será libertado.", color: "#e74c3c" };
        if (st === 3) return { title: "Rejeitar Pedido", msg: "Deseja rejeitar este pedido?", color: "#e74c3c" };
        return { title: "Confirmação", msg: "Prosseguir?", color: "#1f3a52" };
    };

    const modalContent = getModalText();

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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <ModalConfirmacao 
                isOpen={modal.isOpen}
                title={modalContent.title}
                message={modalContent.msg}
                confirmText="Confirmar"
                confirmColor={modalContent.color}
                onConfirm={() => executarAcao()}
                onCancel={() => setModal({ isOpen: false, action: null, id: null, novoEstado: null })}
            />

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
                            <CornerDownLeft size={24} className="icon-esp" />
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
                            <Search size={20} className="search-icon"/>
                            <input 
                                type="text" 
                                placeholder="Pesquisar por nome, ID ou requerente..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {tab !== 'stock' && tab !== 'historico_req' && (
                            <div className="filter-select-wrapper">
                                <Filter size={20} className="filter-icon"/>
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
                                    {tab === 'stock' ? (
                                        <>
                                            <strong><Package size={16} /> {item.item_nome}</strong>
                                            <p><User size={14} /> {item.nome_utilizador}</p>
                                            <p><Activity size={14} /> {item.tipo_movimento} ({item.quantidade_alt})</p>
                                            <p style={{fontSize:'0.8em', color:'#888'}}>{new Date(item.data_movimento).toLocaleString('pt-PT')}</p>
                                        </>
                                    ) : tab === 'historico_req' ? (
                                        <>
                                            <strong><FileClock size={16} /> Req #{item.id_req} - {item.acao}</strong>
                                            <p><User size={14} /> Por: {item.nome_responsavel}</p>
                                            <p style={{fontStyle:'italic', color:'#555', fontSize:'0.9em'}}>{item.detalhes}</p>
                                            <p style={{fontSize:'0.8em', color:'#888'}}><Calendar size={12}/> {new Date(item.data_acao).toLocaleString('pt-PT')}</p>
                                        </>
                                    ) : (
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

            {selectedItem && tab !== 'stock' && tab !== 'historico_req' && (
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
                                    <span className="value"><User size={14}/> {selectedItem.requerente}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Data de Início</span>
                                    <span className="value">
                                        <Calendar size={14}/> {selectedItem.data_inicio ? new Date(selectedItem.data_inicio).toLocaleDateString() : new Date(selectedItem.data_pedido).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Estado Atual</span>
                                    <span className={`status-badge-large ${selectedItem.estado_nome?.toLowerCase().replace(' ', '-')}`}>
                                        {selectedItem.estado_nome}
                                    </span>
                                </div>
                                {tab === 'eventos' && (
                                    <div className="detail-item full-width">
                                        <span className="label">Localização</span>
                                        <span className="value"><MapPin size={14}/> {selectedItem.localizacao || 'N/A'}</span>
                                    </div>
                                )}
                            </div>

                            {tab === 'eventos' && selectedItem.descricao && (
                                <div className="section-block">
                                    <h4><FileText size={16}/> DESCRIÇÃO</h4>
                                    <p className="description-text">{selectedItem.descricao}</p>
                                </div>
                            )}

                            {tab === 'eventos' && anexos.length > 0 && (
                                <div className="section-block">
                                    <h4>ANEXOS</h4>
                                    <ul className="attachments-list">
                                        {anexos.map(a => (
                                            <li key={a.id_anexo}>
                                                <a href={`http://localhost:3002/uploads/${a.caminho_ficheiro}`} target="_blank" rel="noreferrer">
                                                    <Download size={14}/> {a.nome_ficheiro}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {tab === 'requisicoes' && materiais.length > 0 && (
                                <div className="section-block">
                                    <h4><Package size={16}/> LISTA DE MATERIAIS</h4>
                                    <div className="materials-table-wrapper">
                                        <table className="materials-table-clean">
                                            <thead><tr><th>Item</th><th>Qtd</th></tr></thead>
                                            <tbody>
                                                {materiais.map((m, idx) => (
                                                    <tr key={idx}><td>{m.nome}</td><td><strong>{m.quantidade}</strong></td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOTÕES DE AÇÃO CORRIGIDOS */}
                        <div className="modal-footer-actions">
                            {selectedItem.estado_nome?.toLowerCase() === 'pendente' && (
                                <>
                                    {/* CORREÇÃO: Passa ID correto (id_req para requisições, id_evento para eventos) */}
                                    <button onClick={() => prepararAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-action-outline danger">REJEITAR</button>
                                    <button onClick={() => prepararAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-action-solid success">APROVAR PEDIDO</button>
                                </>
                            )}
                            
                            {tab === 'requisicoes' && (selectedItem.estado_nome?.toLowerCase().includes('aprov') || selectedItem.estado_nome?.toLowerCase().includes('agend')) && (
                                <>
                                    <button onClick={() => prepararAcao(selectedItem.id_req, 6)} className="btn-action-outline danger">CANCELAR</button>
                                    <button onClick={() => prepararAcao(selectedItem.id_req, 4)} className="btn-action-solid warning">
                                        <Truck size={16} style={{marginRight:5}}/> MARCAR LEVANTAMENTO
                                    </button>
                                </>
                            )}

                            {tab === 'requisicoes' && selectedItem.estado_nome?.toLowerCase().includes('em curso') && (
                                <button onClick={() => prepararAcao(selectedItem.id_req, 5)} className="btn-action-solid success full-width">
                                    <RotateCcw size={16} style={{marginRight:5}}/> FINALIZAR (DEVOLVER STOCK)
                                </button>
                            )}
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