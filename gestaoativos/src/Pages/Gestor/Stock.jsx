import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Package, Plus, Save, Upload, X } from 'lucide-react';
import './Stock.css';
import logo from '../../assets/img/esposende.png';

const Stock = () => {
    const navigate = useNavigate();
    const [materiais, setMateriais] = useState([]);
    const [categoriasBD, setCategoriasBD] = useState([]);
    const [showModal, setShowModal] = useState(false); // Controla o formulário
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    const [formData, setFormData] = useState({ 
        nome: '', quantidade_total: 0, categoria: '', especificacoes: '', 
        descricao_tecnica: '', local_armazenamento: '', imagem_url: '' 
    });

    const fetchMateriais = async () => {
        const res = await fetch('http://localhost:3001/api/materiais?admin=true');
        setMateriais(await res.json());
    };

    const fetchCategorias = async () => {
        const res = await fetch('http://localhost:3001/api/categorias');
        setCategoriasBD(await res.json());
    };

    useEffect(() => { fetchMateriais(); fetchCategorias(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:3001/api/materiais/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ...formData, id_material: selectedMaterial?.id_material, id_user_responsavel: user?.id })
        });
        if (res.ok) { fetchMateriais(); setShowModal(false); resetForm(); }
    };

    const resetForm = () => {
        setSelectedMaterial(null);
        setFormData({ nome: '', quantidade_total: 0, categoria: '', especificacoes: '', descricao_tecnica: '', local_armazenamento: '', imagem_url: '' });
    };

    const abrirEdicao = (material) => {
        setSelectedMaterial(material);
        setFormData(material);
        setShowModal(true);
    };

    return (
        <div className="gestao-layout">
            <header className="fixed-header-esp">
                <div className="header-content-esp centered-content">
                    <img src={logo} alt="Logo" className="logo-img" />
                    <nav className="header-nav-esp">
                        <button onClick={() => navigate('/gestao')} className="nav-item-esp">DASHBOARD</button>
                        <button className="nav-item-esp active-tab-indicator">STOCK</button>
                    </nav>
                    <div className="header-icons-esp">
                        <Link to="/perfil"><User size={22} className="icon-esp" /></Link>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="logout-btn"><LogOut size={24} className="icon-esp" /></button>
                    </div>
                </div>
            </header>

            <main className="stock-container">
                <div className="stock-header-actions">
                    <h2>Gestão de Inventário</h2>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-new">
                        <Plus size={18}/> NOVO MATERIAL
                    </button>
                </div>

                <div className="stock-table-section full-width">
                    <table>
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materiais.map(m => (
                                <tr key={m.id_material}>
                                    <td><strong>{m.nome}</strong></td>
                                    <td>{m.quantidade_total}</td>
                                    <td>{m.visivel ? 'Visível' : 'Oculto'}</td>
                                    <td><button className="btn-edit" onClick={() => abrirEdicao(m)}>EDITAR</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MODAL DO FORMULÁRIO */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content stock-modal">
                            <div className="modal-header">
                                <h3>{selectedMaterial ? 'Editar Material' : 'Novo Material'}</h3>
                                <button onClick={() => setShowModal(false)} className="close-btn"><X /></button>
                            </div>
                            <form onSubmit={handleSave} className="extended-form modal-body">
                                <label>Nome</label>
                                <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
                                
                                <div className="form-row">
                                    <div style={{flex:1}}>
                                        <label>Quantidade</label>
                                        <input type="number" value={formData.quantidade_total} onChange={e => setFormData({...formData, quantidade_total: e.target.value})} required />
                                    </div>
                                    <div style={{flex:1}}>
                                        <label>Categoria</label>
                                        <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} required>
                                            <option value="">Selecionar...</option>
                                            {categoriasBD.map(cat => <option key={cat.id_categoria} value={cat.nome}>{cat.nome}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <label>Especificações</label>
                                <input type="text" placeholder="ex: 200x50cm" value={formData.especificacoes} onChange={e => setFormData({...formData, especificacoes: e.target.value})} />

                                <label>Descrição Técnica</label>
                                <textarea value={formData.descricao_tecnica} onChange={e => setFormData({...formData, descricao_tecnica: e.target.value})} />

                                <label>Foto do Material</label>
                                <label className="file-input-label">
                                    <Upload size={18} /> {formData.imagem_url ? "Trocar Foto" : "Selecionar Foto"}
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onloadend = () => setFormData({...formData, imagem_url: reader.result});
                                        if(file) reader.readAsDataURL(file);
                                    }} style={{display: 'none'}} />
                                </label>
                                {formData.imagem_url && <img src={formData.imagem_url} className="preview-img-small" alt="Preview" />}

                                <label>Localização</label>
                                <select value={formData.local_armazenamento} onChange={e => setFormData({...formData, local_armazenamento: e.target.value})} required>
                                    <option value="">Selecionar local...</option>
                                    <option value="Bouro">Bouro</option>
                                    <option value="Armazém Central">Armazém Central</option>
                                </select>

                                <button type="submit" className="btn-submeter"><Save size={18}/> GUARDAR NO SISTEMA</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Stock;