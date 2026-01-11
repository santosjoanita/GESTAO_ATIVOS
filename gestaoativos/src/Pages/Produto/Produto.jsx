import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, ArrowLeft, Package, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import './Produto.css';
import logo from '../../assets/img/esposende.png';

const Produto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Estados do Material e Stock
    const [material, setMaterial] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [datas, setDatas] = useState({ levantamento: '', devolucao: '' });
    
    // Estados de Disponibilidade e Limites
    const [periodosOcupados, setPeriodosOcupados] = useState([]);
    const [limitesEvento, setLimitesEvento] = useState({ min: '', max: '' });
    
    // Dados do Contexto Local
    const user = JSON.parse(localStorage.getItem('user'));
    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;
    const itensCarrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    useEffect(() => {
        // 1. Carregar detalhes do Material
        fetch(`http://localhost:3002/api/materiais/${id}`)
            .then(res => res.json())
            .then(data => setMaterial(data))
            .catch(err => console.error("Erro ao carregar material:", err));

        // 2. Carregar períodos em que este material já está ocupado por outros
        fetch(`http://localhost:3002/api/materiais/${id}/ocupacao`)
            .then(res => res.json())
            .then(data => setPeriodosOcupados(data))
            .catch(err => console.error("Erro ao carregar ocupação:", err));

        // 3. Carregar as datas limites do Evento Pai (para bloquear o calendário)
        if (eventoAtivo?.id_req) {
            fetch(`http://localhost:3002/api/materiais/limites-evento/${eventoAtivo.id_req}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setLimitesEvento({
                            min: data.data_inicio.split('T')[0],
                            max: data.data_fim.split('T')[0]
                        });
                    }
                })
                .catch(err => console.error("Erro ao carregar limites do evento:", err));
        }
    }, [id, eventoAtivo?.id_req]);

    const handleAdicionar = () => {
        if (!eventoAtivo) {
            return alert("Atenção: Deves selecionar uma requisição no teu Perfil para poderes adicionar materiais!");
        }
        
        if (!datas.levantamento || !datas.devolucao) {
            return alert("Por favor, seleciona as datas de levantamento e devolução.");
        }

        if (datas.devolucao < datas.levantamento) {
            return alert("A data de devolução não pode ser anterior à data de levantamento.");
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
        
        alert(`${material.nome} adicionado ao carrinho!`);
        navigate('/explorar');
    };

    if (!material) return <div className="loading-state">A carregar detalhes do produto...</div>;

    const hoje = new Date().toISOString().split("T")[0];
    const dataMinimaPermitida = limitesEvento.min > hoje ? limitesEvento.min : hoje;

    return (
        <div className="layout-padrao-produto">
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

                        {periodosOcupados.length > 0 && (
                            <div className="ocupacao-container">
                                <h4 className="ocupacao-titulo"><AlertCircle size={16} /> CALENDÁRIO DE INDISPONIBILIDADE:</h4>
                                <ul className="ocupacao-lista">
                                    {periodosOcupados.map((p, idx) => (
                                        <li key={idx}>
                                            Reservado de <strong>{new Date(p.data_saida).toLocaleDateString()}</strong> até <strong>{new Date(p.data_devolucao).toLocaleDateString()}</strong> ({p.quantidade} un.)
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="form-reserva-esp">
                            <div className="input-group-esp">
                                <label>QUANTIDADE</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={material.quantidade_disp} 
                                    value={quantidade} 
                                    onChange={(e) => setQuantidade(e.target.value)} 
                                />
                            </div>

                            <div className="input-group-esp">
                                <label>LEVANTAMENTO</label>
                                <input 
                                    type="date" 
                                    min={dataMinimaPermitida}
                                    max={limitesEvento.max}
                                    value={datas.levantamento}
                                    onChange={(e) => setDatas({...datas, levantamento: e.target.value})} 
                                />
                                {limitesEvento.min && <small className="hint-date">Início do evento: {new Date(limitesEvento.min).toLocaleDateString()}</small>}
                            </div>

                            <div className="input-group-esp">
                                <label>DEVOLUÇÃO</label>
                                <input 
                                    type="date" 
                                    min={datas.levantamento || dataMinimaPermitida}
                                    max={limitesEvento.max}
                                    value={datas.devolucao}
                                    onChange={(e) => setDatas({...datas, devolucao: e.target.value})} 
                                />
                                {limitesEvento.max && <small className="hint-date">Fim do evento: {new Date(limitesEvento.max).toLocaleDateString()}</small>}
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
                        
                        {!eventoAtivo && (
                            <p className="erro-trabalho-msg">
                                <AlertCircle size={14} /> Precisas de selecionar "Trabalhar" numa requisição no teu perfil para adicionar itens.
                            </p>
                        )}
                    </div>
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <span className="footer-project-esp">
                        {eventoAtivo 
                            ? `A TRABALHAR NA REQUISIÇÃO: ${eventoAtivo.nome.toUpperCase()}` 
                            : "SELECIONE UMA REQUISIÇÃO NO SEU PERFIL PARA CONTINUAR"}
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Produto;