import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Bell, Calendar, Repeat, Search, CalendarPlus, UserCheck } from 'lucide-react';
import './Home.css'; 
import logo from '../../assets/img/esposende.png';

const Home = ({ onLogout }) => {
    const [notifications, setNotifications] = useState([]);
    const [activityCounts, setActivityCounts] = useState({ eventosCount: 0, requisicoesCount: 0 });
    const [carrinhoCount, setCarrinhoCount] = useState(0);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchDashboardData = async () => {
        if (!user) return;
        const headers = { 'Authorization': `Bearer ${user.token}` };
        try {
            const [resEv, resReq, resNotif] = await Promise.all([
               fetch(`http://localhost:3002/api/eventos/user/${user.id_user}`, { headers }),
               fetch(`http://localhost:3002/api/requisicoes/user/${user.id_user}`, { headers }),
               fetch(`http://localhost:3002/api/gestao/notificacoes/prazos/${user.id_user}`, { headers })
            ]);
            const dataEv = await resEv.json();
            const dataReq = await resReq.json();
            const dataNotif = await resNotif.json();
            setActivityCounts({ eventosCount: dataEv.length || 0, requisicoesCount: dataReq.length || 0 });
            setNotifications(Array.isArray(dataNotif) ? dataNotif : []);
            setCarrinhoCount((JSON.parse(localStorage.getItem('carrinho')) || []).length);
        } catch (e) { console.error(e); }
    };
    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/');

    };

    useEffect(() => { fetchDashboardData(); }, [user?.id_user]);

    return (
        <div className="home-page-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}} />
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp active-tab-indicator">PÁGINA INICIAL</Link>
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>
                    <div className="header-icons-esp">
                        <div className="user-profile-badge" style={{ marginRight: '15px', textAlign: 'right' }}>
                            <span style={{ color: 'white', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                                {user?.nome?.split(' ')[0]}
                            </span>
                            <span style={{ color: '#3498db', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>
                                {user?.id_perfil === 2 ? 'GESTOR' : 'FUNCIONÁRIO'}
                            </span>
                        </div>

                        <Link to="/carrinho">
                            <ShoppingCart size={24} className="icon-esp" />
                        </Link>
                        
                        <Link to="/perfil">
                            <User size={24} className="icon-esp active-icon-indicator" />
                        </Link>

                        <button onClick={handleLogout} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>
            <main className="main-home-content" style={{padding:'40px 20px', maxWidth:'1200px', margin:'0 auto'}}>
                <h3 className="section-title"><Bell size={24} /> NOTIFICAÇÕES:</h3>
                <div className="notifications-container">
                    {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id_req} className="notification-item-home warning" style={{padding:'15px', borderLeft:'6px solid #f39c12', background:'white', marginBottom:'10px'}}>
                            <p>A requisição "{n.nome_evento}" termina em breve ({new Date(n.data_fim).toLocaleDateString()}).</p>
                        </div>
                    )) : <p>Sem prazos críticos.</p>}
                </div>
                
                <h3 className="section-title">PAINEL DE ATIVIDADE:</h3>
                <div className="activity-panel-container" style={{display:'flex', gap:'20px', marginBottom:'40px'}}>
                    <button onClick={() => navigate('/perfil')} className="activity-card" style={{flex:1, padding:'40px', background:'white', border:'2px solid #1f4e79', borderRadius:'15px', cursor:'pointer'}}>
                        <Calendar size={32}/><h4>{activityCounts.eventosCount} EVENTOS</h4><span className="activity-link">VER NO PERFIL</span>
                    </button>
                    <button onClick={() => navigate('/perfil')} className="activity-card" style={{flex:1, padding:'40px', background:'white', border:'2px solid #1f4e79', borderRadius:'15px', cursor:'pointer'}}>
                        <Repeat size={32}/><h4>{activityCounts.requisicoesCount} REQUISIÇÕES</h4><span className="activity-link">VER NO PERFIL</span>
                    </button>
                </div>

                <h3 className="section-title">GUIA RÁPIDO:</h3>
                <div className="quick-guide-grid" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px'}}>
                    <div className="guide-card" style={{padding:'20px', background:'white', border:'1px solid #ddd', borderRadius:'8px', textAlign:'center'}}>
                        <CalendarPlus size={28}/><p className="guide-step-title">1. CRIAR EVENTO</p><p className="guide-step-desc">Defina as datas para poder associar materiais.</p>
                    </div>
                    <div className="guide-card" style={{padding:'20px', background:'white', border:'1px solid #ddd', borderRadius:'8px', textAlign:'center'}}>
                        <Search size={28}/><p className="guide-step-title">2. REQUISITAR</p><p className="guide-step-desc">Aceda ao Catálogo e adicione materiais ao carrinho.</p>
                    </div>
                    <div className="guide-card" style={{padding:'20px', background:'white', border:'1px solid #ddd', borderRadius:'8px', textAlign:'center'}}>
                        <UserCheck size={28}/><p className="guide-step-title">3. APROVAÇÃO</p><p className="guide-step-desc">O stock fica reservado após aprovação do Gestor.</p>
                    </div>
                </div>
            </main>
            <footer className="fixed-footer-esp" style={{background:'#1f3a52', color:'white', height:'50px', display:'flex', justifyContent:'center', alignItems:'center', position:'fixed', bottom:0, width:'100%'}}>
                <span className="footer-project-esp">Gestão de Ativos - Município de Esposende</span>
            </footer>
        </div>
    );
};

export default Home;