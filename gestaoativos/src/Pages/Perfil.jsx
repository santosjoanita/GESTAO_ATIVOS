import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle,ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft, Package, RotateCcw, XCircle, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Perfil.css'; 
import logo from '../assets/img/esposende.png'; 
import Toast from '../components/Toast';
import ModalConfirmacao from '../components/ModalConfirmacao';

const formatDate = (dateString) => {
    if (!dateString) return '--/--/----';
    const date = new Date(dateString);
    if (isNaN(date)) return '---';
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
                    <p className="event-date">
                        {isRequisicao && event.data_fim 
                            ? `Duração: ${formatDate(event.data_inicio)} até ${formatDate(event.data_fim)}` 
                            : `Data: ${event.date}`}
                    </p>
                </div>
                
                <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    {podeEditar && (
                        <button className="edit-button-esp btn-pendente" onClick={() => onEditarClick(event)} title="Adicionar mais materiais">
                            <Briefcase size={14} style={{marginRight: '5px'}}/> EDITAR
                        </button>
                    )}
                    {podeCancelar && (
                        <button className="edit-button-esp btn-cancelar" onClick={() => onCancelarClick(event.id_orig)} style={{backgroundColor:'#e74c3c'}}>
                            <XCircle size={14} />
                        </button>
                    )}
                    {podeDevolver && (
                        <button className="edit-button-esp btn-devolver" onClick={() => onDevolverClick(event.id_orig)} style={{backgroundColor:'#27ae60', color:'white', borderColor:'#219150'}}>
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
                                <p style={{fontWeight:'800',fontSize:'13px',color:'var(--primary-blue)', marginBottom:'10px'}}>
                                    <Package size={16} style={{verticalAlign:'middle'}}/> LISTA DE MATERIAIS:
                                </p>
                                {materiais?.length > 0 ? (
                                    <ul style={{listStyle:'none', padding:0}}>
                                        {materiais.map((m, idx) => (
                                            <li key={idx} style={{fontSize:'13px', borderBottom:'1px solid #eee', padding:'8px 0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                <span>• {m.nome} — <strong>{m.quantidade} un.</strong></span>
                                                <span style={{fontSize:'10px', fontWeight:'800', textTransform:'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: m.status_item === 'pendente' ? '#fef3c7' : '#dcfce7', color: m.status_item === 'pendente' ? '#d97706' : '#166534'}}>
                                                    {m.status_item || 'APROVADO'}
                                                </span>
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
    const [activeTab, setActiveTab] = useState('todos'); 
    const [expandedCardId, setExpandedCardId] = useState(null); 
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [materiaisCard, setMateriaisCard] = useState([]);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: null, id: null });

    const user = JSON.parse(localStorage.getItem('user'));
    const isGestor = user?.id_perfil === 2;
    const eventoAtivo = JSON.parse(localStorage.getItem('evento_trabalho'));

    const getAuthHeaders = useCallback(() => {
        return { 'Content-Type': 'application/json', 'Authorization': user?.token ? `Bearer ${user.token}` : '' };
    }, [user]);

    const fetchPerfilData = useCallback(async () => {
        if (!user) { navigate('/'); return; }
        try {
            const [resReq, resEv] = await Promise.all([
                fetch(`http://localhost:3002/api/requisicoes/user/${user.id_user || user.id}`, { headers: getAuthHeaders() }),
                fetch(`http://localhost:3002/api/eventos/user/${user.id_user || user.id}`, { headers: getAuthHeaders() })
            ]);
            const dataReq = await resReq.json();
            const dataEv = await resEv.json();

            const getStatusColor = (s) => {
                const st = (s || '').toLowerCase();
                if (st.includes('aprov') || st.includes('agend')) return 'aprovado';
                if (st.includes('em curso')) return 'em-curso';
                if (st.includes('final') || st.includes('concl')) return 'finalizado';
                if (st.includes('cancel')) return 'cancelada';
                if (st.includes('rejeit') || st.includes('recus')) return 'rejeitado';
                return 'pendente';
            };

            setRequisicoesList(Array.isArray(dataReq) ? dataReq.map(r => ({
                id: `req-${r.id_req}`, id_orig: r.id_req, isRequisicao: true,
                title: r.nome_evento, status: r.estado_nome, id_estado_req: r.id_estado_req,
                localizacao: r.localizacao, data_inicio: r.data_inicio, data_fim: r.data_fim,
                colorClass: getStatusColor(r.estado_nome)
            })) : []);

            setEventsList(Array.isArray(dataEv) ? dataEv.map(e => ({
                id: `ev-${e.id_evento}`, isRequisicao: false,
                title: e.nome_evento, date: `${formatDate(e.data_inicio)} até ${formatDate(e.data_fim)}`,
                status: e.estado_nome, localizacao: e.localizacao,
                colorClass: getStatusColor(e.estado_nome)
            })) : []);
        } catch (error) { console.error(error); }
    }, [navigate, getAuthHeaders, user]);

    useEffect(() => { fetchPerfilData(); }, [fetchPerfilData]);

    const fetchMateriaisReq = async (idReq) => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${idReq}/materiais`, { headers: getAuthHeaders() });
            if (res.ok) setMateriaisCard(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleToggle = (item) => {
        if (expandedCardId === item.id) { setExpandedCardId(null); setMateriaisCard([]); }
        else { setExpandedCardId(item.id); if (item.isRequisicao) fetchMateriaisReq(item.id_orig); }
    };

    const displayItems = (() => {
        let list = activeTab === 'eventos' ? eventsList : activeTab === 'requisições' ? requisicoesList : [...eventsList, ...requisicoesList];
        if (filtroEstado !== 'todos') {
            list = list.filter(item => {
                const s = (item.status || '').toLowerCase();
                if (filtroEstado === 'aprovada') return s.includes('aprov') || s.includes('agend');
                if (filtroEstado === 'cancelada') return s.includes('cancel');
                if (filtroEstado === 'rejeitada') return s.includes('rejeit') || s.includes('recus');
                return s.includes(filtroEstado);
            });
        }
        return list;
    })();

    const executeCancelar = async () => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${modal.id}/cancelar`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id_user: user.id_user })
            });
            if(res.ok) { setToast({ type: 'success', message: "Cancelado com sucesso." }); fetchPerfilData(); }
        } catch (e) { setToast({ type: 'error', message: "Erro conexão" }); }
        setModal({ isOpen: false, type: null, id: null });
    };

    const executeDevolver = async () => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${modal.id}/devolver`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id_user: user.id_user })
            });
            if (res.ok) { setToast({ type: 'success', message: "Devolvido com sucesso!" }); fetchPerfilData(); }
        } catch (e) { setToast({ type: 'error', message: "Erro conexão" }); }
        setModal({ isOpen: false, type: null, id: null });
    };

    const confirmCancelar = (id) => setModal({ isOpen: true, type: 'cancelar', id });
    const confirmDevolver = (id) => setModal({ isOpen: true, type: 'devolver', id });
    const handleEditar = (item) => {
        localStorage.setItem('evento_trabalho', JSON.stringify({ id_req: item.id_orig, nome: item.title }));
        navigate('/explorar');
    };

    return (
        <div className="perfil-page-app">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <ModalConfirmacao 
                isOpen={modal.isOpen} 
                onCancel={() => setModal({ isOpen: false })} 
                onConfirm={modal.type === 'cancelar' ? executeCancelar : executeDevolver} 
                title={modal.type === 'cancelar' ? "Cancelar Requisição" : "Devolver Materiais"} 
                message="Deseja prosseguir?" 
                confirmText="Confirmar" 
                confirmColor={modal.type === 'cancelar' ? "#e74c3c" : "#27ae60"} 
            />

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        {isGestor ? <Link to="/gestao" className="nav-item-esp">GESTÃO</Link> : <Link to="/home" className="nav-item-esp">INÍCIO</Link>}
                    </nav>
                    <div className="header-icons-esp">
                        <div className="user-profile-badge" style={{ marginRight: '15px', textAlign: 'right' }}>
                            <span style={{ color: 'white', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                                {user?.nome?.split(' ')[0]}
                            </span>
                            <span style={{ color: '#3498db', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>
                                {isGestor ? 'GESTOR' : 'FUNCIONÁRIO'}
                            </span>
                        </div>

                        <Link to="/carrinho">
                            <ShoppingCart size={24} className="icon-esp" />
                        </Link>
                        
                        <Link to="/perfil">
                            <User size={24} className="icon-esp active-icon-indicator" />
                        </Link>

                        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
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

                <div className="filters-header-wrapper" style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <h3 className="section-title-perfil" style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                        OS MEUS PEDIDOS
                    </h3>
                    <div className="tooltip-container">
                        <HelpCircle size={20} className="help-icon-perfil" />
                        <div className="tooltip-popup">
                            <h4>Legenda de Estados:</h4>
                            <ul>
                                <li><span className="dot pendente"></span> <strong>Pendente:</strong> Aguarda validação do gestor.</li>
                                <li><span className="dot aprovada"></span> <strong>Aprovada:</strong> Pedido aceite, aguarda levantamento.</li>
                                <li><span className="dot em-curso"></span> <strong>Em Curso:</strong> O material está consigo.</li>
                                <li><span className="dot finalizada"></span> <strong>Finalizada:</strong> Material devolvido e conferido.</li>
                                <li><span className="dot cancelada"></span> <strong>Cancelada:</strong> Pedido anulado ou rejeitado.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="tabs-container-esp">
                    {['todos', 'eventos', 'requisições'].map(t => (
                        <button 
                            key={t} 
                            className={`tab-button-esp ${activeTab === t ? 'active-tab-indicator' : ''}`} 
                            onClick={() => setActiveTab(t)}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="status-filter-bar-esp">
                    {['todos', 'pendente', 'aprovada', 'em curso', 'finalizada', 'cancelada', 'rejeitada'].map(f => (
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
                    {displayItems.length > 0 ? (
                        displayItems.map(item => (
                            <EventCard 
                                key={item.id} 
                                event={item} 
                                isRequisicao={item.isRequisicao} 
                                isExpanded={expandedCardId === item.id} 
                                materiais={materiaisCard} 
                                onToggle={() => handleToggle(item)} 
                                onDevolverClick={confirmDevolver} 
                                onCancelarClick={confirmCancelar} 
                                onEditarClick={handleEditar} 
                            />
                        ))
                    ) : (
                        <div className="no-items-msg">Nenhum registo encontrado para os filtros selecionados.</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Perfil;