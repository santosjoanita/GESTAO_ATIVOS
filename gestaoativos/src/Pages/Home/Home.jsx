import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Bell, Calendar, Repeat } from 'lucide-react';
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
        
        const headers = {
            'x-user-profile': user?.id_perfil?.toString(),
            'x-user-name': user?.nome
        };

        try {
            const [resEv, resReq, resNotif] = await Promise.all([
               fetch(`http://localhost:3002/api/eventos/user/${userId}`, { headers }),
               fetch(`http://localhost:3002/api/requisicoes/user/${userId}`, { headers }),
               fetch(`http://localhost:3002/api/gestao/notificacoes/prazos/${userId}`, { headers })
            ]);

            const dataEv = await resEv.json();
            const dataReq = await resReq.json();
            const dataNotif = await resNotif.json();

            setActivityCounts({
                eventosCount: Array.isArray(dataEv) ? dataEv.length : 0,
                requisicoesCount: Array.isArray(dataReq) ? dataReq.length : 0
            });

            setNotifications(Array.isArray(dataNotif) ? dataNotif : []);
            setProjetoAtual(localStorage.getItem('projeto_ativo') || "Sem requisição ativa");

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); 
        return () => clearInterval(interval);
    }, [userId]);

    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/');
    };

    return (
        <div className="home-page-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp">
                        <img src={logo} alt="Logo Esposende" className="logo-img" />
                    </div>
                    
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp active-tab-indicator">PÁGINA INICIAL</Link>
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
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
                
                {/* 1. NOTIFICAÇÕES (3 DIAS PARA CADA LADO) */}
                <section className="home-section">
                    <h3 className="section-title"><Bell size={24} /> NOTIFICAÇÕES:</h3>
                    <div className="notifications-container">
                        {notifications.length > 0 ? (
                            notifications.map(n => {
                                const dias = n.dias_para_fim; 
                                const isExcedido = dias < 0;
                                const isHoje = dias === 0;

                                return (
                                    <div key={n.id_req} className={`notification-item-home ${isExcedido ? 'danger' : 'warning'}`}>
                                        <div className="notification-content">
                                            <p>
                                                <strong>{isExcedido ? 'PRAZO EXCEDIDO:' : 'ATENÇÃO:'}</strong> O evento "{n.nome_evento}" 
                                                {isHoje && " termina hoje!"}
                                                {isExcedido && ` terminou há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`}
                                                {!isExcedido && !isHoje && ` termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
                                                .
                                            </p>                                        
                                            <span>
                                                {isExcedido 
                                                    ? "A recolha dos materiais está atrasada. Por favor, verifique o estado." 
                                                    : "Por favor, verifique a recolha dos materiais em breve."}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="no-notifications">Não existem prazos críticos (3 dias de margem).</p>
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
                            {projetoAtual === 'Sem requisição ativa' ? 'SEM REQUISIÇÃO ATIVA' : `REQUISIÇÃO ${projetoAtual}`}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;