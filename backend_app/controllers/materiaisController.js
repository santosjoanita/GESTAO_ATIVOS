const db = require('../config/db');

// 1. LISTAR MATERIAIS (Catálogo)
exports.listarTodos = async (req, res) => {
    const isAdmin = req.query.admin === 'true';
    const sql = isAdmin 
        ? 'SELECT * FROM Material ORDER BY nome ASC' 
        : 'SELECT * FROM Material WHERE visivel = 1 ORDER BY nome ASC';
    
    try {
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
};

// 2. CRIAR MATERIAL 
exports.criar = async (req, res) => {
    const { nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, id_user } = req.body;
    const imagem_url = req.file ? req.file.filename : null;

    try {
        // Inserir o material
        const [resMat] = await db.execute(
            `INSERT INTO Material (nome, quantidade_total, quantidade_disp, categoria, especificacoes, descricao_tecnica, local_armazenamento, imagem_url, visivel) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`, 
            [nome, quantidade_total, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, imagem_url]
        );
        
        // Registar no Histórico 
        await db.execute(
            `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'Adicionou', ?)`, 
            [id_user || 1, nome, quantidade_total]
        );

        res.status(201).json({ mensagem: "Criado com sucesso", id: resMat.insertId });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
};

// 3. EDITAR MATERIAL
exports.editar = async (req, res) => {
    const { id } = req.params;
    const { nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, id_user } = req.body;
    let final_imagem_url = req.file ? req.file.filename : req.body.imagem_url;

    try {
        await db.execute(
            `UPDATE Material SET 
                nome=?, quantidade_total=?, categoria=?, especificacoes=?, 
                descricao_tecnica=?, local_armazenamento=?, imagem_url=?, 
                quantidade_disp=? 
             WHERE id_material=?`, 
            [nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, final_imagem_url, quantidade_total, id]
        );
        
        res.json({ mensagem: "Atualizado com sucesso" });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
};

// 4. LISTAR CATEGORIAS (Para os filtros do catálogo)
exports.listarCategorias = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (e) {
        res.status(500).json([]);
    }
};