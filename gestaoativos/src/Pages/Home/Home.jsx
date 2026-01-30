import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Bell, Calendar, Repeat, Search, CalendarPlus, UserCheck } from 'lucide-react';
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
    const token = user ? user.token : null;

    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;

    const fetchDashboardData = async () => {
        if (!userId || !token) return;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };

        try {
            const [resEv, resReq, resNotif] = await Promise.all([
               fetch(`http://localhost:3002/api/eventos/user/${userId}`, { headers }),
               fetch(`http://localhost:3002/api/requisicoes/user/${userId}`, { headers }),
               fetch(`http://localhost:3002/api/gestao/notificacoes/prazos/${userId}`, { headers })
            ]);

            if (resEv.status === 401 || resReq.status === 401) {
                localStorage.clear();
                navigate('/');
                return;
            }

            const dataEv = resEv.ok ? await resEv.json() : [];
            const dataReq = resReq.ok ? await resReq.json() : [];
            
            let dataNotif = [];
            if (resNotif.ok) {
                try { dataNotif = await resNotif.json(); } catch(e){}
            }

            setActivityCounts({
                eventosCount: Array.isArray(dataEv) ? dataEv.length : 0,
                requisicoesCount: Array.isArray(dataReq) ? dataReq.length : 0
            });

            setNotifications(Array.isArray(dataNotif) ? dataNotif : []);
            
            const itensCarrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            setCarrinhoCount(itensCarrinho.length);

        } catch (error) {
            console.error("Erro ao carregar dados da Home:", error);
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
    const calcularDiasRestantes = (dataFim) => {
    if (!dataFim) return 999;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const fim = new Date(dataFim);
    fim.setHours(0, 0, 0, 0);
    const diffTime = fim - hoje;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const notificacoesUrgentes = notifications.filter(n => {
        const dias = calcularDiasRestantes(n.data_fim);
        return dias >= 0 && dias <= 3;
    });

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
                <section className="home-section">
                    <h3 className="section-title"><Bell size={24} /> NOTIFICAÇÕES:</h3>
                      <div className="notifications-container">
                        {notificacoesUrgentes.length > 0 ? (
                            notificacoesUrgentes.map(n => {
                                const diasRestantes = calcularDiasRestantes(n.data_fim);
                                const classeUrgencia = diasRestantes <= 1 ? 'danger' : 'warning';

                                return (
                                    <div key={n.id_req} className={`notification-item-home ${classeUrgencia}`}>
                                        <div className="notification-content">
                                            <p>
                                                <strong>ATENÇÃO:</strong> O evento "{n.nome_evento}" acaba 
                                                {diasRestantes === 0 ? (
                                                    <strong> HOJE!</strong>
                                                ) : diasRestantes === 1 ? (
                                                    <strong> AMANHÃ!</strong>
                                                ) : (
                                                    <span> em <strong>{diasRestantes}</strong> dias.</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="no-notifications">Não existem prazos críticos para os seus materiais.</p>
                        )}
                    </div>
                </section>
                
                <section className="home-section">
                    <h3 className="section-title">O SEU PAINEL DE ATIVIDADE:</h3>
                    <div className="activity-panel-container">
                        {activityMap.map(item => (
                            <button key={item.key} onClick={() => navigate('/perfil')} className={`activity-card ${item.cor}`}>
                                <item.icone size={28} />
                                <h4>{activityCounts[item.key]} {item.titulo}</h4>
                                <span className="activity-link">VER NO PERFIL</span>
                            </button>
                        ))}
                    </div>
                </section>

               <section className="home-section">
                    <h3 className="section-title">GUIA RÁPIDO</h3>
                    <div className="quick-guide-grid">
                        
                        <div className="guide-card">
                            <CalendarPlus className="guide-icon" size={28} />
                            <p className="guide-step-title">1. CRIAR EVENTO</p>
                            <p className="guide-step-desc">
                                <strong>Passo obrigatório.</strong> Defina primeiro o nome e as datas do evento para poder associar materiais.
                            </p>
                        </div>

                        <div className="guide-card">
                            <Search className="guide-icon" size={28} />
                            <p className="guide-step-title">2. REQUISITAR</p>
                            <p className="guide-step-desc">
                                Aceda ao <strong>Catálogo</strong>, adicione os materiais necessários ao carrinho e finalize o pedido.
                            </p>
                        </div>

                        <div className="guide-card">
                            <UserCheck className="guide-icon" size={28} />
                            <p className="guide-step-title">3. APROVAÇÃO</p>
                            <p className="guide-step-desc">
                                O stock só fica <strong>reservado</strong> após aprovação do Gestor. Acompanha o estado no seu <strong>Perfil</strong>.
                            </p>
                        </div>

                    </div>
                </section>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-project-esp">
                            {eventoAtivo ? `REQUISIÇÃO ATIVA: ${eventoAtivo.nome.toUpperCase()}` : "MUNICÍPIO DE ESPOSENDE"}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;