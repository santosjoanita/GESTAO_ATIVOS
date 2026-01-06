import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft } from 'lucide-react';
import './Requisicao.css';
import logo from '../../assets/img/esposende.png'; 

const Requisicao = () => {
    const [eventos, setEventos] = useState([]);
    const [formData, setFormData] = useState({ id_evento: '' });
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id_user || user?.id;

    useEffect(() => {
        fetch('http://localhost:3001/api/eventos/lista-simples')
            .then(res => res.json())
            .then(data => setEventos(data))
            .catch(err => console.error("Erro ao carregar eventos"));
    }, []);

    const handleSubmeter = async (e) => {
        e.preventDefault();

        if (!userId) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }

        if (!formData.id_evento) {
            alert("Selecione um evento.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/requisicoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_evento: parseInt(formData.id_evento),
                    id_user: userId
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detalhes || "Erro no servidor");
            }

            alert("Requisição criada com sucesso!");
            navigate('/perfil'); 
        } catch (err) {
            console.error("Erro:", err);
            alert(`Erro: ${err.message}`);
        }
    };

    return (
        <div className="requisicao-page-layout">
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
                        <ShoppingCart size={24} className="icon-esp" />
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
                            <label>Evento Associado *</label>
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
                        </div>
                        <div className="req-field-group">
                            <label>Período de Reserva</label>
                            <input type="text" value="Definido pelo Evento" disabled className="input-disabled" />
                        </div>
                        <div className="req-button-row">
                            <button type="button" className="btn-cancelar" onClick={() => navigate('/home')}>CANCELAR</button>
                            <button type="submit" className="btn-submeter">CRIAR REQUISIÇÃO</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Requisicao;