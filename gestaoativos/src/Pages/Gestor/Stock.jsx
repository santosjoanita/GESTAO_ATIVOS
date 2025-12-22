import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Package } from 'lucide-react';
import './Stock.css';

const Stock = () => {
    const navigate = useNavigate();
    const [materiais, setMateriais] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [formData, setFormData] = useState({ 
        nome: '', 
        quantidade: 0, 
        categoria: '', 
        descricao_tecnica: '', 
        local_armazenamento: '' 
    });

    const fetchMateriais = async () => {
        const res = await fetch('http://localhost:3001/api/materiais');
        const data = await res.json();
        setMateriais(data);
    };

    useEffect(() => { fetchMateriais(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        // Lógica de envio para o servidor
        await fetch('http://localhost:3001/api/materiais/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ...formData, id_material: selectedMaterial?.id_material })
        });
        alert("Stock Atualizado!");
        fetchMateriais();
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
                            <tr><th>Material</th><th>Categoria</th><th>Stock</th><th>Ação</th></tr>
                        </thead>
                        <tbody>
                            {materiais.map(m => (
                                <tr key={m.id_material}>
                                    <td><strong>{m.nome}</strong></td>
                                    <td>{m.categoria || 'Geral'}</td>
                                    <td>{m.quantidade}</td>
                                    <td><button onClick={() => setSelectedMaterial(m)}>EDITAR</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="stock-form-section">
                    <h3>{selectedMaterial ? `Especificações: ${selectedMaterial.nome}` : 'IMPORTAR NOVO MATERIAL'}</h3>
                    <form onSubmit={handleSave} className="extended-form">
                        <label>Nome do Ativo</label>
                        <input type="text" placeholder="Ex: Monitor Dell 24" onChange={e => setFormData({...formData, nome: e.target.value})} />
                        
                        <div className="form-row">
                            <div>
                                <label>Quantidade</label>
                                <input type="number" onChange={e => setFormData({...formData, quantidade: e.target.value})} />
                            </div>
                            <div>
                                <label>Categoria</label>
                                <select onChange={e => setFormData({...formData, categoria: e.target.value})}>
                                    <option value="Informatica">Informática</option>
                                    <option value="Mobiliario">Mobiliário</option>
                                    <option value="Som/Video">Som e Vídeo</option>
                                </select>
                            </div>
                        </div>

                        <label>Especificações Técnicas / Notas</label>
                        <textarea placeholder="Nº de Série, voltagem, estado de conservação..." onChange={e => setFormData({...formData, descricao_tecnica: e.target.value})} />

                        <label>Local de Armazenamento</label>
                        <input type="text" placeholder="Ex: Armazém Central - Prateleira B" onChange={e => setFormData({...formData, local_armazenamento: e.target.value})} />

                        <button type="submit" className="btn-submeter">GUARDAR NO SISTEMA</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Stock;