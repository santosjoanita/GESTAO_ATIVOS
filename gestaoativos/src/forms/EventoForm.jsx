import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Search, X } from 'lucide-react'; 
import MapPicker from './MapPicker'; 
import './EventoForm.css'; 
import '../Pages/Perfil.css'; 
import logo from '../assets/img/esposende.png'; 
import Toast from '../components/Toast';

const EventoForm = ({ onLogout }) => {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null); 
    const [isMapExpanded, setIsMapExpanded] = useState(false); // Estado para o modal do mapa
    
    const user = JSON.parse(localStorage.getItem('user'));
    const isGestor = user?.id_perfil === 2;

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        localizacao: '',
        data_inicio: '',
        hora_inicio: '',
        data_fim: '',
        hora_fim: '',
    });

    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleLocationSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            localizacao: locationData.address
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setSelectedFiles(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!user || (!user.id && !user.id_user)) {
            setToast({ type: 'error', message: "Sessão expirada. Faça login novamente." });
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('nome_evento', formData.nome);
        formDataToSend.append('descricao', formData.descricao);
        formDataToSend.append('localizacao', formData.localizacao);
        formDataToSend.append('data_inicio', formData.data_inicio);
        formDataToSend.append('data_fim', formData.data_fim || formData.data_inicio);
        formDataToSend.append('id_user', user.id || user.id_user);

        if (selectedFiles.length > 0) {
            for (let i = 0; i < selectedFiles.length; i++) {
                formDataToSend.append('anexos', selectedFiles[i]);
            }
        }

        try {
            const response = await fetch('http://localhost:3002/api/eventos', { 
                method: 'POST',
                body: formDataToSend,
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (response.ok) {
                setToast({ type: 'success', message: "Evento criado com sucesso!" });
                setTimeout(() => navigate('/home'), 2000);
            } else {
                const errorData = await response.json();
                setToast({ type: 'error', message: errorData.error || "Erro ao criar evento" });
            }
        } catch (error) {
            setToast({ type: 'error', message: "Erro de conexão ao servidor." });
        }
    };

    const handleCancel = () => navigate('/home');
    
    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/'); 
    };

    const getMinDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 2);
        return d.toISOString().split('T')[0]; 
    };

    return (
        <div className="form-page-layout">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* MODAL DO MAPA EXPANDIDO */}
            {isMapExpanded && (
                <div className="modal-overlay" style={{zIndex: 10001}}>
                    <div className="modal-content expanded-map-modal" style={{width: '90%', maxWidth: '1100px'}}>
                        <div className="modal-header">
                            <h3>Selecionar Localização</h3>
                            <button onClick={() => setIsMapExpanded(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{height: '70vh', padding: '0'}}>
                            <MapPicker onLocationSelect={handleLocationSelect} />
                        </div>
                        <div className="modal-footer-actions">
                            <button type="button" className="btn-action-solid success" onClick={() => setIsMapExpanded(false)}>
                                CONFIRMAR LOCALIZAÇÃO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <div className="logo-esp" onClick={() => navigate('/home')} style={{cursor:'pointer'}}>
                        <img src={logo} alt="Logo Esposende" className="logo-img" />
                    </div>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                        <Link to="/nova-requisicao" className="nav-item-esp">NOVA REQUISIÇÃO</Link>
                        <Link to="/novo-evento" className="nav-item-esp active-tab-indicator">NOVO EVENTO</Link> 
                    </nav>
                    <div className="header-icons-esp">
                        <div className="user-profile-badge" style={{ marginRight: '15px', textAlign: 'right' }}>
                            <span style={{ color: 'white', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>{user?.nome?.split(' ')[0]}</span>
                            <span style={{ color: '#3498db', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>{isGestor ? 'GESTOR' : 'FUNCIONÁRIO'}</span>
                        </div>
                        <Link to="/carrinho"><ShoppingCart size={24} className="icon-esp" /></Link>
                        <Link to="/perfil"><User size={24} className="icon-esp active-icon-indicator" /></Link>
                        <button onClick={handleLogout} className="logout-btn"><CornerDownLeft size={24} className="icon-esp" /></button>
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
                                    <label>Localização (Selecionada no mapa) *</label>
                                    <input type="text" name="localizacao" value={formData.localizacao} readOnly placeholder="Clique no mapa para definir..." required />
                                </div>
                            </div>

                            <div className="map-column-layout">
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                                    <button type="button" onClick={() => setIsMapExpanded(true)} className="btn-expand-map" style={{fontSize: '10px', background: '#1f3a52', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                                        <Search size={12} /> EXPANDIR
                                    </button>
                                </div>
                                <div className="map-image-placeholder-layout" style={{height: '250px'}}>
                                    <MapPicker onLocationSelect={handleLocationSelect} />
                                </div>
                            </div>
                        </div>

                        <div className="date-time-row-layout">
                            <div className="form-group date-time-group">
                                <label>Data de início *</label>
                                <input type="date" name="data_inicio" min={getMinDate()} value={formData.data_inicio} onChange={handleChange} required />
                            </div>
                            <div className="form-group date-time-group">
                                <label>Hora de início *</label>
                                <input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange} required />
                            </div>
                            <div className="form-group date-time-group">
                                <label>Data de fim *</label>
                                <input type="date" name="data_fim" min={formData.data_inicio || getMinDate()} value={formData.data_fim} onChange={handleChange} required />
                            </div>
                            <div className="form-group date-time-group">
                                <label>Hora de fim *</label>
                                <input type="time" name="hora_fim" value={formData.hora_fim} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-group full-width attachments-row-layout">
                            <label>Anexos / Documentos de Apoio</label>
                            <p style={{fontSize: '11px', color: '#666', marginBottom: '5px'}}>Formatos: PDF, JPG, PNG (Máx: 5MB)</p>
                            <input type="file" name="anexos" multiple onChange={handleFileChange} className="file-input-field" accept=".pdf,.jpg,.jpeg,.png" />
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