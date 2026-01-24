import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Trash2, CheckCircle, XCircle, Calendar, AlertTriangle } from 'lucide-react';
import './Carrinho.css';
import logo from '../../assets/img/esposende.png';

const Carrinho = () => {
    const navigate = useNavigate();
    const [itens, setItens] = useState(JSON.parse(localStorage.getItem('carrinho')) || []);
    const user = JSON.parse(localStorage.getItem('user'));
    const eventoAtivo = JSON.parse(localStorage.getItem('evento_trabalho'));

    useEffect(() => {
        if (!user || !eventoAtivo) navigate('/');
    }, [user, eventoAtivo, navigate]);

    const getAuthHeaders = () => {
        const storedData = localStorage.getItem('user');
        const userData = storedData ? JSON.parse(storedData) : null;
        return {
            'Content-Type': 'application/json',
            'Authorization': userData && userData.token ? `Bearer ${userData.token}` : ''
        };
    };

    const handleSubmeter = async () => {
        if (itens.length === 0) return alert("Carrinho vazio!");

        const itensInvalidos = itens.filter(i => !i.levantamento || !i.devolucao);
        if (itensInvalidos.length > 0) {
            return alert("Erro: Existem itens no carrinho sem datas definidas. Remova-os e adicione novamente.");
        }

        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${eventoAtivo.id_req}/submeter`, {
                method: 'POST',
                headers: getAuthHeaders(), 
                body: JSON.stringify({ materiais: itens })
            });

            const data = await res.json();

            if (res.ok) {
                // SUCESSO
                alert("Sucesso! Materiais requisitados e stock reservado.");
                localStorage.removeItem('carrinho');
                localStorage.removeItem('evento_trabalho');
                navigate('/perfil');
            } else {
                const msgErro = data.error || data.message || "Erro desconhecido ao submeter.";
                alert("Falha na reserva: " + msgErro);
            }
        } catch (error) { 
            console.error(error);
            alert("Erro de conexão ao servidor.");
        }
    };

    const formatarData = (data) => {
        if (!data) return "---";
        return new Date(data).toLocaleDateString('pt-PT');
    };

    return (
        <div className="layout-padrao-carrinho">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate('/home')} style={{cursor:'pointer'}}/>
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        <Link to="/home" className="nav-item-esp">PÁGINA INICIAL</Link>
                    </nav>
                    <div className="header-icons-esp">
                        <div style={{position: 'relative'}}><ShoppingCart size={24} className="icon-esp" /></div>
                        <Link to="/perfil"><User size={24} className="icon-esp" /></Link>
                        <button onClick={() => {localStorage.clear(); navigate('/');}} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="carrinho-main">
                <div className="carrinho-info-topo">
                    <h2>O SEU CARRINHO</h2>
                    <p>REQUISIÇÃO: <strong>{eventoAtivo?.nome}</strong></p>
                    <div className="aviso-stock">
                        <AlertTriangle size={16} />
                        <span>Atenção: O stock só é garantido após clicar em "Submeter".</span>
                    </div>
                </div>

                <div className="tabela-container-esp">
                    <table className="tabela-carrinho">
                        <thead>
                            <tr>
                                <th>MATERIAL</th>
                                <th>QUANTIDADE</th>
                                <th>RESERVA (DATAS)</th>
                                <th>AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.length > 0 ? (
                                itens.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div style={{fontWeight:'bold'}}>{item.nome}</div>
                                        </td>
                                        <td style={{textAlign:'center', fontWeight:'bold', fontSize:'1.1em'}}>
                                            {item.quantidade}
                                        </td>
                                        <td>
                                            <div className="data-display">
                                                <Calendar size={14} style={{marginRight:'5px'}}/>
                                                {formatarData(item.levantamento)} <span style={{margin:'0 5px'}}>a</span> {formatarData(item.devolucao)}
                                            </div>
                                        </td>
                                        <td style={{textAlign:'center'}}>
                                            <Trash2 className="remover-btn-esp" onClick={() => {
                                                const novo = itens.filter((_, i) => i !== idx);
                                                setItens(novo);
                                                localStorage.setItem('carrinho', JSON.stringify(novo));
                                            }} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{textAlign:'center', padding:'30px', color:'#888'}}>
                                        O seu carrinho está vazio. Vá ao catálogo adicionar materiais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="carrinho-acoes-finais">
                    <button className="btn-cancelar-total" onClick={() => {
                        if(window.confirm("Tem a certeza? Isto vai apagar o carrinho.")) {
                            localStorage.removeItem('carrinho');
                            localStorage.removeItem('evento_trabalho');
                            navigate('/perfil');
                        }
                    }}> <XCircle size={18} /> CANCELAR PEDIDO </button>
                    
                    <button className="btn-submeter-final" onClick={handleSubmeter} disabled={itens.length === 0}>
                        <CheckCircle size={18} /> SUBMETER REQUISIÇÃO
                    </button>
                </div>
            </main>

            <footer className="fixed-footer-esp">
                <div className="footer-content-esp centered-content">
                    <span className="footer-project-esp">A TRABALHAR NA REQUISIÇÃO: {eventoAtivo?.nome.toUpperCase()}</span>
                </div>
            </footer>
        </div>
    );
};

export default Carrinho;