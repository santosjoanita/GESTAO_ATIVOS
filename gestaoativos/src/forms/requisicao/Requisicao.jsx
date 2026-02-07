import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft } from 'lucide-react';
import './Requisicao.css';
import logo from '../../assets/img/esposende.png'; 
import Toast from '../../components/Toast';

const Requisicao = ({ onLogout }) => {
    const navigate = useNavigate();
    const [eventos, setEventos] = useState([]);
    const [formData, setFormData] = useState({ id_evento: '' });
    const [toast, setToast] = useState(null);
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id_user || user?.id;
    const isGestor = user?.id_perfil === 2;

    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': user?.token ? `Bearer ${user.token}` : ''
        };
    };

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        fetch('http://localhost:3002/api/requisicoes/eventos-disponiveis', { headers: getAuthHeaders() })
            .then(res => {
                if (!res.ok) throw new Error("Erro de permissão ou rede");
                return res.json();
            })
            .then(data => setEventos(data))
            .catch(err => console.error("Erro ao carregar eventos:", err));
    }, []);

    const handleSubmeter = async (e) => {
        e.preventDefault();

        if (!userId) {
            setToast({ type: 'error', message: "Sessão expirada. Faça login novamente." });
            return;
        }

        if (!formData.id_evento) {
            setToast({ type: 'warning', message: "Selecione um evento para continuar." });
            return;
        }

        try {
            const response = await fetch('http://localhost:3002/api/requisicoes', {
                method: 'POST',
                headers: getAuthHeaders(), 
                body: JSON.stringify({
                    id_evento: parseInt(formData.id_evento),
                    id_user: userId,
                    descricao: "Requisição criada via Web"
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detalhes || errData.erro || "Erro no servidor");
            }
            
            setToast({ type: 'success', message: "Requisição criada com sucesso!" });

            setTimeout(() => {
                navigate('/perfil');
            }, 1500);

        } catch (err) {
            console.error("Erro:", err);
            setToast({ type: 'error', message: `Erro: ${err.message}` });
        }
    };

    const handleLogout = () => {

        localStorage.clear();

        if (onLogout) onLogout();

        navigate('/');

    };

    return (
        <div className="requisicao-page-layout">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp" onClick={() => navigate('/home')} style={{cursor:'pointer'}}>
                        <img src={logo} alt="Logo" className="logo-img" />
                    </div>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                        <Link to="/nova-requisicao" className="nav-item-esp active-tab-indicator">NOVA REQUISIÇÃO</Link> 
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

                        {/* Ícones de Navegação */}
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

            <main className="requisicao-main-centered">
                <div className="requisicao-white-card">
                    <h2 className="requisicao-card-title">NOVA REQUISIÇÃO</h2>
                    <form onSubmit={handleSubmeter}>
                        <div className="req-field-group">
                            <label>Evento Aprovado *</label>
                            <select 
                                required 
                                value={formData.id_evento}
                                onChange={(e) => setFormData({id_evento: e.target.value})}
                            >
                                <option value="">Selecione um evento...</option>
                                {eventos.map(ev => (
                                    <option key={ev.id_evento} value={ev.id_evento}>
                                        {ev.nome_evento}
                                    </option>
                                ))}
                            </select>
                            {eventos.length === 0 && (
                                <small style={{color: 'red', marginTop: '5px'}}>
                                    Não tem eventos aprovados disponíveis.
                                </small>
                            )}
                        </div>
                        
                        <div className="req-field-group">
                            <label>Estado Inicial</label>
                            <input type="text" value="Pendente (Aguardar Aprovação)" disabled className="input-disabled" />
                        </div>

                        <div className="req-button-row">
                            <button type="button" className="btn-cancelar" onClick={() => navigate('/home')}>CANCELAR</button>
                            <button 
                                type="submit" 
                                style={{
                                    flex: 1,
                                    padding: 0,
                                    backgroundColor: '#1f4e79', 
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(31, 58, 82, 0.4)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '50px',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    marginTop: '40px',
                                    marginBottom: '30px'
                                }}
                                >
                                CRIAR REQUISIÇÃO
                                </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Requisicao;