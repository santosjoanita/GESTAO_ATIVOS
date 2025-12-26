import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft, LogOut } from 'lucide-react'; 
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

const EventCard = ({ event, isExpanded, onToggle, onTrabalhar, showTrabalhar }) => (
    <div className={`event-card ${event.colorClass} ${isExpanded ? 'expanded' : ''}`}>
        <div className="event-header-row" onClick={onToggle}>
            <div>
                <p className="event-title">{event.title} <span className="status-tag">({event.status})</span></p>
                <p className="event-date">Data: {event.date}</p>
            </div>
            <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                {showTrabalhar && (event.status === 'Aprovada' || event.status === 'Aprovado') && (
                    <button className="edit-button-esp" onClick={() => onTrabalhar(event.title)}>
                        TRABALHAR
                    </button>
                )}
                <div className="event-arrow-container" onClick={onToggle}>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </div>
        </div>
        {isExpanded && (
            <div className="event-details">
                <h4 className="details-title">Detalhes da Requisição:</h4>
                <p className="material-list">ID Único: #{event.id}</p>
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

    const fetchPerfilData = async () => {
        if (!user) return;

        try {
            const resReq = await fetch(`http://localhost:3001/api/requisicoes/user/${user.id_user}`);
            const dataReq = await resReq.json();
            
            const resEv = await fetch(`http://localhost:3001/api/eventos/user/${user.id_user}`);
            const dataEv = await resEv.json();
            const getStatusColor = (status) => {
            const s = (status || '').toString().toLowerCase(); 
                if (s.includes('aprovad')) return 'aprovado';
                if (s.includes('rejeitad')) return 'rejeitado'; 
                return 'pendente';
            };  
            setRequisicoesList(Array.isArray(dataReq) ? dataReq.map(r => ({
                id: r.id_req,
                title: r.nome_evento,
                date: formatDate(r.data_pedido), 
                status: r.estado_nome || r.estado || 'Pendente',
                colorClass: getStatusColor(r.estado_nome || r.estado) 
            })) : []);

            setEventsList(Array.isArray(dataEv) ? dataEv.map(e => ({
                id: e.id_evento,
                title: e.nome_evento,
                date: formatDate(e.data_inicio),
                status: e.estado_nome,
                colorClass: getStatusColor(e.estado_nome)
            })) : []);

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

    const displayItems = activeTab === 'eventos' ? eventsList : 
                         activeTab === 'requisicoes' ? requisicoesList : 
                         [...eventsList, ...requisicoesList];

    return (
        <div className="perfil-page-app">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp"><img src={logo} alt="Logo" className="logo-img" /></div>
                    <nav className="header-nav-esp">
                        {isGestor ? (
                            /* HEADER EXCLUSIVO DO GESTOR */
                            <Link to="/gestao" className="nav-item-esp">VOLTAR À DASHBOARD</Link>
                        ) : (
                            /* HEADER DO FUNCIONÁRIO */
                            <>
                                <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                                <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link> 
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
                            <LogOut size={24} className="icon-esp" />
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
                        <button className="edit-button-esp">EDITAR DADOS PESSOAIS</button>
                    </div>
                </div>

                <div className="tabs-container-esp">
                    <button className={`tab-button-esp ${activeTab === 'todos' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('todos')}>TODOS</button>
                    <button className={`tab-button-esp ${activeTab === 'eventos' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('eventos')}>EVENTOS</button>
                    <button className={`tab-button-esp ${activeTab === 'requisicoes' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('requisicoes')}>REQUISIÇÕES</button>
                </div>

                <div className="list-items-container-esp">
                    {displayItems.length > 0 ? (
                        displayItems.map(item => (
                            <EventCard key={`${item.id}-${item.title}`} event={item} isExpanded={expandedCardId === item.id} 
                                onToggle={() => setExpandedCardId(expandedCardId === item.id ? null : item.id)}
                                onTrabalhar={(name) => { setUserData({...userData, projetoAtual: name}); localStorage.setItem('projeto_ativo', name); navigate('/explorar-material'); }} 
                                showTrabalhar={activeTab === 'requisicoes' || activeTab === 'todos'} />
                        ))
                    ) : (
                        <p className="no-items-msg">Nenhum item encontrado.</p>
                    )}
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        {isGestor ? (
                            /* FOOTER EXCLUSIVO DO GESTOR */
                            <button className="explore-button-esp" onClick={() => navigate('/stock')}>ATUALIZAR STOCK</button>
                        ) : (
                            /* FOOTER DO FUNCIONÁRIO */
                            <button className="explore-button-esp" onClick={() => navigate('/explorar-material')}>EXPLORAR MATERIAL</button>
                        )}
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