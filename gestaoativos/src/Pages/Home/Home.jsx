import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Bell, Calendar, Repeat, Search } from 'lucide-react';
import './Home.css'; 
import logo from '../../assets/img/esposende.png';

const activityMap = [
    { key: 'eventosCount', titulo: "EVENTOS CRIADOS", cor: 'active', icone: Calendar },
    { key: 'requisicoesCount', titulo: "REQUISIÇÕES EFETUADAS", cor: 'pending', icone: Repeat },
];

const Home = ({ onLogout }) => {
    const [notifications, setNotifications] = useState([]);
    const [activityCounts, setActivityCounts] = useState({ eventosCount: 0, requisicoesCount: 0 });
    const [projetoAtual, setProjetoAtual] = useState("A carregar...");
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id_user : null;

    const fetchDashboardData = async () => {
        if (!userId) return;

        try {
            // Rota de summary que criámos no server.js
            const response = await fetch(`http://localhost:3001/api/eventos/summary/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Atualiza contadores e projeto ativo
                setActivityCounts({
                    eventosCount: data.eventosCount || 0,
                    requisicoesCount: data.requisicoesCount || 0
                });
                
                setProjetoAtual(localStorage.getItem('projeto_ativo') || "Sem requisição ativa");
                
                // Simulação de notificações (ou podes expandir a rota summary para enviar estas notificações)
                setNotifications([]); 

            } else {
                console.error("Erro ao carregar dados do dashboard.");
            }
        } catch (error) {
            console.error("Erro de conexão ao carregar dashboard:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [userId]); 

    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/');
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
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
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
                
                {/* 1. NOTIFICAÇÕES */}
                <section className="home-section">
                    <h3 className="section-title"><Bell size={24} /> NOTIFICAÇÕES:</h3>
                    <div className="notifications-container">
                        {notifications.length > 0 ? (
                            notifications.map(notificacao => (
                                <div key={notificacao.id} className="notification-item-home">
                                    <p>{notificacao.message}</p>
                                    <button onClick={() => navigate('/perfil')} className="notification-details-link">VER DETALHES</button>
                                </div>
                            ))
                        ) : (
                            <p className="no-notifications">Não existem notificações pendentes.</p>
                        )}
                    </div>
                </section>
                
                {/* 2. PAINEL DE ATIVIDADE */}
                <section className="home-section">
                    <h3 className="section-title">O SEU PAINEL DE ATIVIDADE:</h3>
                    <div className="activity-panel-container">
                        {activityMap.map(item => (
                            <button 
                                key={item.key} 
                                onClick={() => navigate('/perfil')} 
                                className={`activity-card ${item.cor}`}
                            >
                                <item.icone size={28} />
                                <h4>{activityCounts[item.key]} {item.titulo}</h4>
                                <span className="activity-link">VER DETALHES</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="home-section">
                    <h3 className="section-title">GUIA RÁPIDO DE UTILIZAÇÃO</h3>
                    <div className="quick-guide-container">
                        <p className="guide-instruction">
                            Para solicitar material, use o menu <strong>NOVA REQUISIÇÃO</strong>.
                        </p>
                        <p className="guide-instruction">
                            Para criar um Evento, use o menu <strong>NOVO EVENTO</strong>.
                        </p>
                        <p className="guide-instruction">
                            Para acompanhar aprovações e o estado dos pedidos (Verde/Vermelho), consulte o seu <strong>PERFIL</strong>.
                        </p>
                    </div>
                </section>
                
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-project-esp">
                            {projetoAtual === 'Sem requisição ativa' ? 'SEM PROJETO ATIVO' : `PROJETO: ${projetoAtual}`}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;