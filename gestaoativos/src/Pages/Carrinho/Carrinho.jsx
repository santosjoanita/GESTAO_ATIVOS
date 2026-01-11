import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Trash2, CheckCircle, XCircle } from 'lucide-react';
import './Carrinho.css';
import logo from '../../assets/img/esposende.png';

const Carrinho = () => {
    const navigate = useNavigate();
    const [itens, setItens] = useState(JSON.parse(localStorage.getItem('carrinho')) || []);
    const user = JSON.parse(localStorage.getItem('user'));
    const eventoAtivo = JSON.parse(localStorage.getItem('evento_trabalho'));

    const handleSubmeter = async () => {
        if (itens.length === 0) return alert("Carrinho vazio!");
        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${eventoAtivo.id_req}/submeter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materiais: itens })
            });
            if (res.ok) {
                localStorage.removeItem('carrinho');
                localStorage.removeItem('evento_trabalho');
                navigate('/perfil');
            }
        } catch (error) { console.error(error); }
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
                </div>

                <div className="tabela-container-esp">
                    <table className="tabela-carrinho">
                        <thead>
                            <tr>
                                <th>MATERIAL</th>
                                <th>QUANTIDADE</th>
                                <th>RESERVA</th>
                                <th>AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.nome}</td>
                                    <td>{item.quantidade}</td>
                                    <td>{item.levantamento} até {item.devolucao}</td>
                                    <td>
                                        <Trash2 className="remover-btn-esp" onClick={() => {
                                            const novo = itens.filter((_, i) => i !== idx);
                                            setItens(novo);
                                            localStorage.setItem('carrinho', JSON.stringify(novo));
                                        }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="carrinho-acoes-finais">
                    <button className="btn-cancelar-total" onClick={() => {
                        localStorage.removeItem('carrinho');
                        localStorage.removeItem('evento_trabalho');
                        navigate('/perfil');
                    }}> <XCircle size={18} /> CANCELAR </button>
                    
                    <button className="btn-submeter-final" onClick={handleSubmeter}>
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