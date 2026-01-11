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
    const [carrinhoCount, setCarrinhoCount] = useState(0);
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id_user : null;

    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;

    const fetchDashboardData = async () => {
        if (!userId) return;
        
        const headers = {
            'x-user-profile': user?.id_perfil?.toString(),
            'x-user-name': user?.nome
        };

        try {
            // Chamadas paralelas para otimizar o carregamento
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
            
            // Atualiza o número de itens no carrinho
            const itensCarrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            setCarrinhoCount(itensCarrinho.length);

        } catch (error) {
            console.error("Erro ao carregar dados da Home:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Atualiza a cada 30 segundos para manter as notificações frescas
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
                        <img src={logo} alt="Logo Esposende" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}} />
                    </div>
                    
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp active-tab-indicator">PÁGINA INICIAL</Link>
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>

                    <div className="header-icons-esp">
                        <div style={{position: 'relative', cursor: 'pointer'}} onClick={() => navigate('/carrinho')}>
                            <ShoppingCart size={24} className="icon-esp" />
                            {carrinhoCount > 0 && <span className="cart-badge-count">{carrinhoCount}</span>}
                        </div>
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
                
                {/* 1. NOTIFICAÇÕES DE PRAZOS */}
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
                                                    ? "A recolha dos materiais está atrasada. Por favor, verifique com o gestor." 
                                                    : "Por favor, prepare a recolha dos materiais para breve."}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="no-notifications">Não existem prazos críticos para os teus materiais.</p>
                        )}
                    </div>
                </section>
                
                {/* 2. PAINEL DE ATIVIDADE */}
                <section className="home-section">
                    <h3 className="section-title">O TEU PAINEL DE ATIVIDADE:</h3>
                    <div className="activity-panel-container">
                        {activityMap.map(item => (
                            <button 
                                key={item.key} 
                                onClick={() => navigate('/perfil')} 
                                className={`activity-card ${item.cor}`}
                            >
                                <item.icone size={28} />
                                <h4>{activityCounts[item.key]} {item.titulo}</h4>
                                <span className="activity-link">VER NO PERFIL</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="home-section">
                    <h3 className="section-title">DICAS RÁPIDAS</h3>
                    <div className="quick-guide-container">
                        <p className="guide-instruction">
                            Usa o <strong>CATÁLOGO</strong> para reservar materiais em requisições aprovadas.
                        </p>
                        <p className="guide-instruction">
                            Podes ver o estado (Pendente/Aprovado) de todos os teus pedidos no <strong>PERFIL</strong>.
                        </p>
                    </div>
                </section>
                
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-project-esp">
                            {eventoAtivo ? `REQUISIÇÃO ATIVA: ${eventoAtivo.nome.toUpperCase()}` : "SISTEMA DE GESTÃO - MUNICÍPIO DE ESPOSENDE"}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;