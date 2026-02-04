import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Package } from 'lucide-react';
import './Produto.css';
import logo from '../../assets/img/esposende.png';
import Toast from '../../components/Toast';

const Produto = ({ onLogout }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [material, setMaterial] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [datas, setDatas] = useState({ levantamento: '', devolucao: '' });
    const [limitesEvento, setLimitesEvento] = useState({ min: '', max: '' });
    
    const [toast, setToast] = useState(null);
    
    const [quantidadeRealDisp, setQuantidadeRealDisp] = useState(0);

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
            .then(data => {
                setMaterial(data);
                setQuantidadeRealDisp(data.quantidade_total);
            })
            .catch(err => {
                console.error("Erro material:", err);
                setToast({ type: 'error', message: "Erro ao carregar dados do material." });
            });

        if (eventoAtivo?.id_req) {
            fetch(`http://localhost:3002/api/materiais/limites-evento/${eventoAtivo.id_req}`, { headers })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        const minDate = data.data_inicio ? data.data_inicio.split('T')[0] : '';
                        const maxDate = data.data_fim ? data.data_fim.split('T')[0] : '';
                        setLimitesEvento({ min: minDate, max: maxDate });
                        setDatas({ levantamento: minDate, devolucao: maxDate });
                    }
                })
                .catch(err => console.error("Erro limites:", err));
        }
    }, [id]);

    // CALCULAR STOCK REAL SEMPRE QUE AS DATAS MUDAM
    useEffect(() => {
        if (datas.levantamento && datas.devolucao) {
            const headers = getAuthHeaders();
           fetch(`http://localhost:3002/api/materiais/quantidadeReal/${id}/${datas.levantamento}/${datas.devolucao}`, { headers })
            .then(res => res.json())
            .then(data => {
                setQuantidadeRealDisp(data.quantidade_disponivel);
                    if (data.quantidade_real_disp <= 0) {
                        setToast({ type: 'warning', message: "Aviso: Este material já está reservado para estas datas." });
                    }
                })
                .catch(err => console.error("Erro no cálculo real:", err));
        }
    }, [datas.levantamento, datas.devolucao, id]);

    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/');
    };

    const handleAdicionar = () => {
        // Validação de Evento Ativo
        if (!eventoAtivo) {
            setToast({ type: 'warning', message: "Atenção: Seleciona 'Editar' numa requisição no Perfil primeiro!" });
            return;
        }
        // Validação de Datas Vazias
        if (!datas.levantamento || !datas.devolucao) {
            setToast({ type: 'error', message: "Por favor, seleciona as datas de levantamento e devolução." });
            return;
        }
        // Validação de Stock Real
        if (parseInt(quantidade) > quantidadeRealDisp) {
            setToast({ type: 'error', message: `Quantidade indisponível. Só existem ${quantidadeRealDisp} unidades livres neste período.` });
            return;
        }
        // Validação de Limites do Evento
        if (datas.levantamento < limitesEvento.min || datas.devolucao > limitesEvento.max) {
            setToast({ type: 'error', message: "As datas escolhidas estão fora do período permitido para este evento." });
            return;
        }
        // Validação Lógica de Datas
        if (new Date(datas.devolucao) < new Date(datas.levantamento)) {
            setToast({ type: 'error', message: "A data de devolução não pode ser anterior à data de levantamento." });
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
        
        setToast({ type: 'success', message: "Sucesso! Material adicionado ao carrinho." });
        setTimeout(() => navigate('/explorar'), 2000);
    };

    if (!material) return <div className="loading-state">A carregar material...</div>;

    return (
        <div className="layout-padrao-produto">
            {/* COMPONENTE TOAST */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img 
                        src={logo} 
                        alt="Logo" 
                        className="logo-img" 
                        onClick={() => navigate(user?.id_perfil === 2 ? '/gestao' : '/home')} 
                        style={{cursor:'pointer'}}
                    />
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        {user?.id_perfil === 2 ? (
                            <Link to="/gestao" className="nav-item-esp">PAINEL DE GESTÃO</Link>
                        ) : (
                            <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                        )}
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
                        <Link to="/carrinho">
                            <ShoppingCart size={24} className="icon-esp" />
                        </Link>
                        <Link to="/perfil">
                            <User size={24} className="icon-esp" />
                        </Link>
                        <button onClick={handleLogout} className="logout-btn">
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
                            
                            <p><strong>QUANTIDADE TOTAL (ARMAZÉM):</strong> {material.quantidade_total}</p>
                            
                            {/* CAIXA DE STOCK DINÂMICO */}
                            <div className="stock-label-esp" style={{ backgroundColor: quantidadeRealDisp <= 0 ? '#e74c3c' : '#2ecc71' }}>
                                DISPONÍVEL NO PERÍODO: {quantidadeRealDisp}
                            </div>
                        </div>

                        <div className="form-reserva-esp">
                            <div className="input-group-esp">
                                <label>QUANTIDADE DESEJADA</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={quantidadeRealDisp > 0 ? quantidadeRealDisp : 1} 
                                    value={quantidade} 
                                    onChange={(e) => setQuantidade(e.target.value)} 
                                />
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
                            </div>
                        </div>

                        <button 
                            className={`btn-final-carrinho ${quantidadeRealDisp <= 0 ? 'disabled' : ''}`} 
                            onClick={handleAdicionar}
                            disabled={quantidadeRealDisp <= 0}
                        >
                            <ShoppingCart size={20} /> 
                            {quantidadeRealDisp <= 0 ? "INDISPONÍVEL NESTAS DATAS" : "ADICIONAR AO CARRINHO"}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <span className="footer-project-esp">
                    {eventoAtivo ? `A TRABALHAR NO EVENTO: ${eventoAtivo.nome.toUpperCase()}` : "ERRO: SELECIONE UM EVENTO NO PERFIL"}
                </span>
            </footer>
        </div>
    );
};

export default Produto;