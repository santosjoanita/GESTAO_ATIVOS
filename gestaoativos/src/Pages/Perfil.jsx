import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft, Package, RotateCcw, XCircle, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Perfil.css'; 
import logo from '../assets/img/esposende.png'; 
import Toast from '../components/Toast';
import ModalConfirmacao from '../components/ModalConfirmacao';

const formatDate = (dateString) => {
    if (!dateString) return '--/--/----';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Data Inválida';
    return date.toLocaleDateString('pt-PT');
};

const EventCard = ({ event, isExpanded, onToggle, onEditarClick, onDevolverClick, onCancelarClick, isRequisicao, materiais }) => {
    if (!event) return null;
    const estado = event.id_estado_req;

    const podeEditar = isRequisicao && (estado === 2 || estado === 4);
    const podeDevolver = isRequisicao && estado === 4;
    const podeCancelar = isRequisicao && estado === 1;

    return (
        <div className={`event-card ${event.colorClass} ${isExpanded ? 'expanded' : ''}`}>
            <div className="event-header-row" onClick={onToggle}>
                <div>
                    <p className="event-title">{event.title} <span className="status-tag">({event.status})</span></p>
                    {!isRequisicao && <p className="event-date">Data: {event.date}</p>}
                    {isRequisicao && event.data_fim && (
                         <p className="event-date" style={{fontSize: '0.8em', color: '#666'}}>Válido até: {formatDate(event.data_fim)}</p>
                    )}
                </div>
                
                <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    {podeEditar && (
                        <button className="edit-button-esp btn-pendente" onClick={() => onEditarClick(event)}>
                            <Briefcase size={14} style={{marginRight: '5px'}}/> EDITAR
                        </button>
                    )}

                    {podeCancelar && (
                        <button className="edit-button-esp btn-cancelar" onClick={() => onCancelarClick(event.id_orig)}>
                            <XCircle size={14} />
                        </button>
                    )}

                    {podeDevolver && (
                        <button className="edit-button-esp btn-devolver" onClick={() => onDevolverClick(event.id_orig)}>
                            <RotateCcw size={14} style={{marginRight: '5px'}} /> DEVOLVER
                        </button>
                    )}

                    <div className="event-arrow-container">{isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </div>
            </div>
            
            {isExpanded && (
                <div className="event-details">
                    <div className="details-info-grid">
                        <p><strong>Local:</strong> {event.localizacao || 'N/A'}</p>
                        
                        {isRequisicao && (
                            <div className="materiais-container-perfil" style={{marginTop:'15px'}}>
                                <p style={{fontWeight:'800',fontSize:'13px',color:'#1f3a52', marginBottom:'10px'}}>
                                    <Package size={16} style={{verticalAlign:'middle'}}/> MATERIAIS:
                                </p>
                                {materiais?.length > 0 ? (
                                    <ul style={{listStyle:'none', padding:0}}>
                                        {materiais.map((m, idx) => (
                                            <li key={idx} style={{fontSize:'13px', borderBottom:'1px solid #eee', padding:'8px 0', display:'flex', justifyContent:'space-between'}}>
                                                <span>• {m.nome} — <strong>{m.quantidade} un.</strong></span>
                                                <span className="status-item-badge">{m.status_item || 'APROVADO'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p style={{fontSize:'12px',color:'#777'}}>Sem materiais listados.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Perfil = () => {
    const navigate = useNavigate();
    const [eventsList, setEventsList] = useState([]);
    const [requisicoesList, setRequisicoesList] = useState([]);
    const [activeTab, setActiveTab] = useState('requisições'); 
    const [expandedCardId, setExpandedCardId] = useState(null); 
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [materiaisCard, setMateriaisCard] = useState([]);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: null, id: null });

    const user = JSON.parse(localStorage.getItem('user'));

    const getAuthHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`
    }), [user]);

    const fetchPerfilData = useCallback(async () => {
        if (!user) return;
        try {
            const [resReq, resEv] = await Promise.all([
                fetch(`http://localhost:3002/api/requisicoes/user/${user.id_user}`, { headers: getAuthHeaders() }),
                fetch(`http://localhost:3002/api/eventos/user/${user.id_user}`, { headers: getAuthHeaders() })
            ]);
            const dataReq = await resReq.json();
            const dataEv = await resEv.json();

            setRequisicoesList(dataReq.map(r => ({
                id: `req-${r.id_req}`, id_orig: r.id_req, isRequisicao: true,
                title: r.nome_evento || 'Requisição', status: r.estado_nome,
                id_estado_req: r.id_estado_req, localizacao: r.localizacao,
                data_fim: r.data_fim, colorClass: r.estado_nome?.toLowerCase().replace(' ', '-')
            })));

            setEventsList(dataEv.map(e => ({
                id: `ev-${e.id_evento}`, isRequisicao: false,
                title: e.nome_evento, date: `${formatDate(e.data_inicio)} até ${formatDate(e.data_fim)}`,
                status: e.estado_nome, localizacao: e.localizacao, colorClass: e.estado_nome?.toLowerCase()
            })));
        } catch (error) { console.error(error); }
    }, [user, getAuthHeaders]);

    useEffect(() => { fetchPerfilData(); }, [fetchPerfilData]);

    const handleToggle = async (item) => {
        if (expandedCardId === item.id) {
            setExpandedCardId(null);
            setMateriaisCard([]);
        } else {
            setExpandedCardId(item.id);
            if (item.isRequisicao) {
                const res = await fetch(`http://localhost:3002/api/requisicoes/${item.id_orig}/materiais`, { headers: getAuthHeaders() });
                if (res.ok) setMateriaisCard(await res.json());
            }
        }
    };

    const confirmDevolver = (id) => setModal({ isOpen: true, type: 'devolver', id });
    const confirmCancelar = (id) => setModal({ isOpen: true, type: 'cancelar', id });

    const executeAcao = async () => {
        const url = `http://localhost:3002/api/requisicoes/${modal.id}/${modal.type}`;
        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id_user: user.id_user })
            });
            if(res.ok) {
                setToast({ type: 'success', message: 'Operação concluída com sucesso!' });
                fetchPerfilData();
            }
        } catch (e) { console.error(e); }
        setModal({ isOpen: false, type: null, id: null });
    };

    const handleEditar = (item) => {
        localStorage.setItem('evento_trabalho', JSON.stringify({id_req: item.id_orig, nome: item.title}));
        navigate('/explorar');
    };

    const displayItems = (() => {
        const list = activeTab === 'eventos' ? eventsList : requisicoesList;
        if (filtroEstado === 'todos') return list;
        return list.filter(item => {
            const s = (item.status || '').toLowerCase();
            if (filtroEstado === 'aprovada') return s.includes('aprov') || s.includes('agend');
            return s.includes(filtroEstado);
        });
    })();

    const filtrosSimples = ['todos', 'pendente', 'aprovada', 'em curso', 'finalizada', 'cancelada', 'rejeitada'];

    return (
        <div className="perfil-page-app">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <ModalConfirmacao 
                isOpen={modal.isOpen} 
                onConfirm={executeAcao} 
                onCancel={() => setModal({isOpen:false})} 
                title={modal.type === 'cancelar' ? "Anular Requisição" : "Devolver Materiais"} 
                message="Deseja prosseguir com esta ação?" 
            />
            
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp">INÍCIO</Link>
                    </nav>
                    <div className="header-icons-esp">
                        <Link to="/carrinho"><ShoppingCart size={24} className="icon-esp" /></Link>
                        <User size={24} className="icon-esp active-icon-indicator" />
                        <button onClick={() => {localStorage.clear(); navigate('/')}} className="logout-btn"><CornerDownLeft size={24} className="icon-esp" /></button>
                    </div>
                </div>
            </header>

            <main className="main-content-esp">
                <div className="user-panel-esp">
                    <div className="user-avatar-esp"></div>
                    <div>
                        <h2 className="user-title-esp">Olá, {user?.nome}.</h2>
                        <p className="user-email-esp">{user?.email}</p>
                    </div>
                </div>

                <div className="tabs-container-esp">
                    {['requisições', 'eventos'].map(t => (
                        <button 
                            key={t} 
                            className={`tab-button-esp ${activeTab === t ? 'active-tab-indicator' : ''}`} 
                            onClick={() => { setActiveTab(t); setFiltroEstado('todos'); }}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="status-filter-bar-esp">
                    {filtrosSimples.map(f => (
                        <button 
                            key={f} 
                            className={`status-filter-btn ${filtroEstado === f ? 'active-status' : ''}`} 
                            onClick={() => setFiltroEstado(f)}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="list-items-container-esp">
                    {displayItems.length > 0 ? displayItems.map(item => (
                        <EventCard key={item.id} event={item} isRequisicao={item.isRequisicao} isExpanded={expandedCardId === item.id} materiais={materiaisCard}
                            onToggle={() => handleToggle(item)}
                            onDevolverClick={confirmDevolver} 
                            onCancelarClick={confirmCancelar}
                            onEditarClick={handleEditar} 
                        />
                    )) : <p className="no-items-msg">Nenhum item encontrado.</p>}
                </div>
            </main>
        </div>
    );
};

export default Perfil;