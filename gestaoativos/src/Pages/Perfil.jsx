import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft, Package, Edit, RotateCcw, XCircle, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Perfil.css'; 
import logo from '../assets/img/esposende.png'; 

const formatDate = (dateString) => {
    if (!dateString) return '--/--/----';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Data Inválida';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const EventCard = ({ event, isExpanded, onToggle, onTrabalhar, onDevolver, onCancelar, isRequisicao, materiais }) => {
    if (!event) return null;
    const estado = event.id_estado_req;

    // Aprovada (2) ou Em Curso (4) -> Pode Trabalhar ou Devolver
    const podeTrabalhar = isRequisicao && (estado === 2 || estado === 4);
    const podeDevolver = isRequisicao && (estado === 4 || estado === 2);
    // Pendente (1) -> Pode Cancelar
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
                <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                    {podeTrabalhar && (
                        <button className="edit-button-esp btn-pendente" onClick={onTrabalhar} title="Adicionar Materiais">
                            <Briefcase size={14} style={{marginRight: '5px'}}/> TRABALHAR
                        </button>
                    )}
                    {podeCancelar && (
                        <button className="edit-button-esp btn-cancelar" onClick={() => { if(window.confirm('Cancelar requisição?')) onCancelar(); }} style={{backgroundColor:'#e74c3c', marginLeft:'5px'}}>
                            <XCircle size={14} />
                        </button>
                    )}
                    {podeDevolver && (
                        <button className="edit-button-esp btn-devolver" onClick={() => { if(window.confirm('Confirma a devolução de todos os materiais?')) onDevolver(); }} style={{backgroundColor:'#e67e22'}}>
                            <RotateCcw size={14} /> DEVOLVER
                        </button>
                    )}
                    <div className="event-arrow-container">{isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </div>
            </div>
            {isExpanded && (
                <div className="event-details">
                    <h4 className="details-title">Detalhes:</h4>
                    <div className="details-info-grid">
                        <p><strong>Local:</strong> {event.localizacao || 'N/A'}</p>
                        {isRequisicao && (
                            <div className="materiais-container-perfil" style={{marginTop:'15px'}}>
                                <p style={{fontWeight:'800',fontSize:'13px',color:'var(--primary-blue)'}}><Package size={16}/> MATERIAIS:</p>
                                {materiais?.length > 0 ? (
                                    <ul style={{listStyle:'none',padding:'10px 0'}}>
                                        {materiais.map((m, idx) => (<li key={idx} style={{fontSize:'12px',borderBottom:'1px solid #eee'}}>• {m.nome} — <strong>{m.quantidade}</strong></li>))}
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

    const getAuthHeaders = useCallback(() => {
        const u = localStorage.getItem('user');
        const user = u ? JSON.parse(u) : null;
        return { 'Content-Type': 'application/json', 'Authorization': user?.token ? `Bearer ${user.token}` : '' };
    }, []);

    const fetchPerfilData = useCallback(async () => {
        const u = localStorage.getItem('user');
        const user = u ? JSON.parse(u) : null;
        if (!user) { navigate('/'); return; }

        try {
            const [resReq, resEv] = await Promise.all([
                fetch(`http://localhost:3002/api/requisicoes/user/${user.id_user || user.id}`, { headers: getAuthHeaders() }),
                fetch(`http://localhost:3002/api/eventos/user/${user.id_user || user.id}`, { headers: getAuthHeaders() })
            ]);

            if (resReq.status === 401 || resEv.status === 401) {
                localStorage.clear();
                navigate('/');
                return;
            }

            const dataReq = await resReq.json();
            const dataEv = await resEv.json();

            const getStatusColor = (s) => {
                const st = (s || '').toLowerCase();
                if (st.includes('aprov') || st.includes('agend')) return 'aprovado';
                if (st.includes('em curso')) return 'em-curso';
                if (st.includes('final') || st.includes('concl')) return 'finalizado';
                if (st.includes('cancel') || st.includes('rejeit') || st.includes('recus')) return 'rejeitado';
                return 'pendente';
            };

            const reqComNumeracao = Array.isArray(dataReq) ? dataReq.map((r, index, array) => {
                const doMesmo = array.filter(i => i.id_evento === r.id_evento);
                const ordem = doMesmo.sort((a,b) => a.id_req - b.id_req).findIndex(i => i.id_req === r.id_req) + 1;
                return {
                    id: `req-${r.id_req}`, id_orig: r.id_req, isRequisicao: true,
                    title: `${r.nome_evento || 'Evento'} - Req. ${ordem}`,
                    status: r.estado_nome || 'Pendente',
                    id_estado_req: r.id_estado_req,
                    localizacao: r.localizacao, data_fim: r.data_fim,
                    colorClass: getStatusColor(r.estado_nome)
                };
            }) : [];
            setRequisicoesList(reqComNumeracao);

            const evFormatados = Array.isArray(dataEv) ? dataEv.map(e => ({
                id: `ev-${e.id_evento}`, isRequisicao: false,
                title: e.nome_evento, date: formatDate(e.data_inicio), data_fim: e.data_fim,
                status: e.estado_nome, localizacao: e.localizacao,
                colorClass: getStatusColor(e.estado_nome)
            })) : [];
            setEventsList(evFormatados);

        } catch (error) { console.error("Erro perfil:", error); }
    }, [navigate, getAuthHeaders]);

    useEffect(() => { fetchPerfilData(); }, [fetchPerfilData]);

    const fetchMateriaisReq = async (idReq) => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${idReq}/materiais`, { headers: getAuthHeaders() });
            if (res.ok) setMateriaisCard(await res.json());
        } catch (err) { console.error(err); }
    };

    // 1. CANCELAR (Estado 6) - Rota Segura com Reposição de Stock
    const handleCancelar = async (id) => {
        const u = localStorage.getItem('user');
        const user = u ? JSON.parse(u) : null;
        if (!user) return;

        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${id}/cancelar`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id_user: user.id_user || user.id })
            });
            if(res.ok) { alert("Requisição cancelada."); fetchPerfilData(); }
            else { const err = await res.json(); alert("Erro: " + (err.message || err.error)); }
        } catch (e) { alert("Erro de conexão"); }
    };

    // 2. DEVOLVER (Estado 5) - Rota Segura com Reposição de Stock
    const handleDevolver = async (idReq) => {
        const u = localStorage.getItem('user');
        const user = u ? JSON.parse(u) : null;
        if (!user) return;

        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${idReq}/devolver`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id_user: user.id_user || user.id })
            });
            if (res.ok) { alert("Devolução registada com sucesso!"); fetchPerfilData(); }
            else { const err = await res.json(); alert("Erro ao devolver: " + (err.message || err.error)); }
        } catch (e) { alert("Erro de conexão ao devolver."); }
    };

    const handleToggle = (item) => {
        if (expandedCardId === item.id) { setExpandedCardId(null); setMateriaisCard([]); }
        else { setExpandedCardId(item.id); if (item.isRequisicao) fetchMateriaisReq(item.id_orig); }
    };

    const displayItems = (() => {
        let list = activeTab === 'eventos' ? eventsList : activeTab === 'requisicoes' ? requisicoesList : [...eventsList, ...requisicoesList];
        if (filtroEstado !== 'todos') {
            list = list.filter(item => {
                const s = (item.status || '').toLowerCase();
                if (filtroEstado === 'aprovada') return s.includes('aprov') || s.includes('agend');
                if (filtroEstado === 'cancelada') return s.includes('cancel') || s.includes('recus');
                return s.includes(filtroEstado);
            });
        }
        return list;
    })();

    const u = localStorage.getItem('user');
    const user = u ? JSON.parse(u) : null;
    const isGestor = user?.id_perfil === 2;
    const filtrosSimples = ['todos', 'pendente', 'aprovada', 'em curso', 'finalizada', 'cancelada'];

    return (
        <div className="perfil-page-app">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        {isGestor ? <><Link to="/gestao" className="nav-item-esp">GESTÃO</Link><Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link></> : 
                                    <><Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link><Link to="/home" className="nav-item-esp">INÍCIO</Link></>}
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
                    <div><h2 className="user-title-esp">Olá, {user?.nome || 'Utilizador'}.</h2><p className="user-email-esp">{user?.email}</p></div>
                </div>

                <div className="tabs-container-esp">
                    {['todos', 'eventos', 'requisicoes'].map(t => (<button key={t} className={`tab-button-esp ${activeTab === t ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab(t)}>{t.toUpperCase()}</button>))}
                </div>

                <div className="status-filter-bar-esp">
                    {filtrosSimples.map(f => (<button key={f} className={`status-filter-btn ${filtroEstado === f ? 'active-status' : ''}`} onClick={() => setFiltroEstado(f)}>{f.toUpperCase()}</button>))}
                </div>

                <div className="list-items-container-esp">
                    {displayItems.length > 0 ? displayItems.map(item => (
                        <EventCard key={item.id} event={item} isRequisicao={item.isRequisicao} isExpanded={expandedCardId === item.id} materiais={materiaisCard}
                            onToggle={() => handleToggle(item)}
                            onDevolver={() => handleDevolver(item.id_orig)}
                            onCancelar={() => handleCancelar(item.id_orig)} 
                            onTrabalhar={() => { localStorage.setItem('evento_trabalho', JSON.stringify({ id_req: item.id_orig, nome: item.title })); navigate('/explorar'); }} 
                        />
                    )) : <p className="no-items-msg">Nenhum item encontrado.</p>}
                </div>
            </main>
            <footer className="fixed-footer-esp"><div className="footer-content-esp centered-content"><span className="footer-project-esp">ESPOSENDE GESTÃO</span></div></footer>
        </div>
    );
};

export default Perfil;