import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Package, AlertCircle } from 'lucide-react';
import './Produto.css';
import logo from '../../assets/img/esposende.png';
import Toast from '../../components/Toast';

const Produto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [material, setMaterial] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [datas, setDatas] = useState({ levantamento: '', devolucao: '' });
    const [limitesEvento, setLimitesEvento] = useState({ min: '', max: '' });
    const [toast, setToast] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));
    
    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;
    
    const itensCarrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    const getAuthHeaders = () => {
        const storedData = localStorage.getItem('user');
        const userData = storedData ? JSON.parse(storedData) : null;
        return {
            'Content-Type': 'application/json',
            'Authorization': userData && userData.token ? `Bearer ${userData.token}` : ''
        };
    };

    useEffect(() => {
        const headers = getAuthHeaders();

        fetch(`http://localhost:3002/api/materiais/${id}`, { headers })
            .then(res => res.json())
            .then(data => setMaterial(data))
            .catch(err => console.error(err));

        if (eventoAtivo?.id_req) {
            fetch(`http://localhost:3002/api/materiais/limites-evento/${eventoAtivo.id_req}`, { headers })
                .then(res => {
                    if (res.ok) return res.json();
                    return null;
                })
                .then(data => {
                    if (data) {
                        setLimitesEvento({
                            min: data.data_inicio ? data.data_inicio.split('T')[0] : '',
                            max: data.data_fim ? data.data_fim.split('T')[0] : ''
                        });
                        setDatas({
                            levantamento: data.data_inicio ? data.data_inicio.split('T')[0] : '',
                            devolucao: data.data_fim ? data.data_fim.split('T')[0] : ''
                        });
                    }
                })
                .catch(err => console.error("Erro limites:", err));
        }
    }, [id, eventoAtivo?.id_req]);

    const handleAdicionar = () => {
        if (!eventoAtivo) {
            setToast({ type: 'warning', message: "Atenção: Seleciona 'Editar' numa requisição no Perfil primeiro!" });
            return;
        }
        // bucar todas as rewuisições 
        if (datas.levantamento < limitesEvento.min || datas.devolucao > limitesEvento.max) {
            setToast({ type: 'error', message: "As datas têm de estar dentro do período do evento." });
            return;
        }

        if (datas.devolucao < datas.levantamento) {
            setToast({ type: 'error', message: "Data de devolução inválida." });
            return;
        }

        const novoItem = {
            id_material: material.id_material,
            nome: material.nome,
            quantidade: parseInt(quantidade),
            levantamento: datas.levantamento,
            devolucao: datas.devolucao,
            imagem_url: material.imagem_url
        };

        const novoCarrinho = [...itensCarrinho, novoItem];
        localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
        
        setToast({ type: 'success', message: `${material.nome} adicionado ao carrinho!` });
        setTimeout(() => navigate('/explorar'), 1000);
    };

    if (!material) return <div className="loading-state">A carregar...</div>;

    return (
        <div className="layout-padrao-produto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                    </nav>
                    <div className="header-icons-esp">
                        <div style={{position: 'relative', cursor: 'pointer'}} onClick={() => navigate('/carrinho')}>
                            <ShoppingCart size={24} className="icon-esp" />
                            {itensCarrinho.length > 0 && <span className="cart-badge-count">{itensCarrinho.length}</span>}
                        </div>
                        <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
                        <button onClick={() => {localStorage.clear(); navigate('/');}} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="produto-main">
                <div className="produto-grid">
                    <div className="produto-media">
                        <img 
                            src={material.imagem_url ? `http://localhost:3002/uploads/${material.imagem_url}` : logo} 
                            alt={material.nome} 
                            onError={(e) => { e.target.src = logo; }}
                        />
                    </div>

                    <div className="produto-info-detalhe">
                        <div className="categoria-tag">{material.categoria_nome || 'MATERIAL'}</div>
                        <h1>{material.nome?.toUpperCase()}</h1>
                        
                        <div className="specs-box-estilizada">
                            <p><strong><Package size={16} /> DESCRIÇÃO:</strong> {material.descricao_tecnica || "Nenhuma descrição técnica disponível."}</p>
                            <p><strong>ARMAZÉM:</strong> {material.local_armazenamento || "Não especificado"}</p>
                            <div className="stock-label-esp">STOCK DISPONÍVEL: {material.quantidade_disp}</div>
                        </div>

                        <div className="form-reserva-esp">
                            <div className="input-group-esp">
                                <label>QUANTIDADE</label>
                                <input type="number" min="1" max={material.quantidade_disp} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                            </div>
                            
                            <div className="input-group-esp">
                                <label>LEVANTAMENTO</label>
                                <input 
                                    type="date" 
                                    min={limitesEvento.min} 
                                    max={limitesEvento.max} 
                                    value={datas.levantamento} 
                                    onChange={(e) => setDatas({...datas, levantamento: e.target.value})} 
                                />
                                <small style={{fontSize:'10px', color:'#666'}}>
                                    Evento começa a: {limitesEvento.min}
                                </small>
                            </div>
                            <div className="input-group-esp">
                                <label>DEVOLUÇÃO</label>
                                <input 
                                    type="date" 
                                    min={datas.levantamento || limitesEvento.min} 
                                    max={limitesEvento.max} 
                                    value={datas.devolucao} 
                                    onChange={(e) => setDatas({...datas, devolucao: e.target.value})} 
                                />
                                <small style={{fontSize:'10px', color:'#666'}}>
                                    Evento termina a: {limitesEvento.max}
                                </small>
                            </div>
                        </div>

                        <button 
                            className={`btn-final-carrinho ${material.quantidade_disp <= 0 ? 'disabled' : ''}`} 
                            onClick={handleAdicionar}
                            disabled={material.quantidade_disp <= 0}
                        >
                            <ShoppingCart size={20} /> 
                            {material.quantidade_disp <= 0 ? "SEM DISPONIBILIDADE" : "ADICIONAR AO CARRINHO"}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="fixed-footer-esp" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <span className="footer-project-esp">
                    {eventoAtivo ? `A TRABALHAR: ${eventoAtivo.nome.toUpperCase()}` : "SELECIONE 'EDITAR' NO PERFIL"}
                </span>
            </footer>
        </div>
    );
};

export default Produto;