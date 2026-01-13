import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft } from 'lucide-react'; 
import MapPicker from './MapPicker'; 
import './EventoForm.css'; 
import '../Pages/Perfil.css'; 
import logo from '../assets/img/esposende.png'; 

const EventoForm = ({ onLogout }) => {
    const navigate = useNavigate();
    
    // Estado para campos de texto
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        localizacao: '',
        data_inicio: '',
        hora_inicio: '',
        data_fim: '',
        hora_fim: '',
    });

    // Estado para os ficheiros 
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Função para receber a morada do mapa e atualizar o campo de localização
    const handleLocationSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            localizacao: locationData.address
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setSelectedFiles(e.target.files);
    };

   const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (!user.id && !user.id_user)) {
        alert("Sessão expirada. Faça login novamente.");
        return;
    }

    const formDataToSend = new FormData();
    
    // Campos de texto
    formDataToSend.append('nome_evento', formData.nome);
    formDataToSend.append('descricao', formData.descricao);
    formDataToSend.append('localizacao', formData.localizacao);
    formDataToSend.append('data_inicio', formData.data_inicio);
    formDataToSend.append('data_fim', formData.data_fim || formData.data_inicio);
    formDataToSend.append('id_user', user.id || user.id_user);

    // Adicionar múltiplos ficheiros (Anexos)
    if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
            formDataToSend.append('anexos', selectedFiles[i]);
        }
    }

    try {
        const response = await fetch('http://localhost:3002/api/eventos', { 
            method: 'POST',
            body: formDataToSend, 
        });

        if (response.ok) {
            alert(`Sucesso! Evento criado.`);
            navigate('/home');
        } else {
            const errorData = await response.json();
            alert(`Falha: ${errorData.error || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error("Erro ao submeter:", error);
        alert('Erro de conexão ao servidor.');
    }
};
    const handleCancel = () => navigate('/home');
    
    const handleLogout = () => {
        if (onLogout) onLogout();
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
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/novo-evento" className="nav-item-esp active-tab-indicator">NOVO EVENTO</Link> 
                    </nav>

                    <div className="header-icons-esp">
                        <ShoppingCart size={24} className="icon-esp" />
                        <Link to="/perfil"> <User size={24} className="icon-esp" /> </Link>
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
                                <div className="form-group full-width">
                                    <label>Nome do evento *</label>
                                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
                                </div>
                                <div className="form-group full-width">
                                    <label>Descrição do Evento *</label>
                                    <textarea name="descricao" value={formData.descricao} onChange={handleChange} required></textarea>
                                </div>
                                <div className="form-group full-width">
                                    <label>Localização (Clique no mapa) *</label>
                                    <input 
                                        type="text" 
                                        name="localizacao" 
                                        value={formData.localizacao} 
                                        readOnly
                                        onChange={handleChange} 
                                        placeholder="Selecione no mapa ao lado..."
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="map-column-layout">
                                <div className="map-image-placeholder-layout">
                                    {/* COMPONENTE DO MAPA LEAFLET */}
                                    <MapPicker onLocationSelect={handleLocationSelect} />
                                </div>
                            </div>
                        </div>

                        <div className="date-time-row-layout">
                            <div className="form-group date-time-group"><label>Data de início *</label><input type="date" name="data_inicio" value={formData.data_inicio} onChange={handleChange} required /></div>
                            <div className="form-group date-time-group"><label>Hora de início</label><input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange} /></div>
                            <div className="form-group date-time-group"><label>Data de fim</label><input type="date" name="data_fim" value={formData.data_fim} onChange={handleChange} /></div>
                            <div className="form-group date-time-group"><label>Hora de fim</label><input type="time" name="hora_fim" value={formData.hora_fim} onChange={handleChange} /></div>
                        </div>

                        <div className="form-group full-width attachments-row-layout">
                            <label>Anexos / Documentos de Apoio (Plantas, Licenças)</label>
                            {/* INPUT DE FICHEIROS ATIVADO */}
                            <input 
                                type="file" 
                                name="anexos" 
                                multiple 
                                onChange={handleFileChange} 
                                className="file-input-field"
                            />
                        </div>

                        <div className="form-actions-layout">
                            <button type="button" onClick={handleCancel} className="btn btn-cancelar-layout">CANCELAR</button>
                            <button type="submit" className="btn btn-submeter-layout">SUBMETER</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EventoForm;