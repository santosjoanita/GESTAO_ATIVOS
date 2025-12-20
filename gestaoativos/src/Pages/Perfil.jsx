import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import './Perfil.css'; 
import logo from '../assets/img/esposende.png'; 

const formatDate = (dateString) => {
    if (!dateString) return 'Data não especificada';
    const datePart = dateString.split('T')[0]; 
    const [year, month, day] = datePart.split('-');
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
                {showTrabalhar && (
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
    const [userData, setUserData] = useState({
        nome: 'A carregar...',
        email: '',
        projetoAtual: 'Sem requisição', 
        perfil: ''
    });
    const [eventsList, setEventsList] = useState([]);
    const [requisicoesList, setRequisicoesList] = useState([]);
    const [activeTab, setActiveTab] = useState('eventos'); 
    const [expandedCardId, setExpandedCardId] = useState(null); 
    const navigate = useNavigate();

    const fetchPerfilData = async () => {
    const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };
    try {
        // 1. Vai à BD buscar os dados do utilizador e eventos
        const resPerfil = await fetch(`http://localhost:3001/api/eventos/perfil/${user.id}`);
        if (resPerfil.ok) {
            const data = await resPerfil.json();
            setUserData({
                nome: data.nome,
                email: data.email,
                projetoAtual: localStorage.getItem('projeto_ativo') || 'Sem requisição',
                perfil: data.perfil
            });
            // Transforma os eventos da BD para os cards
            setEventsList(data.eventos.map(ev => ({
                id: ev.id_evento,
                title: ev.nome_evento,
                date: `${formatDate(ev.data_inicio)} a ${formatDate(ev.data_fim)}`,
                status: ev.estado_nome,
                colorClass: `event-${ev.estado_nome.toLowerCase()}`
            })));
        }

        // 2. Vai à BD buscar as requisições criadas (as que aparecem no card com botão Trabalhar)
        const resReq = await fetch(`http://localhost:3001/api/requisicoes/user/${user.id}`);
        if (resReq.ok) {
            const dataReq = await resReq.json();
            setRequisicoesList(dataReq.map(r => ({
                id: r.id_requisicao,
                title: r.nome_evento,
                date: formatDate(r.data_requisicao),
                status: r.estado,
                colorClass: `event-${r.estado.toLowerCase()}`
            })));
        }
    } catch (error) {
        console.error("Erro ao carregar dados da Base de Dados:", error);
    }
};

    useEffect(() => {
        fetchPerfilData();
    }, []);

    const handleTrabalhar = (nome) => {
        setUserData(prev => ({ ...prev, projetoAtual: nome }));
        localStorage.setItem('projeto_ativo', nome);
        navigate('/explorar-material');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('projeto_ativo');
        if (onLogout) onLogout();
        navigate('/');
    };

    const displayItems = activeTab === 'eventos' ? eventsList : requisicoesList;

    return (
        <div className="perfil-page-app">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp"><img src={logo} alt="Logo" className="logo-img" /></div>
                    <nav className="header-nav-esp">
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link> 
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>
                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <User size={24} className="icon-esp active-icon-indicator" />
                        <button onClick={handleLogout} className="logout-btn"><CornerDownLeft size={24} className="icon-esp" /></button>
                    </div>
                </div>
            </header>

            <main className="main-content-esp">
                <div className="user-panel-esp">
                    <div className="user-avatar-esp"></div>
                    <div>
                        <h2 className="user-title-esp">Olá, {userData.nome}.</h2>
                        <p className="user-email-esp">{userData.email}</p>
                        <button className="edit-button-esp">EDITAR DADOS PESSOAIS</button>
                    </div>
                </div>

                <div className="tabs-container-esp">
                    <button className={`tab-button-esp ${activeTab === 'eventos' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('eventos')}>EVENTOS</button>
                    <button className={`tab-button-esp ${activeTab === 'requisicoes' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('requisicoes')}>REQUISIÇÕES</button>
                </div>

                <div className="list-items-container-esp">
                    {displayItems.map(item => (
                        <EventCard
                            key={item.id}
                            event={item}
                            isExpanded={expandedCardId === item.id}
                            onToggle={() => setExpandedCardId(expandedCardId === item.id ? null : item.id)}
                            onTrabalhar={handleTrabalhar}
                            showTrabalhar={activeTab === 'requisicoes'}
                        />
                    ))}
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp" onClick={() => navigate('/explorar-material')}>EXPLORAR MATERIAL</button>
                        <span className="footer-project-esp">
                            {userData.projetoAtual === 'Sem requisição' ? 'SEM REQUISIÇÃO ATIVA' : `ATUALMENTE A TRABALHAR EM: ${userData.projetoAtual}`}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Perfil;