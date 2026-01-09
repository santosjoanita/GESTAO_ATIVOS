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
        let endpoint = '';
        
        if (tab === 'requisicoes') endpoint = '/requisicoes/todas';
        else if (tab === 'eventos') endpoint = '/eventos/todos';
        else if (tab === 'stock') endpoint = '/stock/historico';
        
        try {
            const res = await fetch(`http://localhost:3002/api/gestao${endpoint}`);
            if (!res.ok) throw new Error("Erro na rota");
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
                const res = await fetch(`http://localhost:3002/api/eventos/${item.id_evento}/anexos`);
                const data = await res.json();
                setAnexos(data);
            } catch (err) { console.error(err); }
        }
    };

    const handleAcao = async (id, id_estado) => {
        try {
            await fetch(`http://localhost:3002/api/gestao/${tab}/${id}/estado`, {
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
                                            <p>{item.requerente || "Utilizador"}</p>
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
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalhes do {tab === 'eventos' ? 'Evento' : 'Pedido'}</h3>
                            <button onClick={() => setSelectedItem(null)} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <h4 className="modal-main-title">
                                {selectedItem.nome_evento || selectedItem.nome_exibicao || selectedItem.item_nome}
                            </h4>
                            
                            <div className="info-grid-esp">
                                <p><User size={16}/> <strong>Criado por:</strong> {selectedItem.requerente || selectedItem.nome_utilizador || 'N/A'}</p>
                                <p><Calendar size={16}/> <strong>Data:</strong> {
                                    tab === 'eventos' && selectedItem.data_inicio
                                    ? `${new Date(selectedItem.data_inicio).toLocaleDateString('pt-PT')} ${selectedItem.data_fim ? ' até ' + new Date(selectedItem.data_fim).toLocaleDateString('pt-PT') : ''}`
                                    : new Date(selectedItem.data_pedido || selectedItem.data_movimento).toLocaleDateString('pt-PT')
                                }</p>
                                <p><MapPin size={16}/> <strong>Local:</strong> {selectedItem.localizacao || 'Esposende'}</p>
                            </div>

                            <div className="specs-container-esp">
                                <h5><FileText size={16}/> Especificações / Finalidade:</h5>
                                <div className="specs-box">
                                    {selectedItem.descricao || selectedItem.especificacoes || "Sem especificações fornecidas."}
                                </div>
                            </div>
                            
                            {tab === 'eventos' && (
                                <div className="anexos-section" style={{marginTop: '20px'}}>
                                    <h5><Download size={16}/> Documentos Anexados:</h5>
                                    {anexos.length > 0 ? (
                                        <div className="anexos-list">
                                            {anexos.map(file => (
                                                <a key={file.id_anexo} 
                                                href={`http://localhost:3002/uploads/${file.nome_oculto}`} 
                                                target="_blank" rel="noreferrer" className="anexo-item">
                                                    <Download size={14}/> {file.nome}
                                                </a>
                                            ))}
                                        </div>
                                    ) : <p className="no-anexos-msg">Nenhum anexo encontrado.</p>}
                                </div>
                            )}

                            {selectedItem.estado_nome?.toLowerCase() === 'pendente' && (
                                <div className="modal-actions" style={{display: 'flex', gap: '15px', marginTop: '25px'}}>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 2)} className="btn-approve" style={{flex: 1, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>APROVAR</button>
                                    <button onClick={() => handleAcao(selectedItem.id_req || selectedItem.id_evento, 3)} className="btn-reject" style={{flex: 1, padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>REJEITAR</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestorDashboard;