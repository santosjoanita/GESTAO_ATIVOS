import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft } from 'lucide-react';
import './Requisicao.css';
import logo from '../../assets/img/esposende.png'; 
import Toast from '../../components/Toast';

const Requisicao = () => {
    const [eventos, setEventos] = useState([]);
    const [formData, setFormData] = useState({ id_evento: '' });
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id_user || user?.id;

    const getAuthHeaders = () => {
        const storedData = localStorage.getItem('user');
        const userData = storedData ? JSON.parse(storedData) : null;
        return {
            'Content-Type': 'application/json',
            'Authorization': userData && userData.token ? `Bearer ${userData.token}` : ''
        };
    };

    useEffect(() => {
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
                    id_user: userId
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detalhes || errData.erro || "Erro no servidor");
            }
            
            const resJson = await response.json();
            
            const eventoTrabalho = eventos.find(e => e.id_evento == formData.id_evento);
            
            localStorage.setItem('evento_trabalho', JSON.stringify({
                id_req: resJson.id_req, 
                nome: eventoTrabalho ? eventoTrabalho.nome_evento : 'Evento'
            }));

            
            setToast({ type: 'success', message: "Requisição criada! A redirecionar para o Catálogo..." });

            setTimeout(() => {
                navigate('/explorar');
            }, 1500);

        } catch (err) {
            console.error("Erro:", err);
            setToast({ type: 'error', message: `Erro: ${err.message}` });
        }
    };

    return (
        <div className="requisicao-page-layout">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp"><img src={logo} alt="Logo" className="logo-img" /></div>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                        <Link to="/nova-requisicao" className="nav-item-esp active-tab-indicator">NOVA REQUISIÇÃO</Link> 
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>
                    <div className="header-icons-esp">
                        <Link to="/carrinho"><ShoppingCart size={24} className="icon-esp" /></Link>
                        <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="logout-btn">
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
                                    Não tem eventos aprovados. Crie um evento primeiro e aguarde aprovação.
                                </small>
                            )}
                        </div>
                        <div className="req-field-group">
                            <label>Período de Reserva</label>
                            <input type="text" value="Definido automaticamente pelo Evento" disabled className="input-disabled" />
                        </div>
                        <div className="req-button-row">
                            <button type="button" className="btn-cancelar" onClick={() => navigate('/home')}>CANCELAR</button>
                            <button type="submit" className="btn-submeter">CRIAR & SELECIONAR MATERIAIS</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Requisicao;