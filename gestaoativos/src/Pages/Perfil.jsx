import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Perfil.css'; 
import logo from '../assets/img/esposende.png'; 

const formatDate = (dateString) => {
    if (!dateString) return 'Data não especificada';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const EventCard = ({ event, isExpanded, onToggle, onTrabalhar, isRequisicao, materiais }) => (
    <div className={`event-card ${event.colorClass} ${isExpanded ? 'expanded' : ''}`}>
        <div className="event-header-row" onClick={onToggle}>
            <div>
                <p className="event-title">{event.title} <span className="status-tag">({event.status})</span></p>
                {!isRequisicao && (
                    <p className="event-date">
                        Data: {event.date} {event.data_fim ? ` até ${formatDate(event.data_fim)}` : ''}
                    </p>
                )}
            </div>
            <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                {isRequisicao && (event.status.toLowerCase().includes('aprovad')) && (
                    <button className="edit-button-esp" onClick={onTrabalhar}>
                        TRABALHAR
                    </button>
                )}
                <div className="event-arrow-container">
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </div>
        </div>
        {isExpanded && (
            <div className="event-details">
                <h4 className="details-title">Detalhes:</h4>
                <div className="details-info-grid">
                    <p><strong>Localização:</strong> {event.localizacao || 'Esposende (Centro)'}</p>
                    
                    {/* Listagem de Materiais exclusiva para Requisições */}
                    {isRequisicao && (
                        <div className="materiais-container-perfil" style={{marginTop: '15px'}}>
                            <p style={{fontWeight: '800', fontSize: '13px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <Package size={16} /> MATERIAIS NO PEDIDO:
                            </p>
                            {materiais && materiais.length > 0 ? (
                                <ul style={{listStyle: 'none', padding: '10px 0'}}>
                                    {materiais.map((m, idx) => (
                                        <li key={idx} style={{fontSize: '12px', padding: '5px 0', borderBottom: '1px solid #eee'}}>
                                            • {m.nome} — <strong>{m.quantidade} un.</strong>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{fontSize: '12px', color: '#777', padding: '5px 0'}}>Nenhum material adicionado a esta requisição.</p>
                            )}
                        </div>
                    )}

                    {!isRequisicao && (
                        <p style={{marginTop: '10px', color: '#1f4e79', fontWeight: 'bold'}}>
                            Existem {event.num_requisicoes || 0} requisições neste evento.
                        </p>
                    )}
                </div>
            </div>
        )}
    </div>
);

const Perfil = ({ onLogout }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const isGestor = user?.id_perfil === 2;
    const navigate = useNavigate();

    const [eventsList, setEventsList] = useState([]);
    const [requisicoesList, setRequisicoesList] = useState([]);
    const [activeTab, setActiveTab] = useState('todos'); 
    const [expandedCardId, setExpandedCardId] = useState(null); 
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [materiaisCard, setMateriaisCard] = useState([]);

    // Uniformização da Requisicão Ativa
    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;

    const getAuthHeaders = () => ({
        'x-user-profile': user?.id_perfil?.toString(),
        'x-user-name': user?.nome
    });

    const fetchPerfilData = async () => {
        if (!user) return;
        try {
            const [resReq, resEv] = await Promise.all([
                fetch(`http://localhost:3002/api/requisicoes/user/${user.id_user}`, { headers: getAuthHeaders() }),
                fetch(`http://localhost:3002/api/eventos/user/${user.id_user}`, { headers: getAuthHeaders() })
            ]);
            
            const dataReq = await resReq.json();
            const dataEv = await resEv.json();

            const getStatusColor = (status) => {
                const s = (status || '').toString().toLowerCase(); 
                if (s.includes('aprovad')) return 'aprovado';
                if (s.includes('rejeitad')) return 'rejeitado'; 
                return 'pendente';
            };

            const reqComNumeracao = Array.isArray(dataReq) ? dataReq.map((r, index, array) => {
                const doMesmoEvento = array.filter(item => item.id_evento === r.id_evento);
                const ordem = doMesmoEvento.sort((a,b) => a.id_req - b.id_req).findIndex(item => item.id_req === r.id_req) + 1;
                return {
                    id: `req-${r.id_req}`, 
                    id_orig: r.id_req,
                    isRequisicao: true,
                    title: `${r.nome_evento} - Requisição ${ordem}`,
                    status: r.estado_nome || 'Pendente',
                    localizacao: r.localizacao,
                    colorClass: getStatusColor(r.estado_nome)
                };
            }) : [];

            setRequisicoesList(reqComNumeracao);

            const eventosComContagem = Array.isArray(dataEv) ? dataEv.map(e => ({
                id: `ev-${e.id_evento}`,
                isRequisicao: false,
                title: e.nome_evento,
                date: formatDate(e.data_inicio),
                data_fim: e.data_fim,
                status: e.estado_nome,
                localizacao: e.localizacao, 
                num_requisicoes: Array.isArray(dataReq) ? dataReq.filter(r => r.id_evento === e.id_evento).length : 0,
                colorClass: getStatusColor(e.estado_nome)
            })) : [];

            setEventsList(eventosComContagem);
        } catch (error) { console.error(error); }
    };

    const fetchMateriaisReq = async (idReq) => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${idReq}/materiais`, { headers: getAuthHeaders() });
            const data = await res.json();
            setMateriaisCard(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { 
        if (!user) navigate('/');
        else fetchPerfilData(); 
    }, []);

    const handleToggle = (item) => {
        if (expandedCardId === item.id) {
            setExpandedCardId(null);
            setMateriaisCard([]);
        } else {
            setExpandedCardId(item.id);
            if (item.isRequisicao) fetchMateriaisReq(item.id_orig);
        }
    };

    const displayItems = (() => {
        let list = activeTab === 'eventos' ? eventsList : 
                   activeTab === 'requisicoes' ? requisicoesList : 
                   [...eventsList, ...requisicoesList];

        if (filtroEstado !== 'todos') {
            list = list.filter(item => (item.status || '').toLowerCase().includes(filtroEstado.substring(0, 5)));
        }
        return list;
    })();

    return (
        <div className="perfil-page-app">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        {isGestor ? (
                            <><Link to="/gestao" className="nav-item-esp">PAINEL DE GESTÃO</Link>
                            <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link></>
                        ) : (
                            <><Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                            <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                            <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link></>
                        )}
                    </nav>
                   <div className="header-icons-esp">
                        <Link to="/carrinho"><ShoppingCart size={24} className="icon-esp" /></Link>
                        <User size={24} className="icon-esp active-icon-indicator" />
                        <button onClick={() => {localStorage.clear(); navigate('/')}} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content-esp">
                <div className="user-panel-esp">
                    <div className="user-avatar-esp"></div>
                    <div>
                        <h2 className="user-title-esp">Olá, {user?.nome}.</h2>
                        <p className="user-email-esp">{user?.email}</p>
                    </div>
                </div>

                <div className="tabs-container-esp">
                    {['todos', 'eventos', 'requisicoes'].map(t => (
                        <button key={t} className={`tab-button-esp ${activeTab === t ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab(t)}>
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="status-filter-bar-esp">
                    {['todos', 'pendente', 'aprovado', 'rejeitado'].map(estado => (
                        <button key={estado} className={`status-filter-btn ${filtroEstado === estado ? 'active-status' : ''}`} onClick={() => setFiltroEstado(estado)}>
                            {estado.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="list-items-container-esp">
                    {displayItems.length > 0 ? (
                        displayItems.map(item => (
                            <EventCard 
                                key={item.id} 
                                event={item} 
                                isRequisicao={item.isRequisicao}
                                isExpanded={expandedCardId === item.id} 
                                materiais={materiaisCard}
                                onToggle={() => handleToggle(item)}
                                onTrabalhar={() => { 
                                    localStorage.setItem('evento_trabalho', JSON.stringify({ id_req: item.id_orig, nome: item.title })); 
                                    navigate('/explorar'); 
                                }} 
                            />
                        ))
                    ) : <p className="no-items-msg">Nenhum item encontrado.</p>}
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <span className="footer-project-esp">
                        {isGestor ? "PAINEL ADMINISTRATIVO" : 
                         eventoAtivo ? `A TRABALHAR NA REQUISIÇÃO: ${eventoAtivo.nome.toUpperCase()}` : "SEM REQUISIÇÃO ATIVA"}
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Perfil;