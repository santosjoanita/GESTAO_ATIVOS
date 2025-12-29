import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Stock.css';

const Stock = () => {
    const navigate = useNavigate();
    const [materiais, setMateriais] = useState([]);
    const [categoriasBD, setCategoriasBD] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    
    const [formData, setFormData] = useState({ 
        nome: '', 
        quantidade_total: 0,
        categoria: '', 
        especificacoes: '', 
        descricao_tecnica: '', 
        local_armazenamento: '' 
    });

    // Carrega materiais existentes
    const fetchMateriais = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/materiais');
            const data = await res.json();
            setMateriais(data);
        } catch (err) {
            console.error("Erro ao carregar materiais:", err);
        }
    };

    // Carrega as categorias da tabela Categoria da BD
    const fetchCategorias = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/categorias');
            const data = await res.json();
            setCategoriasBD(data);
        } catch (err) {
            console.error("Erro ao carregar categorias:", err);
        }
    };

    useEffect(() => { 
        fetchMateriais(); 
        fetchCategorias();
    }, []);

    // Sincroniza o formulário para edição
    useEffect(() => {
        if (selectedMaterial) {
            setFormData({
                nome: selectedMaterial.nome || '',
                quantidade_total: selectedMaterial.quantidade_total || 0,
                categoria: selectedMaterial.categoria || '',
                especificacoes: selectedMaterial.especificacoes || '', 
                descricao_tecnica: selectedMaterial.descricao_tecnica || '',
                local_armazenamento: selectedMaterial.local_armazenamento || ''
            });
        }
    }, [selectedMaterial]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/materiais/update', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    ...formData, 
                    id_material: selectedMaterial?.id_material,
                    quantidade_disp: formData.quantidade_total 
                })
            });

            if (res.ok) {
                alert("Stock Atualizado!");
                await fetchMateriais();
                setFormData({ nome: '', quantidade_total: 0, categoria: '', especificacoes: '', descricao_tecnica: '', local_armazenamento: '' });
                setSelectedMaterial(null);
            } else {
                const errorData = await res.text();
                alert("Erro ao gravar: " + errorData);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="stock-container">
            <header className="stock-header-actions">
                <button onClick={() => navigate('/gestao')} className="btn-back">
                    <ArrowLeft size={18} /> VOLTAR À DASHBOARD
                </button>
                <h2>GESTÃO DE INVENTÁRIO</h2>
            </header>

            <div className="stock-grid">
                <div className="stock-table-section">
                    <table>
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Especificação</th>
                                <th>Stock Total</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materiais.map(m => (
                                <tr key={m.id_material}>
                                    <td><strong>{m.nome}</strong></td>
                                    <td>{m.especificacoes || '---'}</td>
                                    <td>{m.quantidade_total}</td>
                                    <td>
                                        <button className="btn-edit" onClick={() => setSelectedMaterial(m)}>EDITAR</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="stock-form-section">
                    <h3>{selectedMaterial ? `Editar: ${selectedMaterial.nome}` : 'IMPORTAR NOVO MATERIAL'}</h3>
                    <form onSubmit={handleSave} className="extended-form">
                        <label>Nome do Ativo</label>
                        <input 
                            type="text" required
                            value={formData.nome}
                            onChange={e => setFormData({...formData, nome: e.target.value})} 
                        />
                        
                        <div className="form-row">
                            <div style={{flex: 1}}>
                                <label>Quantidade Total</label>
                                <input 
                                    type="number" required
                                    value={formData.quantidade_total}
                                    onChange={e => setFormData({...formData, quantidade_total: e.target.value})} 
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Categoria (da BD)</label>
                                <select 
                                required 
                                value={formData.categoria}
                                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                            >
                                <option value="">Selecione uma categoria...</option>
                                {/* categoriasBD vem do fetch que fazes para /api/categorias */}
                                {categoriasBD.map(cat => (
                                    <option key={cat.id_categoria} value={cat.nome}>
                                        {cat.nome}
                                    </option>
                                ))}
                            </select>
                            </div>
                        </div>

                        <label>Especificação (Medidas, Cores, etc.)</label>
                        <input 
                            type="text" 
                            value={formData.especificacoes}
                            placeholder="Ex: 3 metros / 189x64x40cm" 
                            onChange={e => setFormData({...formData, especificacoes: e.target.value})} 
                        />

                        <label>Descrição Técnica / Notas</label>
                        <textarea 
                            value={formData.descricao_tecnica}
                            onChange={e => setFormData({...formData, descricao_tecnica: e.target.value})} 
                        />

                        <label>Local de Armazenamento</label>
                        <select 
                            required
                            value={formData.local_armazenamento}
                            onChange={e => setFormData({...formData, local_armazenamento: e.target.value})}
                        >
                            <option value="">Selecione o local...</option>
                            <option value="Bouro">Bouro (Stands e Tendas)</option>
                            <option value="Armazém Municipal Central">Armazém Municipal Central</option>
                            <option value="Instalações DSSA">Instalações DSSA</option>
                            <option value="Estaleiro Municipal">Estaleiro Municipal</option>
                        </select>

                        <button type="submit" className="btn-submeter">
                            {selectedMaterial ? 'ATUALIZAR REGISTO' : 'GUARDAR NO SISTEMA'}
                        </button>
                        {selectedMaterial && (
                            <button type="button" className="btn-cancel" onClick={() => setSelectedMaterial(null)}>
                                CANCELAR EDIÇÃO
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Stock;