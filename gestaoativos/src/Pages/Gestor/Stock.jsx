import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// ADICIONADO: Search e Filter aos imports
import { LogOut, User, Plus, Save, Upload, X, Search, Filter } from 'lucide-react';
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

    // --- NOVOS ESTADOS PARA PESQUISA E FILTRO ---
    const [searchTerm, setSearchTerm] = useState('');
    const [categoriaFilter, setCategoriaFilter] = useState('todas');

    const [formData, setFormData] = useState({ 
        nome: '', quantidade_total: 0, categoria: '', especificacoes: '', 
        descricao_tecnica: '', local_armazenamento: '', imagem_url: '' 
    });

   const getAuthHeaders = () => {
    const storedData = localStorage.getItem('user');
    const user = storedData ? JSON.parse(storedData) : null;
    
        return {
            'Authorization': user && user.token ? `Bearer ${user.token}` : ''
        };
    };

    const fetchMateriais = async () => {
        const res = await fetch('http://localhost:3002/api/materiais?admin=true', { headers: getAuthHeaders() });
        const data = await res.json();
        setMateriais(data); 
    };

    const fetchCategorias = async () => {
        const res = await fetch('http://localhost:3002/api/materiais/categorias', { headers: getAuthHeaders() });
        setCategoriasBD(await res.json());
    };

    useEffect(() => { fetchMateriais(); fetchCategorias(); }, []);

    const handleToggleVisibilidade = async (material) => {
        const novaVisibilidade = material.visivel ? 0 : 1;
        if (window.confirm(`Deseja alterar a visibilidade de "${material.nome}"?`)) {
            try {
                await fetch(`http://localhost:3002/api/materiais/${material.id_material}/visibilidade`, {
                    method: 'PUT',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visivel: novaVisibilidade, id_user: user?.id_user })
                });
                fetchMateriais();
            } catch (err) { console.error(err); }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('id_user', user?.id_user);
        if (imageFile) data.append('imagem', imageFile);

        const isEditing = !!selectedMaterial?.id_material;
        const url = isEditing ? `http://localhost:3002/api/materiais/${selectedMaterial.id_material}` : 'http://localhost:3002/api/materiais';
        
        try {
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: data 
            });
            if (res.ok) { fetchMateriais(); setShowModal(false); resetForm(); }
        } catch (err) { console.error(err); }
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

    // --- LÓGICA DE FILTRAGEM ---
    const filteredMateriais = materiais.filter(m => {
        const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoriaFilter === 'todas' || m.categoria === categoriaFilter;
        
        return matchesSearch && matchesCategory;
    });

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

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                    
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input 
                            type="text" 
                            placeholder="Pesquisar material por nome..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 40px',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative', minWidth: '250px' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <select 
                            value={categoriaFilter}
                            onChange={(e) => setCategoriaFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 40px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                cursor: 'pointer',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="todas">Todas as Categorias</option>
                            {categoriasBD.map(cat => (
                                <option key={cat.id_categoria} value={cat.nome}>{cat.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="stock-table-section full-width">
                    <table>
                        <thead>
                            <tr>
                                <th>Foto</th>
                                <th>Material</th>
                                <th>Categoria</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMateriais.length > 0 ? (
                                filteredMateriais.map(m => (
                                    <tr key={m.id_material}>
                                        <td>
                                            <img 
                                                src={m.imagem_url ? `http://localhost:3002/uploads/${m.imagem_url}` : 'https://via.placeholder.com/50'} 
                                                alt="Material" 
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td><strong>{m.nome}</strong></td>
                                        <td>{m.categoria}</td>
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                        Nenhum material encontrado com esses filtros.
                                    </td>
                                </tr>
                            )}
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
                                
                                <div className="form-group" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '5px', textTransform: 'uppercase' }}>
                                        Especificações Técnicas
                                    </label>
                                    <textarea 
                                        value={formData.especificacoes} 
                                        onChange={e => setFormData({...formData, especificacoes: e.target.value})}
                                        placeholder="Dimensões, peso, voltagem..."
                                        style={{ 
                                            width: '100%', 
                                            minHeight: '80px', 
                                            padding: '10px', 
                                            borderRadius: '6px', 
                                            border: '1px solid #e2e8f0', 
                                            background: '#f8fafc',
                                            boxSizing: 'border-box',
                                            fontFamily: 'inherit',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                <label>Foto do Material</label>
                                <label className="file-input-label">
                                    <Upload size={18} /> {imageFile ? "Imagem Pronta" : "Selecionar Foto"}
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(file) {
                                            setImageFile(file);
                                            setFormData({...formData, imagem_url: URL.createObjectURL(file)});
                                        }
                                    }} style={{display: 'none'}} />
                                </label>
                                {formData.imagem_url && (
                                    <img 
                                        src={formData.imagem_url.startsWith('blob') ? formData.imagem_url : `http://localhost:3002/uploads/${formData.imagem_url}`} 
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