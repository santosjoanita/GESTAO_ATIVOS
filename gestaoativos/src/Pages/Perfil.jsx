import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import './Perfil.css'; 
import logo from '../assets/img/esposende.png'; 

const formatDate = (dateString) => {
    if (!dateString) return 'Data não especificada';
    const datePart = dateString.split('T')[0]; 
    if (!datePart) return 'Data inválida';

    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
};

const EventCard = ({ event, isExpanded, onToggle }) => (
    <div className={`event-card ${event.colorClass} ${isExpanded ? 'expanded' : ''}`}>
        <div className="event-header-row" onClick={onToggle}>
            <div>
                <p className="event-title">{event.title} <span className="status-tag">({event.status})</span></p>
                <p className="event-date">Data: {event.date}</p>
            </div>
            <div className="event-arrow-container">
                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
        </div>
        
        {isExpanded && (
            <div className="event-details">
                <h4 className="details-title">Requisições do Evento:</h4>
                <p className="material-list">Sem requisições.</p>
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
    const [activeTab, setActiveTab] = useState('eventos'); 
    const [expandedCardId, setExpandedCardId] = useState(null); 
    const navigate = useNavigate();

    const fetchUserData = async () => {
        const userId = 1; 

        try {
            const response = await fetch(`http://localhost:3001/api/eventos/perfil/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                
                setUserData({
                    nome: data.nome,
                    email: data.email,
                    projetoAtual: data.projetoAtual || 'Sem requisição', 
                    perfil: data.perfil
                });
                
                const transformedEvents = data.eventos.map(event => ({
                    id: event.id_evento,
                    title: event.nome_evento,
                    date: `${formatDate(event.data_inicio)} a ${formatDate(event.data_fim)}` ,
                    status: event.estado_nome,
                    colorClass: `event-${event.estado_nome.toLowerCase()}` 
                }));
                setEventsList(transformedEvents);

            } else {
                setUserData(prev => ({ ...prev, nome: 'Erro ao carregar dados' }));
            }
        } catch (error) {
            setUserData(prev => ({ ...prev, nome: 'Erro de conexão' }));
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []); 

    const toggleCard = (id) => {
        setExpandedCardId(expandedCardId === id ? null : id);
    };

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setExpandedCardId(null); 
    };
    
    const handleProfileIconClick = () => {
        setActiveTab('eventos');
        setExpandedCardId(null);
        navigate('/perfil'); 
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigate('/'); 
    };

    const displayItems = activeTab === 'eventos' ? eventsList : []; 

    return (
        <div className="perfil-page-app">
            
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp">
                        <img src={logo} alt="Logo Esposende" className="logo-img" />
                    </div>
                    
                    <nav className="header-nav-esp">
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/perfil" className="nav-item-esp active-tab-indicator">PÁGINA INICIAL</Link>
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>

                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <User size={24} className="icon-esp" onClick={handleProfileIconClick} /> 
                        <button onClick={handleLogout} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
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
                    <button 
                        className={`tab-button-esp ${activeTab === 'eventos' ? 'active-tab-indicator' : ''}`}
                        onClick={() => handleTabChange('eventos')}
                    >EVENTOS</button>
                    <button 
                        className={`tab-button-esp ${activeTab === 'requisicoes' ? 'active-tab-indicator' : ''}`}
                        onClick={() => handleTabChange('requisicoes')}
                    >REQUISIÇÕES</button>
                </div>

                <div className="filters-row-esp">
                    <button className="status-button-esp status-all">TODOS</button>
                    <button className="status-button-esp status-approved">APROVADO</button>
                    <button className="status-button-esp status-pending">PENDENTE</button>
                    <button className="status-button-esp status-scheduled">AGENDADO</button>
                    <button className="status-button-esp status-rejected">REJEITADO</button>
                </div>

                <div className="list-items-container-esp">
                    {displayItems.map(item => (
                        <EventCard
                            key={item.id}
                            event={item}
                            isExpanded={expandedCardId === item.id}
                            onToggle={() => toggleCard(item.id)}
                        />
                    ))}
                    {eventsList.length === 0 && activeTab === 'eventos' && <p>Nenhum evento encontrado.</p>}
                </div>

            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp">EXPLORAR MATERIAL</button>
                        <span className="footer-project-esp">
                            {userData.projetoAtual === 'Sem requisição' 
                                ? 'Sem requisição ativa' 
                                : `ATUALMENTE A TRABALHAR EM: ${userData.projetoAtual}`}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Perfil;