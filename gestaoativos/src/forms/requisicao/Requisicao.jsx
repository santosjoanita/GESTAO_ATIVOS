import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Search } from 'lucide-react';
import './Requisicao.css';
import logo from '../../assets/img/esposende.png'; 

const Requisicao = ({ onLogout }) => {
    const [eventos, setEventos] = useState([]);
    const [formData, setFormData] = useState({
        id_evento: '',
        periodo_reserva: 'automático',
        importar_id: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3001/api/eventos')
            .then(res => res.json())
            .then(data => setEventos(data))
            .catch(err => console.error("Erro ao carregar eventos"));
    }, []);

    const handleSubmeter = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        
        try {
            const response = await fetch('http://localhost:3001/api/requisicoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_evento: formData.id_evento,
                    id_user: user?.id || 1,
                    notas: `Importar: ${formData.importar_id}`
                })
            });

            if (response.ok) {
                const eventoNome = eventos.find(ev => ev.id_evento == formData.id_evento)?.nome_evento;
                localStorage.setItem('projeto_ativo', eventoNome);
                window.dispatchEvent(new Event('storage'));
                navigate('/home');
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="requisicao-page-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp"><img src={logo} alt="Logo" className="logo-img" /></div>
                    <nav className="header-nav-esp">
                        <Link to="/nova-requisicao" className="nav-item-esp active-tab-indicator">NOVA REQUISIÇÃO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link> 
                        <Link to="/novo-evento" className="nav-item-esp">NOVO EVENTO</Link>
                    </nav>
                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
                        <button onClick={() => { localStorage.removeItem('user'); navigate('/'); }} className="logout-btn">
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
                                onChange={(e) => setFormData({...formData, id_evento: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {eventos.map(ev => (
                                    <option key={ev.id_evento} value={ev.id_evento}>{ev.nome_evento}</option>
                                ))}
                            </select>
                        </div>

                        <div className="req-field-group">
                            <label>Período de Reserva (automático)</label>
                            <input type="text" value="automático" disabled className="input-disabled" />
                        </div>

                        <div className="req-field-group">
                            <label>Importar Requisição</label>
                            <select 
                                value={formData.importar_id}
                                onChange={(e) => setFormData({...formData, importar_id: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {/* Aqui poderias carregar requisições antigas para duplicar */}
                            </select>
                        </div>

                        <div className="req-button-row">
                            <button type="button" className="btn-cancelar" onClick={() => navigate('/home')}>CANCELAR</button>
                            <button type="submit" className="btn-submeter">SUBMETER</button>
                        </div>
                    </form>
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp" onClick={() => navigate('/explorar-material')}>
                            <Search size={16} /> EXPLORAR MATERIAL
                        </button>
                        <span className="footer-project-esp">SEM REQUISIÇÃO ATIVA</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Requisicao;