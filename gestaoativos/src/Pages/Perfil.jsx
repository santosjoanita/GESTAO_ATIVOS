import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CornerDownLeft, Package, Edit, RotateCcw } from 'lucide-react';
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

const EventCard = ({ event, isExpanded, onToggle, onEditar, onDevolver, isRequisicao, materiais }) => {
    
    // Estados baseados na nova BD (1=Pendente, 2=Aprovada, 3=Recusada, 4=Em Curso, 5=Finalizada, 6=Cancelada)
    const isPendente = event.id_estado_req === 1;
    const isEmCurso = event.id_estado_req === 4;
    const isFinalizada = event.id_estado_req === 5;
    const isCancelada = event.id_estado_req === 6;

    const isEventoValido = event.data_fim 
        ? new Date(event.data_fim) >= new Date(new Date().setHours(0,0,0,0)) 
        : true;

    return (
        <div className={`event-card ${event.colorClass} ${isExpanded ? 'expanded' : ''}`}>
            <div className="event-header-row" onClick={onToggle}>
                <div>
                    <p className="event-title">{event.title} <span className="status-tag">({event.status})</span></p>
                    {!isRequisicao && (
                        <p className="event-date">
                            Data: {event.date} {event.data_fim ? ` até ${formatDate(event.data_fim)}` : ''}
                        </p>
                    )}
                    {isRequisicao && event.data_fim && (
                         <p className="event-date" style={{fontSize: '0.8em', color: '#666'}}>
                            Válido até: {formatDate(event.data_fim)}
                            {!isEventoValido && !isFinalizada && !isCancelada && <span style={{color: 'red', marginLeft: '5px'}}>(Expirado)</span>}
                         </p>
                    )}
                </div>
                <div className="event-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                    
                    {/* --- BOTÃO EDITAR (Só se for Pendente) --- */}
                    {isRequisicao && isPendente && isEventoValido && (
                        <button className="edit-button-esp btn-pendente" onClick={onEditar}>
                            <Edit size={14} /> EDITAR
                        </button>
                    )}

                    {/* --- BOTÃO DEVOLVER (Só se estiver Em Curso) --- */}
                    {isRequisicao && isEmCurso && (
                        <button className="edit-button-esp btn-devolver" onClick={onDevolver} style={{backgroundColor: '#e67e22'}}>
                            <RotateCcw size={14} /> DEVOLVER
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
                        
                        {isRequisicao && (
                            <div className="materiais-container-perfil" style={{marginTop: '15px'}}>
                                <p style={{fontWeight: '800', fontSize: '13px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                    <Package size={16} /> MATERIAIS REQUISITADOS:
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
};

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

    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;

    const getAuthHeaders = () => {
        const storedData = localStorage.getItem('user');
        const userData = storedData ? JSON.parse(storedData) : null;
        return {
            'Content-Type': 'application/json',
            'Authorization': userData && userData.token ? `Bearer ${userData.token}` : ''
        };
    };

    const fetchPerfilData = async () => {
        if (!user) return;
        try {
            const [resReq, resEv] = await Promise.all([
                fetch(`http://localhost:3002/api/requisicoes/user/${user.id_user || user.id}`, { headers: getAuthHeaders() }),
                fetch(`http://localhost:3002/api/eventos/user/${user.id_user || user.id}`, { headers: getAuthHeaders() })
            ]);
            
            const dataReq = await resReq.json();
            const dataEv = await resEv.json();

            const getStatusColor = (status) => {
                const s = (status || '').toString().toLowerCase(); 
                if (s.includes('aprovad')) return 'aprovado';
                if (s.includes('rejeitad')) return 'rejeitado'; 
                if (s.includes('em curso')) return 'em-curso';
                if (s.includes('finalizad')) return 'finalizado';
                if (s.includes('cancelad')) return 'cancelado';
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
                    id_estado_req: r.id_estado_req, // IMPORTANTE: Guardar o ID do estado
                    localizacao: r.localizacao,
                    data_fim: r.data_fim, 
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
        } catch (error) { console.error("Erro ao carregar perfil:", error); }
    };

    const fetchMateriaisReq = async (idReq) => {
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${idReq}/materiais`, { headers: getAuthHeaders() });
            const data = await res.json();
            setMateriaisCard(data);
        } catch (err) { console.error(err); }
    };

    const handleDevolver = async (idReq) => {
        if (!window.confirm("Tem a certeza que deseja devolver os materiais e finalizar esta requisição?")) return;

        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${idReq}/estado`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id_estado: 5 }) // 5 = Finalizada
            });

            if (res.ok) {
                alert("Materiais devolvidos com sucesso!");
                fetchPerfilData(); // Recarrega a lista
            } else {
                alert("Erro ao devolver materiais.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        }
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
                        </>
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
                    {['todos', 'pendente', 'aprovada', 'em curso', 'finalizada'].map(estado => (
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
                                onDevolver={() => handleDevolver(item.id_orig)}
                                onEditar={() => { 
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
                         eventoAtivo ? `A EDITAR REQUISIÇÃO: ${eventoAtivo.nome.toUpperCase()}` : "SEM REQUISIÇÃO ATIVA"}
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Perfil;