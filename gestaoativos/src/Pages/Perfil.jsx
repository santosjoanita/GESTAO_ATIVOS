import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Perfil.css'; 
import logo from '../assets/img/esposende.png'; 

const formatDate = (dateString) => {
    if (!dateString) return 'Data não especificada';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const EventCard = ({ event, isExpanded, onToggle, onTrabalhar, isRequisicao }) => (
    <div className={`event-card ${event.colorClass} ${isExpanded ? 'expanded' : ''}`}>
        <div className="event-header-row" onClick={onToggle}>
            <div>
                <p className="event-title">{event.title} <span className="status-tag">({event.status})</span></p>
                {!isRequisicao && (
                    <p className="event-date">
                        Data: {event.date} {event.data_fim ? ` até ${formatDate(event.data_fim)}` : ''}
                    </p>
                )}
            </div>
            <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                {isRequisicao && (event.status.toLowerCase().includes('aprovad')) && (
                    <button className="edit-button-esp" onClick={() => onTrabalhar(event.title)}>
                        TRABALHAR
                    </button>
                )}
                <div className="event-arrow-container">
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </div>
        </div>
        {isExpanded && (
            <div className="event-details">
                <h4 className="details-title">Detalhes:</h4>
                <div className="details-info-grid">
                    <p><strong>Localização:</strong> {event.localizacao || 'Esposende (Centro)'}</p>
                    {!isRequisicao && (
                        <p style={{marginTop: '10px', color: '#1f4e79', fontWeight: 'bold'}}>
                            Existem {event.num_requisicoes || 0} requisições neste evento.
                        </p>
                    )}
                </div>
            </div>
        )}
    </div>
);

const Perfil = ({ onLogout }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const isGestor = user?.id_perfil == 2;
    const navigate = useNavigate();

    const [userData, setUserData] = useState({ 
        nome: user?.nome || '...', 
        email: user?.email || '', 
        projetoAtual: localStorage.getItem('projeto_ativo') || 'Sem requisição' 
    });
    const [eventsList, setEventsList] = useState([]);
    const [requisicoesList, setRequisicoesList] = useState([]);
    const [activeTab, setActiveTab] = useState('todos'); 
    const [expandedCardId, setExpandedCardId] = useState(null); 
    const [filtroEstado, setFiltroEstado] = useState('todos');

    const fetchPerfilData = async () => {
        if (!user) return;
        try {
            const [resReq, resEv] = await Promise.all([
                fetch(`http://localhost:3001/api/requisicoes/user/${user.id_user}`),
                fetch(`http://localhost:3001/api/eventos/user/${user.id_user}`)
            ]);
            
            const dataReq = await resReq.json();
            const dataEv = await resEv.json();

            const getStatusColor = (status) => {
                const s = (status || '').toString().toLowerCase(); 
                if (s.includes('aprovad')) return 'aprovado';
                if (s.includes('rejeitad')) return 'rejeitado'; 
                return 'pendente';
            };

            const reqComNumeracao = Array.isArray(dataReq) ? dataReq.map((r, index, array) => {
                const doMesmoEvento = array.filter(item => item.id_evento === r.id_evento);
                const ordem = doMesmoEvento.sort((a,b) => a.id_req - b.id_req).findIndex(item => item.id_req === r.id_req) + 1;
                
                return {
                    id: `req-${r.id_req}`, 
                    id_orig: r.id_req,
                    isRequisicao: true,
                    title: `${r.nome_evento} - Requisição ${ordem}`,
                    status: r.estado_nome || r.estado || 'Pendente',
                    localizacao: r.localizacao,
                    colorClass: getStatusColor(r.estado_nome || r.estado)
                };
            }) : [];

            setRequisicoesList(reqComNumeracao);

            const eventosComContagem = Array.isArray(dataEv) ? dataEv.map(e => {
                const totalReqs = Array.isArray(dataReq) ? dataReq.filter(r => r.id_evento === e.id_evento).length : 0;
                
                return {
                    id: `ev-${e.id_evento}`,
                    isRequisicao: false,
                    title: e.nome_evento,
                    date: formatDate(e.data_inicio),
                    data_fim: e.data_fim,
                    status: e.estado_nome,
                    localizacao: e.localizacao, 
                    num_requisicoes: totalReqs,
                    colorClass: getStatusColor(e.estado_nome)
                };
            }) : [];

            setEventsList(eventosComContagem);

        } catch (error) { console.error(error); }
    };

    useEffect(() => { 
        if (!user) navigate('/');
        else fetchPerfilData(); 
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/');
    };

    const displayItems = (() => {
        let list = activeTab === 'eventos' ? eventsList : 
                   activeTab === 'requisicoes' ? requisicoesList : 
                   [...eventsList, ...requisicoesList];

        if (filtroEstado !== 'todos') {
            list = list.filter(item => {
                const status = (item.status || '').toLowerCase();
                return status.includes(filtroEstado.substring(0, 5));
            });
        }
        return list;
    })();

    return (
        <div className="perfil-page-app">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp"><img src={logo} alt="Logo" className="logo-img" /></div>
                    <nav className="header-nav-esp">
                        {isGestor ? (
                            <><Link to="/gestao" className="nav-item-esp">VOLTAR À DASHBOARD</Link><Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link></>
                        ) : (
                            <>
                            <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                            <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                            <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                            <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                            </>
                        )}
                    </nav>
                   <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <Link to="/perfil" className="icon-link-active">
                            <User size={24} className="icon-esp active-icon-indicator" />
                        </Link>
                        <button onClick={handleLogout} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" /> {/* MUDADO AQUI */}
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content-esp">
                <div className="user-panel-esp">
                    <div className="user-avatar-esp"></div>
                    <div>
                        <h2 className="user-title-esp">Olá, {user?.nome || 'Utilizador'}.</h2>
                        <p className="user-email-esp">{user?.email}</p>
                    </div>
                </div>

                <div className="tabs-container-esp">
                    <button className={`tab-button-esp ${activeTab === 'todos' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('todos')}>TODOS</button>
                    <button className={`tab-button-esp ${activeTab === 'eventos' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('eventos')}>EVENTOS</button>
                    <button className={`tab-button-esp ${activeTab === 'requisicoes' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('requisicoes')}>REQUISIÇÕES</button>
                </div>

                <div className="status-filter-bar-esp">
                    {['todos', 'pendente', 'aprovado', 'rejeitado'].map((estado) => (
                        <button key={estado} className={`status-filter-btn ${filtroEstado === estado ? 'active-status' : ''}`} onClick={() => setFiltroEstado(estado)}>{estado.toUpperCase()}</button>
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
                                onToggle={() => setExpandedCardId(expandedCardId === item.id ? null : item.id)}
                                onTrabalhar={(name) => { 
                                    setUserData({...userData, projetoAtual: name}); 
                                    localStorage.setItem('projeto_ativo', name); 
                                    navigate('/explorar'); 
                                }} 
                            />
                        ))
                    ) : (
                        <p className="no-items-msg">Nenhum item encontrado.</p>
                    )}
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-project-esp">
                            {isGestor ? "PAINEL ADMINISTRATIVO" : `ATUALMENTE A TRABALHAR EM: ${userData.projetoAtual}`}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Perfil;