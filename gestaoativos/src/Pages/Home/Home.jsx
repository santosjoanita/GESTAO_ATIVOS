import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Bell, Calendar, Repeat, Search, UserCheck } from 'lucide-react';
import './Home.css'; 
import logo from '../../assets/img/esposende.png';

const activityMap = [
    { key: 'eventosCount', titulo: "EVENTOS CRIADOS", cor: 'active', icone: Calendar },
    { key: 'requisicoesCount', titulo: "REQUISIÇÕES EFETUADAS", cor: 'pending', icone: Repeat },
];

const formatarData = (dataISO) => {
    if (!dataISO) return '---';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-PT');
};

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
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
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
            const cart = JSON.parse(localStorage.getItem('carrinho')) || [];
            setCarrinhoCount(cart.length);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [userId]);

    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/');
    };

    const calcularDiasRestantes = (dataFim) => {
        if (!dataFim) return 999;
        const hoje = new Date();
        const fim = new Date(dataFim);
        return Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="home-page-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}} />
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp active-tab-indicator">PÁGINA INICIAL</Link>
                    </nav>

                    <div className="header-icons-esp">
                        <div style={{position: 'relative', cursor: 'pointer'}} onClick={() => navigate('/carrinho')}>
                            <ShoppingCart size={24} className="icon-esp" />
                            {carrinhoCount > 0 && <span className="cart-badge-count">{carrinhoCount}</span>}
                        </div>
                        
                        <div className="user-profile-badge-esp">
                            <span className="user-name-text">{user?.nome?.split(' ')[0]}</span>
                            <span className={`role-tag ${user?.id_perfil === 2 ? 'role-gestor' : 'role-func'}`}>
                                {user?.id_perfil === 2 ? 'GESTOR' : 'FUNCIONÁRIO'}
                            </span>
                        </div>

                        <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
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
                            notifications.slice(0, 3).map(n => (
                                <div key={n.id_req} className="notification-item-home warning">
                                    <p>O evento <strong>{n.nome_evento}</strong> termina em breve ({formatarData(n.data_fim)}).</p>
                                </div>
                            ))
                        ) : <p className="no-notifications">Sem notificações.</p>}
                    </div>
                </section>
                
                <section className="home-section">
                    <h3 className="section-title">PAINEL DE ATIVIDADE:</h3>
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
            </main>
        </div>
    );
};

export default Home;