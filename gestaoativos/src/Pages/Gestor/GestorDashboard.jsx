import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, X, FileText, MapPin, Calendar, Download } from 'lucide-react';
import './GestorDashboard.css';
import logo from '../../assets/img/esposende.png';

const GestorDashboard = () => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('requisicoes');
    const [selectedItem, setSelectedItem] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.id_perfil !== 2) { 
        return (
            <div style={{textAlign: 'center', padding: '100px'}}>
                <h2>Acesso Negado</h2>
                <button onClick={() => navigate('/')}>Voltar ao Login</button>
            </div>
        );
    }

    const loadData = async () => {
        setItems([]);
        let url = '';
        if (tab === 'requisicoes') url = '/api/gestao/requisicoes/todas';
        else if (tab === 'eventos') url = '/api/gestao/eventos/todos';
        else if (tab === 'stock') url = '/api/stock/historico';
        
        try {
            const res = await fetch(`http://localhost:3001${url}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) { 
            console.error("Erro ao carregar:", error);
            setItems([]);
        }
    };

    useEffect(() => { loadData(); }, [tab]);

    const handleVerDetalhes = async (item) => {
        setSelectedItem(item);
        setAnexos([]);
        if (tab === 'eventos') {
            try {
                const res = await fetch(`http://localhost:3001/api/eventos/${item.id_evento}/anexos`);
                const data = await res.json();
                setAnexos(data);
            } catch (err) { console.error(err); }
        }
    };

    const handleAcao = async (id, id_estado) => {
        try {
            await fetch(`http://localhost:3001/api/gestao/${tab}/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_estado }) 
            });
            setSelectedItem(null);
            loadData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="gestao-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" />
                    <nav className="header-nav-esp">
                        <button onClick={() => setTab('requisicoes')} className={`nav-item-esp ${tab === 'requisicoes' ? 'active-tab-indicator' : ''}`}>REQUISIÇÕES</button>
                        <button onClick={() => setTab('eventos')} className={`nav-item-esp ${tab === 'eventos' ? 'active-tab-indicator' : ''}`}>EVENTOS</button>
                        <button onClick={() => setTab('stock')} className={`nav-item-esp ${tab === 'stock' ? 'active-tab-indicator' : ''}`}>MOVIMENTOS STOCK</button>
                        <button className="nav-item-esp" onClick={() => navigate('/stock')} >STOCK</button>
                    </nav>
                    <div className="header-icons-esp">
                        <Link to="/perfil"><User size={22} className="icon-esp" /></Link>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="logout-btn">
                            <LogOut size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="gestao-main">
                <h2 className="gestao-title">PAINEL DE CONTROLO: {tab.toUpperCase()}</h2>
                
                <div className="gestao-grid">
                    {items.map(item => {
                const isStock = tab === 'stock';
                const tituloExibicao = isStock ? item.item_nome : item.nome_evento;

                return (
                    <div key={item.id_req || item.id_evento || item.id_historico || Math.random()} 
                        className="gestao-card"
                        onClick={() => !isStock && handleVerDetalhes(item)}
                        style={{ cursor: isStock ? 'default' : 'pointer' }}>
                        
                        <div className="card-info">
                            <strong>{tituloExibicao || "Sem Identificação"}</strong>
                            
                            {isStock ? (
                                <div className="stock-direct-info">
                                    <p><strong>Utilizador:</strong> {item.nome_utilizador}</p>
                                    <p><strong>Ação:</strong> {item.tipo_movimento} ({item.quantidade_alt})</p>
                                    <p><strong>Data:</strong> {new Date(item.data_movimento).toLocaleDateString('pt-PT')}</p>
                                </div>
                            ) : (
                                <>
                                    <p>{item.requerente}</p>
                                    <span className={`status-badge ${item.estado_nome?.toLowerCase()}`}>
                                        {item.estado_nome}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
                </div>
            </main>

            {selectedItem && (
                <div className="modal-overlay">
                    <div className="modal-content details-modal">
                        <div className="modal-header">
                            <h3>Detalhes do Pedido</h3>
                            <button onClick={() => setSelectedItem(null)} className="close-btn"><X /></button>
                        </div>
                        <div className="modal-body">
                            <h4 className="modal-main-title">{selectedItem.nome_evento}</h4>
                            
                            <div className="info-grid-esp">
                                <p><User size={16}/> <strong>Criado por:</strong> {selectedItem.requerente || 'N/A'}</p>
                                <p><Calendar size={16}/> <strong>Data:</strong> {selectedItem.data_pedido ? new Date(selectedItem.data_pedido).toLocaleDateString('pt-PT') : 'N/A'}</p>
                                <p><MapPin size={16}/> <strong>Local:</strong> {selectedItem.localizacao || 'N/A'}</p>
                            </div>
                            <div className="specs-container-esp">
                                <h5><FileText size={16}/> Especificações / Finalidade:</h5>
                                <div className="specs-box">
                                    {selectedItem.finalidade || selectedItem.descricao || "Sem especificações fornecidas."}
                                </div>
                            </div>
                            
                            {tab === 'eventos' && (
                                <div className="anexos-section">
                                    <h5><Download size={16}/> Documentos Anexados:</h5>
                                    {anexos.length > 0 ? (
                                        <div className="anexos-list">
                                            {anexos.map(file => (
                                                <a key={file.id_anexo} 
                                                   href={`http://localhost:3001/uploads/${file.nome_oculto}`} 
                                                   target="_blank" rel="noreferrer" className="anexo-item">
                                                    <Download size={14}/> {file.nome}
                                                </a>
                                            ))}
                                        </div>
                                    ) : <p className="no-anexos-msg">Nenhum anexo encontrado.</p>}
                                </div>
                            )}

                            {selectedItem.estado_nome && selectedItem.estado_nome.toLowerCase() === 'pendente' && (
                                <div className="modal-actions">
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-approve">APROVAR</button>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-reject">REJEITAR</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <div className="footer-items-wrapper"> 
                        <span className="footer-project-esp">SISTEMA DE GESTÃO - MUNICÍPIO DE ESPOSENDE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GestorDashboard;