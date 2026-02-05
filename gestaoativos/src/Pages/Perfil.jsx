import React, { useState, useEffect, useCallback } from 'react';
import { 
    HelpCircle, ChevronDown, ChevronUp, ChevronRight, ShoppingCart, 
    User, CornerDownLeft, Package, RotateCcw, XCircle, Briefcase, 
    Download, ShieldAlert, ShieldCheck 
} from 'lucide-react';
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
                    <p className="event-title">{event.title}</p>
                    <p className="event-date">
                        {isRequisicao ? `Estado: ${event.status}` : `Data: ${event.date}`}
                    </p>
                </div>
                
                <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    {podeEditar && (
                        <button className="edit-button-esp btn-pendente" onClick={() => onEditarClick(event)}>
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
                    {isRequisicao ? (
                        <div className="materiais-container-perfil">
                            <p style={{ fontWeight: '800', fontSize: '13px', color: '#1f4e79', marginBottom: '10px' }}>
                                <Package size={16} style={{ verticalAlign: 'middle' }} /> LISTA DE MATERIAIS:
                            </p>
                            {materiais?.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {materiais.map((m, idx) => (
                                        <li key={idx} style={{ fontSize: '13px', borderBottom: '1px solid #eee', padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>• {m.nome} — <strong>{m.quantidade} un.</strong></span>
                                            <span className={`status-badge-material ${(m.status_item || 'aprovado').toLowerCase()}`}>
                                                {m.status_item || 'APROVADO'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p style={{ fontSize: '12px', color: '#777' }}>Sem materiais associados.</p>}
                        </div>
                    ) : (
                        <>
                            <div className="details-info-grid">
                                <p><strong>Local:</strong> {event.localizacao || 'N/A'}</p>
                                <p><strong>Início:</strong> {formatDate(event.data_inicio)}</p>
                                <p><strong>Fim:</strong> {formatDate(event.data_fim)}</p>
                            </div>

                            <div className="anexos-container-perfil" style={{ marginTop: '20px' }}>
                                <p style={{ fontWeight: '800', fontSize: '13px', color: '#1f4e79', marginBottom: '10px' }}>
                                    DOCUMENTOS ANEXADOS:
                                </p>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {event.anexos && event.anexos.length > 0 ? (
                                        event.anexos.map((file, idx) => (
                                            <a 
                                                key={idx} 
                                                href={`http://localhost:3002/uploads/${file.nome_oculto}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                download={file.nome}
                                                style={{ fontSize: '12px', color: '#3498db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', background: '#f0f7ff', padding: '5px 10px', borderRadius: '5px', border: '1px solid #d0e7ff' }}
                                            >
                                                <Download size={14} /> {file.nome}
                                            </a>
                                        ))
                                    ) : <p style={{ fontSize: '12px', color: '#777' }}>Sem documentos disponíveis.</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const Perfil = () => {
    const navigate = useNavigate();
    const [eventsList, setEventsList] = useState([]);
    const [requisicoesList, setRequisicoesList] = useState([]);
    const [activeTab, setActiveTab] = useState('eventos');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [materiaisCard, setMateriaisCard] = useState([]);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: null, id: null });
    const [expandedCardId, setExpandedCardId] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.id_perfil === 1;
    const isGestor = user?.id_perfil === 2;
    const isConvidado = user?.id_perfil === 4;
    
    const isReadOnly = isAdmin || isConvidado;

    const getAuthHeaders = useCallback(() => {
        return { 'Content-Type': 'application/json', 'Authorization': user?.token ? `Bearer ${user.token}` : '' };
    }, [user]);

    const fetchPerfilData = useCallback(async () => {
        if (!user) { navigate('/'); return; }
        if (isReadOnly) return;
        
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
                title: `${r.nome_evento} | Requisição #${r.id_req}`, status: r.estado_nome, id_estado_req: r.id_estado_req,
                localizacao: r.localizacao, data_inicio: r.data_inicio, data_fim: r.data_fim,
                colorClass: getStatusColor(r.estado_nome)
            })) : []);

            setEventsList(Array.isArray(dataEv) ? dataEv.map(e => ({
                id: `ev-${e.id_evento}`, 
                id_orig: e.id_evento,
                isRequisicao: false,
                title: e.nome_evento, 
                date: `${formatDate(e.data_inicio)} até ${formatDate(e.data_fim)}`,
                data_inicio: e.data_inicio, 
                data_fim: e.data_fim,
                localizacao: e.localizacao,
                status: e.estado_nome, 
                anexos: [], 
                colorClass: getStatusColor(e.estado_nome)
            })) : []);
        } catch (error) { console.error(error); }
    }, [navigate, getAuthHeaders, user, isReadOnly]);

    useEffect(() => { fetchPerfilData(); }, [fetchPerfilData]);

    const handleToggle = async (item) => {
        if (expandedCardId === item.id) { 
            setExpandedCardId(null); 
            setMateriaisCard([]); 
        } else { 
            setExpandedCardId(item.id); 
            if (item.isRequisicao) {
                const res = await fetch(`http://localhost:3002/api/requisicoes/${item.id_orig}/materiais`, { headers: getAuthHeaders() });
                const data = await res.json();
                setMateriaisCard(data);
            } else {
                const resAnexos = await fetch(`http://localhost:3002/api/eventos/${item.id_orig}/anexos`, { headers: getAuthHeaders() });
                const dataAnexos = await resAnexos.json();
                setEventsList(prev => prev.map(ev => 
                    ev.id_orig === item.id_orig ? { ...ev, anexos: dataAnexos } : ev
                ));
            }
        }
    };

    const displayItems = (() => {
        let list = activeTab.toLowerCase().includes('evento') ? eventsList : requisicoesList;
        if (filtroEstado !== 'todos') {
            list = list.filter(item => {
                const s = (item.status || '').toLowerCase(); 
                const f = filtroEstado.toLowerCase(); 
                if (f === 'aprovada' || f === 'agendado') return s.includes('aprov') || s.includes('agend');
                if (f === 'cancelada' || f === 'rejeitada') return s.includes('cancel') || s.includes('rejeit') || s.includes('recus');
                if (f === 'finalizada' || f === 'finalizado') return s.includes('final') || s.includes('concl');
                return s.includes(f);
            });
        }
        return list;
    })();

    const executeCancelar = async () => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${modal.id}/cancelar`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id_user: user.id_user })
            });
            if(res.ok) { 
                setToast({ type: 'success', message: "Requisição cancelada." }); 
                fetchPerfilData(); 
            } else {
                setToast({ type: 'error', message: "Não foi possível cancelar." });
            }
        } catch (e) { setToast({ type: 'error', message: "Erro de ligação." }); }
        setModal({ isOpen: false, type: null, id: null });
    };

    const executeDevolver = async () => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${modal.id}/devolver`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id_user: user.id_user })
            });
            if (res.ok) { 
                setToast({ type: 'success', message: "Processo de devolução registado!" }); 
                fetchPerfilData(); 
            } else {
                setToast({ type: 'error', message: "Erro ao processar devolução." });
            }
        } catch (e) { setToast({ type: 'error', message: "Erro de ligação." }); }
        setModal({ isOpen: false, type: null, id: null });
    };

    const confirmCancelar = (id) => setModal({ isOpen: true, type: 'cancelar', id });
    const confirmDevolver = (id) => setModal({ isOpen: true, type: 'devolver', id });
    
    const handleEditar = async (item) => {
        localStorage.setItem('evento_trabalho', JSON.stringify({ id_req: item.id_orig, nome: item.title }));
        if (item.id_estado_req === 1 || item.id_estado_req === 2) {
            try {
                await fetch(`http://localhost:3002/api/requisicoes/${item.id_orig}/estado`, {
                    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id_estado: 4 })
                });
            } catch (e) { console.error(e); }
        }
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
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/explorar')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        {isAdmin && <Link to="/admin" className="nav-item-esp">ADMINISTRAÇÃO</Link>}
                        {isGestor && <Link to="/gestao" className="nav-item-esp">GESTÃO</Link>}
                        {(!isAdmin && !isGestor && !isConvidado) && <Link to="/home" className="nav-item-esp">INÍCIO</Link>}
                    </nav>
                    <div className="header-icons-esp">
                        <div className="user-profile-badge" style={{ marginRight: '15px', textAlign: 'right' }}>
                            <span style={{ color: 'white', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                                {user?.nome?.split(' ')[0]}
                            </span>
                            <span style={{ color: '#3498db', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>
                                {isAdmin ? 'ADMINISTRADOR' : (isConvidado ? 'CONVIDADO' : (isGestor ? 'GESTOR' : 'FUNCIONÁRIO'))}
                            </span>
                        </div>

                        {!isReadOnly && (
                            <Link to="/carrinho">
                                <ShoppingCart size={24} className="icon-esp" />
                            </Link>
                        )}
                        
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
                    <div className="user-avatar-esp" style={{ backgroundColor: isAdmin ? '#f1c40f' : '#1f4e79' }}>
                        {isAdmin ? <ShieldCheck size={24} color="white" /> : null}
                    </div>
                    <div>
                        <h2 className="user-title-esp">Olá, {user?.nome}.</h2>
                        <p className="user-email-esp">{user?.email}</p>
                    </div>
                </div>

                {isReadOnly ? (
                    <div className="no-items-msg" style={{ 
                        marginTop: '50px', 
                        borderStyle: 'solid', 
                        borderColor: isAdmin ? '#f1c40f' : '#e2e8f0', 
                        padding: '40px',
                        background: isAdmin ? '#fffdf0' : 'white'
                    }}>
                        {isAdmin ? <ShieldCheck size={48} color="#f1c40f" style={{ marginBottom: '15px' }} /> : <ShieldAlert size={48} color="#1f4e79" style={{ marginBottom: '15px' }} />}
                        
                        <h3 style={{ color: 'var(--color-primary-dark)', fontWeight: '800' }}>
                            {isAdmin ? 'PAINEL DE CONTROLO ADMINISTRATIVO' : 'MODO DE CONSULTA ATIVO'}
                        </h3>
                        <p>
                            {isAdmin 
                                ? 'Como administrador, as tuas funções de gestão de utilizadores e monitorização global estão disponíveis no painel de administração.' 
                                : 'A sua conta não possui permissões para criar eventos ou realizar requisições de material.'}
                        </p>
                        <button 
                            onClick={() => navigate(isAdmin ? '/admin' : '/explorar')}
                            style={{ 
                                marginTop: '20px', 
                                padding: '10px 20px', 
                                backgroundColor: isAdmin ? '#f1c40f' : '#1f4e79', 
                                color: isAdmin ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {isAdmin ? 'IR PARA ADMINISTRAÇÃO' : 'VER CATÁLOGO'}
                        </button>
                    </div>
                ) : (
                    <>
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
                            {['eventos', 'requisições'].map(t => ( 
                                <button 
                                    key={t} 
                                    className={`tab-button-esp ${activeTab === t ? 'active-tab-indicator' : ''}`} 
                                    onClick={() => { setActiveTab(t); setFiltroEstado('todos'); setExpandedCardId(null); }}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="status-filter-bar-esp">
                            {activeTab === 'eventos' 
                                ? ['todos','pendente', 'agendado', 'finalizado', 'cancelado'].map(f => (
                                    <button key={f} className={`status-filter-btn ${filtroEstado === f ? 'active-status' : ''}`} onClick={() => setFiltroEstado(f)}>
                                        {f.toUpperCase()}
                                    </button>
                                ))
                                : ['todos', 'pendente', 'aprovada', 'em curso', 'finalizada', 'cancelada', 'rejeitada'].map(f => (
                                    <button key={f} className={`status-filter-btn ${filtroEstado === f ? 'active-status' : ''}`} onClick={() => setFiltroEstado(f)}>
                                        {f.toUpperCase()}
                                    </button>
                                ))
                            }
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
                                <div className="no-items-msg">Nenhum registo encontrado.</div>
                            )}
                        </div>
                    </>
                )}
            </main>
            
            <footer className="fixed-footer-esp" style={{ background: isAdmin ? '#95a5a6' : (isConvidado ? '#2c3e50' : '#1f4e79') }}>
                <span className="footer-project-esp">
                    {isAdmin ? "🛠️ PAINEL ADMIN - MUNICÍPIO DE ESPOSENDE" : (isConvidado ? "🔒 MODO CONSULTA - MUNICÍPIO DE ESPOSENDE" : "Gestão de Ativos - Município de Esposende")}
                </span>
            </footer>
        </div>
    );
};

export default Perfil;