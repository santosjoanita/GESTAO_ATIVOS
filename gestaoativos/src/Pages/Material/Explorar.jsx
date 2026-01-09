import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { Search, X, ChevronRight } from 'lucide-react';
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

    const eventoRaw = localStorage.getItem('evento_trabalho');
    const eventoAtivo = eventoRaw ? JSON.parse(eventoRaw) : null;
    const itensPorPagina = 10; 

    const listaArmazens = [
        "Bouro", "Instalações SIGE", "Fórum Rodrigues Sampaio", 
        "Biblioteca Municipal", "Auditório Municipal", "Instalações DSSA", 
        "Instalações SMPC (Serviço Municipal de Proteção Civil)", 
        "Armazém Municipal Central", "Estaleiro Municipal"
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // MUDANÇA: Porta 3002 para Materiais e Categorias
                const [resMat, resCat] = await Promise.all([
                    fetch('http://localhost:3002/api/materiais'),
                    fetch('http://localhost:3002/api/materiais/categorias')
                ]);
                const dataMat = await resMat.json();
                const dataCat = await resCat.json();
                
                setMateriais(Array.isArray(dataMat) ? dataMat : []);
                setCategorias(Array.isArray(dataCat) ? dataCat : []);
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
                    <img src={logo} alt="Logo" className="logo-img-large" />
                    <nav className="header-nav-esp">
                        {user?.id_perfil === 2 ? (
                            <Link to="/gestao" className="nav-item-esp">PAINEL DE GESTÃO</Link>
                        ) : (
                            <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                        )}
                    </nav>
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
                            >
                                <div className="img-box">
                                    <img 
                                        src={m.imagem_url 
                                            ? `http://localhost:3002/uploads/${m.imagem_url}` 
                                            : logo 
                                        } 
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