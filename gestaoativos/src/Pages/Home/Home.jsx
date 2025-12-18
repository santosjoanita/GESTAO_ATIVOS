import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Bell, Calendar, Repeat, Search } from 'lucide-react';
import './Home.css'; 
import '../Perfil.css'; 
import logo from '../../assets/img/esposende.png'; 

const activityMap = [
    { key: 'requisicoes_ativas', titulo: "REQUISIÇÕES ATIVAS", cor: 'active', icone: Repeat },
    { key: 'requisicoes_pendentes', titulo: "REQUISIÇÕES PENDENTES", cor: 'pending', icone: Repeat },
    { key: 'eventos_agendados', titulo: "EVENTOS E REQUISIÇÕES AGENDADAS", cor: 'scheduled', icone: Calendar },
    { key: 'requisicoes_rejeitadas', titulo: "REQUISIÇÕES REJEITADAS", cor: 'rejected', icone: Repeat },
];

const Home = ({ onLogout }) => {
    const [notifications, setNotifications] = useState([]);
    const [activityCounts, setActivityCounts] = useState({});
    const [projetoAtual, setProjetoAtual] = useState("A carregar...");
    const navigate = useNavigate();
    
    const userId = 1; 

    // --- LÓGICA DE BUSCA DE DADOS ---
    const fetchDashboardData = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/eventos/summary/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                
                const formattedNotifications = data.notifications.map(n => ({
                    ...n,
                    message: `A ${n.tipo.toUpperCase()} '${n.nome.toUpperCase()}' acaba em ${n.dias_restantes} dia${n.dias_restantes > 1 ? 's' : ''}`
                }));

                setNotifications(formattedNotifications);
                setActivityCounts(data.activity_counts);
                setProjetoAtual(data.projetoAtual || "Sem requisição ativa");

            } else {
                console.error("Erro ao carregar dados do dashboard.");
            }
        } catch (error) {
            console.error("Erro de conexão ao carregar dashboard:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []); 

    // --- LÓGICA DE NAVEGAÇÃO E LOGOUT ---
    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }

        localStorage.removeItem('currentUser'); 
        
        navigate('/');
    };

    const handleNavigateToPerfil = () => {
        navigate('/perfil');
    };

    return (
        <div className="home-page-layout">
            
            {/* --- CABEÇALHO --- */}
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp">
                        <img src={logo} alt="Logo Esposende" className="logo-img" />
                    </div>
                    
                    <nav className="header-nav-esp">
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/home" className="nav-item-esp active-tab-indicator">PÁGINA INICIAL</Link>
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>

                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <Link to="/perfil"> 
                            <User size={24} className="icon-esp" /> 
                        </Link>
                        <button onClick={handleLogout} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-home-content">
                
                <section className="home-section">
                    <h3 className="section-title"><Bell size={24} /> NOTIFICAÇÕES:</h3>
                    <div className="notifications-container">
                        {notifications.length > 0 ? (
                            notifications.map(notificacao => (
                                <div key={notificacao.id} className={`notification-item-home ${notificacao.status_nome.toLowerCase().replace(' ', '-')}`}>
                                    <p>{notificacao.message}</p>
                                    <button onClick={handleNavigateToPerfil} className="notification-details-link">VER DETALHES</button>
                                </div>
                            ))
                        ) : (
                            <p className="no-notifications">Não há eventos ou requisições a expirar nos próximos 3 dias.</p>
                        )}
                    </div>
                </section>
                
                {/* 2. PAINEL DE ATIVIDADE (DINÂMICO) */}
                <section className="home-section">
                    <h3 className="section-title">O SEU PAINEL DE ATIVIDADE:</h3>
                    <div className="activity-panel-container">
                        {activityMap.map(item => {
                            const count = activityCounts[item.key] || 0;
                            const displayCount = (item.key === 'requisicoes_rejeitadas' && count === 0) ? '' : count; 

                            return (
                                <button 
                                    key={item.key} 
                                    onClick={handleNavigateToPerfil} 
                                    className={`activity-card ${item.cor}`}
                                >
                                    <item.icone size={28} />
                                    <h4>{displayCount} {item.titulo}</h4>
                                    <span className="activity-link">VER DETALHES</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

               <section className="home-section">
                    <h3 className="section-title">GUIA RÁPIDO DE UTILIZAÇÃO</h3>
                    <div className="quick-guide-container">
                        
                        <p className="guide-instruction">
                            Para solicitar material, clique no botão 
                            <span className="inline-button-icon">
                                <Repeat size={16} className="inline-icon" /> NOVA REQUISIÇÃO
                            </span> no cabeçalho.
                        </p>
                        
                        <p className="guide-instruction">
                            Para criar um Evento, clique no botão 
                            <span className="inline-button-icon">
                                <Calendar size={16} className="inline-icon" /> NOVO EVENTO
                            </span> no cabeçalho.
                        </p>

                        <p className="guide-instruction">
                            Para ver o estado de todas as requisições/eventos, clique no 
                            <span className="inline-icon-only">
                                <User size={18} className="inline-icon" />
                            </span> 
                            ÍCONE DO PERFIL.
                        </p>

                        <p className="guide-instruction">
                            Para explorar o catálogo de material, clique no botão 
                            <span className="inline-button-icon explore-material">
                                <Search size={16} className="inline-icon" /> EXPLORAR MATERIAL
                            </span> no rodapé.
                        </p>
                        
                    </div>
                </section>
                
            </main>

            {/* --- RODAPÉ --- */}
            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp">EXPLORAR MATERIAL</button>
                        <span className="footer-project-esp">
                            ATUALMENTE A TRABALHAR EM: {projetoAtual}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;