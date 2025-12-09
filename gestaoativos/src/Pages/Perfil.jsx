// gestaoativos/src/pages/Perfil.jsx

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import './Perfil.css'; 

import logo from '../assets/img/esposende.png'; 

const mockUserData = {
    nome: "Bruno Ribeiro",
    email: "bruno.ribeiro@cm-esposende.pt",
    projetoAtual: "FEIRA DO LIVRO"
};

const mockEvents = [
    { id: 1, title: "Feira do livro", date: "dd/mm/aaaa - dd/mm/aaaa", status: "APROVADO", colorClass: "event-approved" },
    { id: 2, title: 'Concerto "Singing Christmas"', date: "dd/mm/aaaa - dd/mm/aaaa", status: "AGENDADO", colorClass: "event-scheduled" },
];

const mockRequisitions = [
    { id: 3, title: "Workshop \"Hoje é dia de: Arranjos Natalícios\"", event: "Workshop \"Hoje é dia de: Arranjos Natalícios\"", date: "dd/mm/aaaa - dd/mm/aaaa", status: "REJEITADO", colorClass: "event-rejected" },
    { id: 4, title: "Reunião de Coordenação", event: "Reunião de Coordenação", date: "dd/mm/aaaa - dd/mm/aaaa", status: "PENDENTE", colorClass: "event-pending" },
];

// Componente Card de Evento
const EventCard = ({ event, isExpanded, onToggle }) => (
    <div className={`event-card ${event.colorClass} ${isExpanded ? 'expanded' : ''}`}>
        <div className="event-header-row" onClick={onToggle}>
            <div>
                <p className="event-title">{event.title}</p>
                <p className="event-date">Data: {event.date}</p>
            </div>
            <div className="event-arrow-container">
                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
        </div>
        
        {isExpanded && (
            <div className="event-details">
                <h4 className="details-title">Detalhes de Material:</h4>
                <ul className="material-list">
                    <li>Tenda Desmontável: Solicitado 4, Aprovado 4.</li>
                    <li>Gerador Portátil (5KVA): Solicitado 1, Aprovado 0.</li>
                </ul>
            </div>
        )}
    </div>
);


const Perfil = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('eventos'); 
    const [expandedCardId, setExpandedCardId] = useState(null); 
    const navigate = useNavigate();

    const toggleCard = (id) => {
        setExpandedCardId(expandedCardId === id ? null : id);
    };

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setExpandedCardId(null); 
    };
    
    // LOGOUT FUNCIONAL
    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigate('/'); 
    };

    const displayItems = activeTab === 'eventos' ? mockEvents : mockRequisitions;

    return (
        <div className="perfil-page-app">
            
            {/* --- CABEÇALHO --- */}
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp">
                        <img src={logo} alt="Logo Esposende" className="logo-img" />
                    </div>
                    
                    <nav className="header-nav-esp">
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        {/* Página Inicial ativa, mas sem fundo azul (apenas a borda) */}
                        <Link to="/perfil" className="nav-item-esp active-tab-indicator">PÁGINA INICIAL</Link> 
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>

                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <User size={24} className="icon-esp" /> 
                        <button onClick={handleLogout} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="main-content-esp">
                
                {/* BLOCO SUPERIOR DO UTILIZADOR */}
                <div className="user-panel-esp">
                    <div className="user-avatar-esp"></div>
                    <div>
                        <h2 className="user-title-esp">Olá, {mockUserData.nome}.</h2>
                        <p className="user-email-esp">{mockUserData.email}</p>
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

                {/* FILTROS DE ESTADO */}
                <div className="filters-row-esp">
                    <button className="status-button-esp status-all">TODOS</button>
                    <button className="status-button-esp status-approved">APROVADO</button>
                    <button className="status-button-esp status-pending">PENDENTE</button>
                    <button className="status-button-esp status-scheduled">AGENDADO</button>
                    <button className="status-button-esp status-rejected">REJEITADO</button>
                </div>

                {/* LISTA DE EVENTOS/REQUISIÇÕES */}
                <div className="list-items-container-esp">
                    {displayItems.map(item => (
                        <EventCard
                            key={item.id}
                            event={item}
                            isExpanded={expandedCardId === item.id}
                            onToggle={() => toggleCard(item.id)}
                        />
                    ))}
                </div>

            </main>

            {/* --- RODAPÉ --- */}
            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp">EXPLORAR MATERIAL</button>
                        <span className="footer-project-esp">
                            ATUALMENTE A TRABALHAR EM: {mockUserData.projetoAtual}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Perfil;