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
        res.status(500).json({
            code: "500",
            message: "erro",
            erro: e.message
             });
    }
};
exports.listarCategorias = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (e) {
        res.status(500).json([]);
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
        res.status(500).json({
            code: "500",
            message: "erro",
            erro: e.message
             });
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
        res.status(500).json({
            code: "500",
            message: "erro",
            erro: e.message 
            });
    }
};

// 4. LISTAR CATEGORIAS 
exports.listarCategorias = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (e) {
        res.status(500).json([]);
    }
};

exports.verDetalhe = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Material WHERE id_material = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Material não encontrado" });
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({
            code: "500",
            message: "erro",
            erro: e.message 
            });
    }
};
exports.alterarVisibilidade = async (req, res) => {
    try {
        const { id } = req.params;
        const { visivel } = req.body;

        if (visivel === undefined) {
            return res.status(400).json({ message: "O estado de visibilidade é obrigatório." });
        }

        const [result] = await db.execute(
            'UPDATE Material SET visivel = ? WHERE id_material = ?',
            [visivel, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material não encontrado." });
        }

        res.json({ message: "Visibilidade alterada com sucesso" });

    } catch (error) {
        console.error("Erro ao alterar visibilidade:", error);
        res.status(500).json({ message: "Erro interno", erro: error.message });
    }
};

// 5. VER OCUPAÇÃO DO MATERIAL
exports.verOcupacaoMaterial = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT data_saida, data_devolucao, quantidade 
             FROM RequisicaoItem ri
             JOIN Requisicao r ON ri.id_req = r.id_req
             WHERE ri.id_material = ? AND r.id_estado IN (1, 2)`, 
            [req.params.id]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json([]);
    }
};

exports.getDatasLimiteEvento = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT e.data_inicio, e.data_fim 
            FROM Requisicao r
            JOIN Evento e ON r.id_evento = e.id_evento
            WHERE r.id_req = ?`, [req.params.id_req]);
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json(null);
    }
};