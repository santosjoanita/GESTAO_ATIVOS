import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Package, Plus, Save, Upload, X, Eye, EyeOff } from 'lucide-react';
import './Stock.css';
import logo from '../../assets/img/esposende.png';

const Stock = () => {
    const navigate = useNavigate();
    const [materiais, setMateriais] = useState([]);
    const [categoriasBD, setCategoriasBD] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [imageFile, setImageFile] = useState(null); 
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

    const handleToggleVisibilidade = async (material) => {
        const novaVisibilidade = material.visivel ? 0 : 1;
        const acaoTexto = novaVisibilidade ? "mostrar" : "ocultar";

        if (window.confirm(`Tem a certeza que quer ${acaoTexto} o material "${material.nome}"?`)) {
            try {
                await fetch(`http://localhost:3001/api/materiais/${material.id_material}/visibilidade`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visivel: novaVisibilidade, id_user: user?.id_user })
                });
                fetchMateriais();
            } catch (err) { console.error(err); }
        }
    };

    const handleSave = async (e) => {
    e.preventDefault();

    // 1. Preparar o FormData 
    const data = new FormData();
    data.append('nome', formData.nome);
    data.append('quantidade_total', formData.quantidade_total);
    data.append('categoria', formData.categoria);
    data.append('especificacoes', formData.especificacoes);
    data.append('descricao_tecnica', formData.descricao_tecnica);
    data.append('local_armazenamento', formData.local_armazenamento);
    data.append('id_user', user?.id_user);

    if (selectedMaterial) {
        data.append('imagem_url', formData.imagem_url);
    }

    if (imageFile) {
        data.append('imagem', imageFile); 
    }

    // 2. Lógica de Rota REST
    const isEditing = !!selectedMaterial?.id_material;
    

    const url = isEditing 
        ? `http://localhost:3001/api/materiais/${selectedMaterial.id_material}` 
        : 'http://localhost:3001/api/materiais';
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            body: data 
        });

        if (res.ok) { 
            await fetchMateriais(); 
            setShowModal(false); 
            resetForm(); 
        } else {
            const errorMsg = await res.text();
            alert("Erro ao guardar material: " + errorMsg);
        }
    } catch (err) {
        console.error("Erro na ligação:", err);
        alert("Erro ao ligar ao servidor. Verifique se o backend está a correr.");
    }
};

    const resetForm = () => {
        setSelectedMaterial(null);
        setImageFile(null);
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
                                <th>Foto</th>
                                <th>Material</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materiais.map(m => (
                                <tr key={m.id_material}>
                                    <td>
                                        <img 
                                            src={m.imagem_url ? `http://localhost:3001/uploads/${m.imagem_url}` : 'https://via.placeholder.com/50'} 
                                            alt="Material" 
                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    </td>
                                    <td><strong>{m.nome}</strong></td>
                                    <td>{m.quantidade_total}</td>
                                    <td>
                                        <span className={`status-badge ${m.visivel ? 'aprovado' : 'rejeitado'}`}>
                                            {m.visivel ? 'Visível' : 'Oculto'}
                                        </span>
                                    </td>
                                    <td className="table-actions-cell">
                                        <button className="btn-edit" onClick={() => abrirEdicao(m)}>EDITAR</button>
                                        <button 
                                            className={m.visivel ? "btn-reject" : "btn-approve"} 
                                            onClick={() => handleToggleVisibilidade(m)}
                                            style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '11px' }}
                                        >
                                            {m.visivel ? "OCULTAR" : "MOSTRAR"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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

                                <label>Foto do Material</label>
                                <label className="file-input-label">
                                    <Upload size={18} /> {imageFile ? "Imagem Pronta" : "Selecionar Foto"}
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(file) {
                                            setImageFile(file);
                                            // Apenas para ver o preview no modal antes de guardar
                                            setFormData({...formData, imagem_url: URL.createObjectURL(file)});
                                        }
                                    }} style={{display: 'none'}} />
                                </label>
                                {formData.imagem_url && (
                                    <img 
                                        src={formData.imagem_url.startsWith('blob') ? formData.imagem_url : `http://localhost:3001/uploads/${formData.imagem_url}`} 
                                        className="preview-img-small" 
                                        alt="Preview" 
                                        style={{ width: '80px', height: '80px', marginTop: '10px', objectFit: 'cover' }}
                                    />
                                )}

                                <label>Localização</label>
                                <select 
                                    value={formData.local_armazenamento} 
                                    onChange={e => setFormData({...formData, local_armazenamento: e.target.value})} 
                                    required
                                >
                                    <option value="">Selecionar armazém...</option>
                                    <option value="Bouro">Bouro</option>
                                    <option value="Armazém Municipal Central">Armazém Municipal Central</option>
                                    <option value="Instalações SGE">Instalações SGE</option>
                                    <option value="Instalações DSSA">Instalações DSSA</option>
                                    <option value="Fórum Rodrigues Sampaio">Fórum Rodrigues Sampaio</option>
                                    <option value="Biblioteca Municipal">Biblioteca Municipal</option>
                                    <option value="Auditório Municipal">Auditório Municipal</option>
                                    <option value="Instalações SMPC">Instalações SMPC</option>
                                    <option value="Estaleiro Municipal">Estaleiro Municipal</option>
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