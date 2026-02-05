import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserMinus, UserCheck, CornerDownLeft, User, MapPin, HelpCircle } from 'lucide-react';
import logo from '../../assets/img/esposende.png';
import './AdminDashboard.css';
import Toast from '../../components/Toast'; 
import ModalConfirmacao from '../../components/ModalConfirmacao';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('utilizadores');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); 
    const user = JSON.parse(localStorage.getItem('user'));

    const [modalPerfil, setModalPerfil] = useState({ 
        isOpen: false, 
        user: null, 
        novoPerfil: null 
    });

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${user?.token}`,
        'Content-Type': 'application/json'
    });

    const fetchData = async (tab) => {
        setLoading(true);
        let endpoint = '';
        if (tab === 'utilizadores') endpoint = 'http://localhost:3002/api/utilizadores';
        if (tab === 'eventos') endpoint = 'http://localhost:3002/api/utilizadores/admin/eventos';
        if (tab === 'requisições') endpoint = 'http://localhost:3002/api/utilizadores/admin/requisicoes';

        try {
            const res = await fetch(endpoint, { headers: getAuthHeaders() });
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error("Erro:", err);
            setData([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(activeTab); }, [activeTab]);

    const solicitarMudancaPerfil = (utilizador, idNovoPerfil) => {
        const perfis = { 1: 'Admin', 2: 'Gestor', 3: 'Funcionário', 4: 'Convidado' };
        setModalPerfil({
            isOpen: true,
            user: utilizador,
            novoPerfil: { id: idNovoPerfil, nome: perfis[idNovoPerfil] }
        });
    };

    const confirmarMudancaNoBackend = async () => {
        try {
            const response = await fetch(`http://localhost:3002/api/utilizadores/${modalPerfil.user.id_user}/perfil`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id_perfil: modalPerfil.novoPerfil.id })
            });

            if (response.ok) {
                setToast({ type: 'success', message: `Perfil de ${modalPerfil.user.nome} alterado!` });
                fetchData('utilizadores'); 
            }
        } catch (error) {
            setToast({ type: 'error', message: "Erro ao mudar perfil." });
        } finally {
            setModalPerfil({ isOpen: false, user: null, novoPerfil: null });
        }
    };

    const handleToggleAtivo = async (userId, estadoAtual) => {
        try {
            const res = await fetch(`http://localhost:3002/api/utilizadores/${userId}/estado`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ativo: estadoAtual === 1 ? 0 : 1 })
            });
            if (res.ok) fetchData('utilizadores');
        } catch (err) { console.error(err); }
    };

    const getStatusClass = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('aprov') || s.includes('agend')) return 'aprovado';
        if (s.includes('rejeit') || s.includes('cancel')) return 'rejeitado';
        return 'pendente';
    };

    return (
        <div className="admin-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <ModalConfirmacao 
                isOpen={modalPerfil.isOpen} 
                onCancel={() => setModalPerfil({ ...modalPerfil, isOpen: false })} 
                onConfirm={confirmarMudancaNoBackend} 
                title="Alterar Perfil de Acesso" 
                message={`Tem a certeza que quer mudar ${modalPerfil.user?.nome} para ${modalPerfil.novoPerfil?.nome}?`} 
                confirmText="Mudar Perfil" 
                confirmColor="#1f4e79" 
            />

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} className="logo-img" onClick={() => navigate('/explorar')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        <button className={`nav-item-esp ${activeTab === 'utilizadores' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('utilizadores')}>UTILIZADORES</button>
                        <button className={`nav-item-esp ${activeTab === 'eventos' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('eventos')}>EVENTOS</button>
                        <button className={`nav-item-esp ${activeTab === 'requisições' ? 'active-tab-indicator' : ''}`} onClick={() => setActiveTab('requisições')}>REQUISIÇÕES</button>
                    </nav>
                    <div className="header-icons-esp">
                        <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="admin-main">
                <div className="admin-container">
                    <div className="admin-welcome">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1>Painel de Administração</h1>
                            <div className="tooltip-container">
                                <HelpCircle size={20} className="help-icon-admin" />
                                <div className="tooltip-popup admin-perfis">
                                    <h4>Privilégios por Perfil:</h4>
                                    <ul>
                                        <li><strong>Admin:</strong> Gestão total de utilizadores e auditoria global.</li>
                                        <li><strong>Gestor:</strong> Aprovação de pedidos, gestão de stock e eventos.</li>
                                        <li><strong>Funcionário:</strong> Criar requisições e consultar catálogo.</li>
                                        <li><strong>Convidado:</strong> Apenas consulta e visualização limitada.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <p>Gestão de acessos e monitorização global do sistema.</p>
                    </div>

                    <div className="admin-table-wrapper">
                        {loading ? (
                            <div style={{padding: '20px', textAlign: 'center'}}>A carregar dados...</div>
                        ) : (
                            <table>
                                <thead>
                                    {activeTab === 'utilizadores' && (
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Perfil</th>
                                            <th>Estado</th>
                                            <th>Ações</th>
                                        </tr>
                                    )}
                                    {activeTab === 'eventos' && (
                                        <tr>
                                            <th>Evento</th>
                                            <th>Responsável</th>
                                            <th>Início</th>
                                            <th>Fim</th>
                                            <th>Localização</th>
                                        </tr>
                                    )}
                                    {activeTab === 'requisições' && (
                                        <tr>
                                            <th>#ID</th>
                                            <th>Evento</th>
                                            <th>Requisitante</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {activeTab === 'utilizadores' && data.map(u => (
                                        <tr key={u.id_user} className={u.ativo === 0 ? 'row-disabled' : ''}>
                                            <td><strong>{u.nome}</strong></td>
                                            <td>{u.email}</td>
                                            <td>
                                                <select 
                                                    value={u.id_perfil} 
                                                    onChange={(e) => solicitarMudancaPerfil(u, e.target.value)}
                                                    disabled={u.id_user === user.id_user}
                                                    className="admin-select"
                                                >
                                                    <option value="1">Admin</option>
                                                    <option value="2">Gestor</option>
                                                    <option value="3">Funcionário</option>
                                                    <option value="4">Convidado</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${u.ativo === 1 ? 'aprovado' : 'rejeitado'}`}>
                                                    {u.ativo === 1 ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="action-icon-btn" 
                                                    onClick={() => handleToggleAtivo(u.id_user, u.ativo)}
                                                    disabled={u.id_user === user.id_user}
                                                >
                                                    {u.ativo === 1 ? <UserMinus size={20} color="#e74c3c" /> : <UserCheck size={20} color="#27ae60" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* CONTEÚDO EVENTOS */}
                                    {activeTab === 'eventos' && data.map(e => (
                                        <tr key={e.id_evento}>
                                            <td><strong>{e.nome_evento}</strong></td>
                                            <td>{e.nome_utilizador}</td>
                                            <td>{new Date(e.data_inicio).toLocaleDateString('pt-PT')}</td>
                                            <td>{e.data_fim ? new Date(e.data_fim).toLocaleDateString('pt-PT') : '--/--/----'}</td>
                                            <td>
                                                {e.localizacao ? (
                                                    <a 
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.localizacao)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="map-link-admin"
                                                    >
                                                        <MapPin size={14} />
                                                        {e.localizacao.includes(',') ? 'Ver Coordenadas' : e.localizacao}
                                                    </a>
                                                ) : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'requisições' && data.map(r => (
                                        <tr key={r.id_req}>
                                            <td><strong>#{r.id_req}</strong></td>
                                            <td>{r.nome_evento}</td>
                                            <td>{r.nome_requisitante}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
            <footer className="admin-footer">
                <span>Gestão de Ativos - Município de Esposende</span>
            </footer>
        </div>
    );
};

export default AdminDashboard;