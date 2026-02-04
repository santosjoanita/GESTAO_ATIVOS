import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { X, ChevronRight, ShoppingCart, User, CornerDownLeft } from 'lucide-react';
import './Explorar.css';
import logo from '../../assets/img/esposende.png';
import Toast from '../../components/Toast'; 

const Explorar = ({ onLogout }) => { 
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const isGestor = user?.id_perfil === 2;
    const isConvidado = user?.id_perfil === 4;
    const [toast, setToast] = useState(null); 
    
    const [materiais, setMateriais] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [filtroTexto, setFiltroTexto] = useState('');
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
    const [armazensSelecionados, setArmazensSelecionados] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [carrinhoCount, setCarrinhoCount] = useState(0);

    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;
    const itensPorPagina = 10; 

    const listaArmazens = [
        "Bouro", "Instalações SIGE", "Fórum Rodrigues Sampaio", 
        "Biblioteca Municipal", "Auditório Municipal", "Instalações DSSA", 
        "Instalações SMPC (Serviço Municipal de Proteção Civil)", 
        "Armazém Municipal Central", "Estaleiro Municipal"
    ];

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${user?.token}`,
        'Content-Type': 'application/json'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resMat, resCat] = await Promise.all([
                    fetch('http://localhost:3002/api/materiais', { headers: getAuthHeaders() }),
                    fetch('http://localhost:3002/api/materiais/categorias', { headers: getAuthHeaders() })
                ]);

                if (!resMat.ok || !resCat.ok) throw new Error("Erro ao carregar dados");

                const dataMat = await resMat.json();
                const dataCat = await resCat.json();

                
                setMateriais(Array.isArray(dataMat) ? dataMat : []);
                setCategorias(Array.isArray(dataCat) ? dataCat : []);

                const cart = JSON.parse(localStorage.getItem('carrinho')) || [];
                setCarrinhoCount(cart.length);

            } catch (err) {
                console.error("Erro no catálogo:", err);
                setToast({ type: 'error', message: "Erro ao carregar dados do catálogo." });
            }
        };
        fetchData();
    }, []);

    const handleSairEdicao = () => {
        localStorage.removeItem('evento_trabalho');
        setToast({ type: 'info', message: "Saiu do modo de edição." });
        setTimeout(() => navigate('/perfil'), 1000);
    };

    const handleLogout = () => {
        localStorage.clear();
        if (typeof onLogout === 'function') onLogout(); 
        navigate('/');
    };

    const handleMaterialClick = (m) => {
        if (!eventoAtivo) {
            setToast({ 
                type: 'warning', 
                message: "Atenção: Selecione primeiro uma requisição no Perfil para poder adicionar materiais!" 
            });
            return;
        }
        // Navega para o produto onde será feito o cálculo da quantidade real com as datas do evento
        navigate(`/produto/${m.id_material}`);
    };

    const handleCheckCategoria = (nome) => {
        setCategoriasSelecionadas(prev => 
            prev.includes(nome) ? prev.filter(c => c !== nome) : [...prev, nome]
        );
        setPagina(0); 
    };

    const handleCheckArmazem = (nome) => {
        setArmazensSelecionados(prev => 
            prev.includes(nome) ? prev.filter(a => a !== nome) : [...prev, nome]
        );
        setPagina(0); 
    };

    const materiaisFiltrados = materiais.filter(m => {
        const matchTexto = (m.nome || "").toLowerCase().includes(filtroTexto.toLowerCase());
        const matchCat = categoriasSelecionadas.length === 0 || categoriasSelecionadas.includes(m.categoria_nome || m.categoria);
        const matchArm = armazensSelecionados.length === 0 || armazensSelecionados.includes(m.local_armazenamento);
        return matchTexto && matchCat && matchArm;
    });

    const totalPaginas = Math.ceil(materiaisFiltrados.length / itensPorPagina);
    const materiaisExibidos = materiaisFiltrados.slice(pagina * itensPorPagina, (pagina + 1) * itensPorPagina);

    return (
        <div className="explorar-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img 
                        src={logo} 
                        alt="Logo" 
                        className="logo-img" 
                        onClick={() => navigate(isGestor ? '/gestao' : '/home')} 
                        style={{cursor:'pointer'}} 
                    />
                    
                    <nav className="header-nav-esp">
                            <Link to="/explorar" className="nav-item-esp active-tab-indicator">CATÁLOGO</Link>
                            
                            {!isConvidado && (
                                <>
                                    {isGestor ? (
                                        <Link to="/gestao" className="nav-item-esp">GESTÃO</Link>
                                    ) : (
                                        <Link to="/home" className="nav-item-esp">INÍCIO</Link>
                                    )}
                                    {eventoAtivo && (
                                        <button onClick={handleSairEdicao} className="btn-sair-edicao">
                                            <X size={14} /> PARAR EDIÇÃO
                                        </button>
                                    )}
                                </>
                            )}
                        </nav>

                        <div className="header-icons-esp">
                            <div className="user-profile-badge" style={{ marginRight: '15px', textAlign: 'right' }}>
                                <span style={{ color: 'white', display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                                    {user?.nome?.split(' ')[0]}
                                </span>
                                <span style={{ color: '#3498db', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>
                                    {isConvidado ? 'CONVIDADO' : (isGestor ? 'GESTOR' : 'FUNCIONÁRIO')}
                                </span>
                            </div>

                            {!isConvidado && (
                                <Link to="/carrinho">
                                    <ShoppingCart size={24} className="icon-esp" />
                                    {carrinhoCount > 0 && <span className="cart-badge">{carrinhoCount}</span>}
                                </Link>
                            )}
                            
                            <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
                            <button onClick={handleLogout} className="logout-btn">
                                <CornerDownLeft size={24} className="icon-esp" />
                            </button>
                        </div>
                </div>
            </header>

            <div className="explorar-content-wrapper">
                <aside className="sidebar-filtros">
                    <div className="search-box">
                        <input type="text" placeholder="Pesquisar..." onChange={(e) => { setFiltroTexto(e.target.value); setPagina(0); }} />
                    </div>

                    <div className="filtros-secao">
                        <p className="label-secao">FILTROS ATIVOS:</p>
                        <div className="tags-container">
                            {categoriasSelecionadas.map(c => <span key={c} className="tag-filtro">{c} <X size={12} onClick={() => handleCheckCategoria(c)} /></span>)}
                            {armazensSelecionados.map(a => <span key={a} className="tag-filtro tag-armazem">{a} <X size={12} onClick={() => handleCheckArmazem(a)} /></span>)}
                        </div>
                    </div>

                    <div className="grupo-filtro-caixa">
                        <h4>CATEGORIA:</h4>
                        <div className="scroll-filtros">
                            {categorias.map(cat => (
                                <label key={cat.id_categoria} className="checkbox-item">
                                    <input type="checkbox" checked={categoriasSelecionadas.includes(cat.nome)} onChange={() => handleCheckCategoria(cat.nome)} />
                                    {cat.nome}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grupo-filtro-caixa">
                        <h4>ARMAZÉM:</h4>
                        <div className="scroll-filtros">
                            {listaArmazens.map(arm => (
                                <label key={arm} className="checkbox-item">
                                    <input type="checkbox" checked={armazensSelecionados.includes(arm)} onChange={() => handleCheckArmazem(arm)} />
                                    {arm}
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="catalogo-main">
                    <div className="grid-10-itens">
                        {materiaisExibidos.map(m => (
                            <div 
                                key={m.id_material} 
                                className={`card-visual ${m.quantidade_total <= 0 ? 'esgotado' : ''} ${(!eventoAtivo || isConvidado) ? 'only-view' : ''}`}
                                onClick={() => !isConvidado && handleMaterialClick(m)} // Bloqueia clique se for convidado
                                style={{cursor: (!eventoAtivo || isConvidado) ? 'not-allowed' : 'pointer'}}
                            >
                                <div className="img-box">
                                    <img 
                                            src={m.imagem_url ? `http://localhost:3002/uploads/${m.imagem_url}` : logo} 
                                            alt={m.nome} 
                                            className={m.imagem_url ? "img-material-catalogo" : "logo-watermark"}
                                            onError={(e) => { e.target.src = logo; }} 
                                        />
                                    {m.quantidade_total <= 0 && <div className="badge-esgotado">SEM STOCK</div>}
                                </div>
                                <h3>{(m.nome || "").toUpperCase()}</h3>
                                <div className="qtd-footer">Total em Armazém: {m.quantidade_total}</div>
                            </div>
                        ))}
                    </div>

                    {totalPaginas > 1 && (
                        <button className="seta-paginacao" onClick={() => setPagina((pagina + 1) % totalPaginas)}>
                            <ChevronRight size={60} />
                        </button>
                    )}
                </main>
            </div>

            <footer className="footer-trabalho">
                <div className="footer-inner">
                    <span className="status-text">
                        {isConvidado 
                            ? "🔹 MODO CONSULTA (APENAS VISUALIZAÇÃO)" 
                            : (eventoAtivo 
                                ? `A EDITAR REQUISIÇÃO: ${eventoAtivo.nome.toUpperCase()}` 
                                : "MODO DE CONSULTA (SELECIONE UMA REQUISIÇÃO NO PERFIL PARA ADICIONAR ITENS)")
                        }
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Explorar;