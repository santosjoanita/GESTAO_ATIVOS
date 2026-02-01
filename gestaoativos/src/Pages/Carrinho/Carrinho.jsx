import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, CornerDownLeft, Trash2, CheckCircle, XCircle, Calendar } from 'lucide-react';
import './Carrinho.css';
import logo from '../../assets/img/esposende.png';
import Toast from '../../components/Toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';

const Carrinho = ({ onLogout}) => {
    const navigate = useNavigate();
    const [itens, setItens] = useState(JSON.parse(localStorage.getItem('carrinho')) || []);
    const user = JSON.parse(localStorage.getItem('user'));
    const eventoAtivo = JSON.parse(localStorage.getItem('evento_trabalho'));

    const [toast, setToast] = useState(null); 
    const [showModal, setShowModal] = useState(false);

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

    const handleConfirmarCancelamento = () => {
        localStorage.removeItem('carrinho');
        localStorage.removeItem('evento_trabalho');
        setShowModal(false);
        
        if (user?.id_perfil === 2) navigate('/gestao');
        else navigate('/perfil');
    };

    const handleSubmeter = async () => {
        if (itens.length === 0) {
            setToast({ type: 'warning', message: "O carrinho está vazio!" });
            return;
        }

        const itensInvalidos = itens.filter(i => !i.levantamento || !i.devolucao);
        if (itensInvalidos.length > 0) {
            setToast({ type: 'error', message: "Erro: Itens com datas em falta." });
            return;
        }

        const payload = { 
            materiais: itens,
            id_user_action: user.id_user 
        };

        try {
            const res = await fetch(`http://localhost:3002/api/requisicoes/${eventoAtivo.id_req}/submeter`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                localStorage.removeItem('carrinho');
                localStorage.removeItem('evento_trabalho');
                
                const isGestor = user.id_perfil === 2 || user.id_cargo === 1;

                if (isGestor) {
                    setToast({ type: 'success', message: "Materiais adicionados! A voltar à gestão..." });
                    setTimeout(() => navigate('/gestao'), 1500);
                } else {
                    setToast({ type: 'success', message: "Pedido submetido com sucesso!" });
                    setTimeout(() => navigate('/perfil'), 2000);
                }

            } else {
                const err = await res.json();
                setToast({ type: 'error', message: "Erro: " + (err.message || "Falha ao submeter") });
            }
        } catch (e) {
            setToast({ type: 'error', message: "Erro de conexão ao servidor." });
        }
    };

    const removerItem = (index) => {
        const novos = [...itens];
        novos.splice(index, 1);
        setItens(novos);
        localStorage.setItem('carrinho', JSON.stringify(novos));
        setToast({ type: 'success', message: "Item removido." });
    };

    const atualizarData = (index, campo, valor) => {
    const novos = [...itens];
    novos[index][campo] = valor;
    setItens(novos);
    localStorage.setItem('carrinho', JSON.stringify(novos));
};

        const handleLogout = () => {
        localStorage.clear();
        if (onLogout) onLogout();
        navigate('/');

    };


    return (
        <div className="layout-padrao-carrinho">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <ModalConfirmacao 
                isOpen={showModal}
                title="Cancelar Pedido"
                message="Tem a certeza? Isto vai apagar todos os itens do carrinho e sair do modo de trabalho."
                confirmText="Sim, Apagar Tudo"
                confirmColor="#e74c3c"
                onConfirm={handleConfirmarCancelamento}
                onCancel={() => setShowModal(false)}
            />

            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate(user?.id_perfil === 2 ? '/gestao' : '/home')} 
    style={{cursor:'pointer'}} />
                    <nav className="header-nav-esp">
                        <Link to="/explorar" className="nav-item-esp">CATÁLOGO</Link>
                        {user?.id_perfil === 2 
                            ? <Link to="/gestao" className="nav-item-esp">GESTÃO</Link>
                            : <Link to="/perfil" className="nav-item-esp">PERFIL</Link>
                        }
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
                            <User size={24} className="icon-esp active-icon-indicator" />
                        </Link>

                        <button onClick={handleLogout} className="logout-btn">
                            <CornerDownLeft size={24} className="icon-esp" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="carrinho-main">
                <div className="carrinho-info-topo">
                    <h2>O TEU CARRINHO</h2>
                    <p>Confirme os seus itens e as datas antes de submeter.</p>
                </div>

                <div className="tabela-container-esp">
                    <table className="tabela-carrinho">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantidade</th>
                                <th>Levantamento</th>
                                <th>Devolução</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.length > 0 ? (
                                itens.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.nome}</td>
                                        <td><strong>{item.quantidade}</strong></td>
                                        <td>
                                            <div className="input-icon-wrapper">
                                                <Calendar size={14} className="input-icon"/>
                                                <input type="date" value={item.levantamento} onChange={(e) => atualizarData(idx, 'levantamento', e.target.value)} />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="input-icon-wrapper">
                                                <Calendar size={14} className="input-icon"/>
                                                <input type="date" value={item.devolucao} onChange={(e) => atualizarData(idx, 'devolucao', e.target.value)} />
                                            </div>
                                        </td>
                                        <td style={{textAlign:'center'}}>
                                            <Trash2 size={18} className="remover-btn-esp" onClick={() => removerItem(idx)} style={{cursor:'pointer', color:'#e74c3c'}} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#888'}}>
                                        O seu carrinho está vazio. Vá ao catálogo adicionar materiais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="carrinho-acoes-finais">
                    <button className="btn-cancelar-total" onClick={() => setShowModal(true)}> 
                        <XCircle size={18} /> CANCELAR PEDIDO 
                    </button>
                    
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