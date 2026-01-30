import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { Search, X, ChevronRight, ShoppingCart, User, CornerDownLeft } from 'lucide-react';
import './Explorar.css';
import logo from '../../assets/img/esposende.png';

const Explorar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
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
        'x-user-profile': user?.id_perfil?.toString(),
        'x-user-name': user?.nome
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resMat, resCat] = await Promise.all([
                    fetch('http://localhost:3002/api/materiais', { headers: getAuthHeaders() }),
                    fetch('http://localhost:3002/api/materiais/categorias', { headers: getAuthHeaders() })
                ]);
                const dataMat = await resMat.json();
                const dataCat = await resCat.json();
                
                setMateriais(Array.isArray(dataMat) ? dataMat : []);
                setCategorias(Array.isArray(dataCat) ? dataCat : []);
                
                const cart = JSON.parse(localStorage.getItem('carrinho')) || [];
                setCarrinhoCount(cart.length);

            } catch (err) {
                console.error("Erro ao carregar dados do catálogo", err);
            }
        };
        fetchData();
    }, []);

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
        const nomeMaterial = m.nome || ""; 
        const matchTexto = nomeMaterial.toLowerCase().includes(filtroTexto.toLowerCase());
        const matchCat = categoriasSelecionadas.length === 0 || categoriasSelecionadas.includes(m.categoria);
        const matchArm = armazensSelecionados.length === 0 || armazensSelecionados.includes(m.local_armazenamento);
        return matchTexto && matchCat && matchArm;
    });

    const totalPaginas = Math.ceil(materiaisFiltrados.length / itensPorPagina);
    const materiaisExibidos = materiaisFiltrados.slice(pagina * itensPorPagina, (pagina + 1) * itensPorPagina);

    return (
        <div className="explorar-container">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}} />
                    
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp active-tab-indicator">CATÁLOGO</Link>
                        {user?.id_perfil === 2 ? (
                            <Link to="/gestao" className="nav-item-esp">PAINEL DE GESTÃO</Link>
                        ) : (
                            <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                        )}
                    </nav>

                    <div className="header-icons-esp">
                        <div style={{position: 'relative', cursor: 'pointer', marginRight:'15px'}} onClick={() => navigate('/carrinho')}>
                            <ShoppingCart size={22} className="icon-esp" />
                            {carrinhoCount > 0 && <span className="cart-badge-count">{carrinhoCount}</span>}
                        </div>

                        <div className="user-profile-badge" style={{marginRight:'10px', textAlign:'right'}}>
                            <span className="user-name-text" style={{fontSize:'12px', fontWeight:'bold', color:'#1f4e79', display:'block'}}>{user?.nome?.split(' ')[0]}</span>
                            <span className="role-tag" style={{fontSize:'9px', padding:'2px 5px', borderRadius:'3px', color:'white', background: user?.id_perfil === 2 ? '#f39c12' : '#3498db'}}>
                                {user?.id_perfil === 2 ? 'GESTOR' : 'FUNCIONÁRIO'}
                            </span>
                        </div>

                        <Link to="/perfil"><User size={22} className="icon-esp" /></Link>
                        <button onClick={() => {localStorage.clear(); navigate('/');}} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="explorar-content-wrapper">
                <aside className="sidebar-filtros">
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Pesquisar..." 
                            onChange={(e) => { setFiltroTexto(e.target.value); setPagina(0); }}
                        />
                        <Search size={18} className="search-icon" />
                    </div>

                    <div className="filtros-secao">
                        <p className="label-secao">FILTROS ATIVOS:</p>
                        <div className="tags-container">
                            {categoriasSelecionadas.map(c => (
                                <span key={c} className="tag-filtro">
                                    {c} <X size={12} onClick={() => handleCheckCategoria(c)} />
                                </span>
                            ))}
                            {armazensSelecionados.map(a => (
                                <span key={a} className="tag-filtro tag-armazem">
                                    {a} <X size={12} onClick={() => handleCheckArmazem(a)} />
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grupo-filtro-caixa">
                        <h4>CATEGORIA:</h4>
                        <div className="scroll-filtros">
                            {categorias.map(cat => (
                                <label key={cat.id_categoria} className="checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        checked={categoriasSelecionadas.includes(cat.nome)}
                                        onChange={() => handleCheckCategoria(cat.nome)}
                                    />
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
                                    <input 
                                        type="checkbox" 
                                        checked={armazensSelecionados.includes(arm)}
                                        onChange={() => handleCheckArmazem(arm)}
                                    />
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
                                className={`card-visual ${m.quantidade_disp <= 0 ? 'esgotado' : ''} ${!eventoAtivo ? 'only-view' : ''}`}
                                onClick={() => eventoAtivo && m.quantidade_disp > 0 && navigate(`/requisitar/${m.id_material}`)}
                                style={{cursor: (!eventoAtivo || m.quantidade_disp <= 0) ? 'not-allowed' : 'pointer'}}
                            >
                                <div className="img-box">
                                    <img 
                                        src={m.imagem_url ? `http://localhost:3002/uploads/${m.imagem_url}` : logo} 
                                        alt={m.nome} 
                                        className={m.imagem_url ? "img-material-catalogo" : "logo-watermark"}
                                        onError={(e) => { e.target.src = logo; }}
                                    />
                                    {m.quantidade_disp <= 0 && <div className="badge-esgotado">ESGOTADO</div>}
                                </div>
                                <h3>{(m.nome || "").toUpperCase()}</h3>
                                <div className="qtd-footer">Quantidades Disponíveis: {m.quantidade_disp}</div>
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
                        {eventoAtivo 
                            ? `ATUALMENTE A TRABALHAR EM: ${eventoAtivo.nome.toUpperCase()}` 
                            : "MODO DE CONSULTA (SELECIONE UMA REQUISIÇÃO NO PERFIL)"}
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Explorar;