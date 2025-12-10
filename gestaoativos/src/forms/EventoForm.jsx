import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft } from 'lucide-react'; 
import './EventoForm.css'; 
import '../Pages/Perfil.css'; 
import logo from '../assets/img/esposende.png'; 
import MapaImage from '../assets/img/mapa.jpg'; 

const EventoForm = ({ onLogout }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        localizacao: '',
        data_inicio: '',
        hora_inicio: '',
        data_fim: '',
        hora_fim: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:3001/api/eventos', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: formData.nome,
                    descricao: formData.descricao,
                    localizacao: formData.localizacao,
                    data_inicio: formData.data_inicio,
                    hora_inicio: formData.hora_inicio,
                    data_fim: formData.data_fim,
                    hora_fim: formData.hora_fim,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Sucesso! ${data.message} ID: ${data.eventId}`);
                navigate('/perfil');
            } else {
                const errorData = await response.json();
                alert(`Falha ao criar evento: ${errorData.message}`);
            }
            
        } catch (error) {
            alert('Erro de conexão ao servidor. Verifique se o auth-service está ativo.');
        }
    };

    const handleCancel = () => {
        navigate('/perfil');
    };
    
    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigate('/'); 
    };

    return (
        <div className="form-page-layout">
            
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp">
                        <img src={logo} alt="Logo Esposende" className="logo-img" />
                    </div>
                    
                    <nav className="header-nav-esp">
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/perfil" className="nav-item-esp">PÁGINA INICIAL</Link>
                        <Link to="/novo-evento" className="nav-item-esp active-tab-indicator">NOVO EVENTO</Link> 
                    </nav>

                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <User size={24} className="icon-esp" /> 
                        <button onClick={handleLogout} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-form-content">
                <div className="form-modal-container"> 
                    
                    <form onSubmit={handleSubmit} className="event-form-grid">
                        
                        <h2 className="form-title">NOVO PEDIDO DE EVENTO</h2>
                        
                        <div className="input-map-container-layout">
                            
                            <div className="input-column-layout">
                                <div className="form-group full-width"><label>Nome do evento *</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} required /></div>
                                <div className="form-group full-width"><label>Descrição do Evento *</label><textarea name="descricao" value={formData.descricao} onChange={handleChange} required></textarea></div>
                                <div className="form-group full-width"><label>Localização *</label><input type="text" name="localizacao" value={formData.localizacao} onChange={handleChange} required /></div>
                            </div>

                            <div className="map-column-layout">
                                <div className="map-image-placeholder-layout">
                                    <img src={MapaImage} alt="Mapa de Esposende" className="map-image-content"/>
                                </div>
                            </div>
                        </div>

                        <div className="date-time-row-layout">
                            <div className="form-group date-time-group"><label>Data de início *</label><input type="date" name="data_inicio" value={formData.data_inicio} onChange={handleChange} required /></div>
                            <div className="form-group date-time-group"><label>Hora de início *</label><input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange} /></div>
                            <div className="form-group date-time-group"><label>Data de fim *</label><input type="date" name="data_fim" value={formData.data_fim} onChange={handleChange} /></div>
                            <div className="form-group date-time-group"><label>Hora de fim *</label><input type="time" name="hora_fim" value={formData.hora_fim} onChange={handleChange} /></div>
                        </div>

                        <div className="form-group full-width attachments-row-layout">
                            <label>Anexos/Documentos de Apoio</label>
                            <input type="file" name="anexos" disabled title="Implementação de ficheiros será feita depois." />
                        </div>

                        <div className="form-actions-layout">
                            <button type="button" onClick={handleCancel} className="btn btn-cancelar-layout">CANCELAR</button>
                            <button type="submit" className="btn btn-submeter-layout">SUBMETER</button>
                        </div>
                    </form>
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-lang-esp">PT | EN</span>
                        <button className="explore-button-esp">EXPLORAR MATERIAL</button>
                        <span className="footer-project-esp">
                            Sem requisição ativa
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EventoForm;