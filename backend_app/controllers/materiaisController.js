const db = require('../config/db');

// 1. LISTAR TODOS
exports.listarTodos = async (req, res) => {
    try {
        const isAdmin = req.query.admin === 'true';
        const sql = isAdmin 
            ? 'SELECT * FROM Material ORDER BY nome ASC' 
            : 'SELECT * FROM Material WHERE visivel = 1 ORDER BY nome ASC';
        
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (e) {
        console.error("Erro Listar:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// 2. LISTAR CATEGORIAS
exports.listarCategorias = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (e) {
        res.status(500).json([]);
    }
};

// 3. GET BY ID
exports.getById = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Material WHERE id_material = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Material não encontrado" });
        res.json(rows[0]);
    } catch (e) {
        console.error("Erro getById:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// 4. OCUPAÇÃO
exports.getOcupacao = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT quantidade_disp FROM Material WHERE id_material = ?', [req.params.id]);
        res.json({ disponivel: rows.length > 0 ? rows[0].quantidade_disp : 0 });
    } catch (e) {
        console.error("Erro Ocupacao:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// 5. CRIAR 
exports.criar = async (req, res) => {
    const { nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, id_user } = req.body;
    const imagem_url = req.file ? req.file.filename : null;

    try {
        const [resMat] = await db.execute(
            `INSERT INTO Material (nome, quantidade_total, quantidade_disp, categoria, especificacoes, descricao_tecnica, local_armazenamento, imagem_url, visivel) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`, 
            [nome, quantidade_total, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, imagem_url]
        );
        
        // CORREÇÃO: Removido 'motivo'. Usamos apenas as colunas que existem na imagem.
        await db.execute(
            `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'entrada', ?)`, 
            [id_user || 1, nome, quantidade_total]
        );

        res.status(201).json({ mensagem: "Criado com sucesso", id: resMat.insertId });
    } catch (e) {
        console.error("Erro Criar:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// 6. EDITAR
exports.editar = async (req, res) => {
    const { id } = req.params;
    const { nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, id_user } = req.body; 
    let final_imagem_url = req.file ? req.file.filename : req.body.imagem_url;

    try {
        const [antigo] = await db.execute('SELECT quantidade_total, quantidade_disp, nome FROM Material WHERE id_material = ?', [id]);
        
        let nova_disp = quantidade_total;
        let diferenca = 0;
        
        if (antigo.length > 0) {
            diferenca = quantidade_total - antigo[0].quantidade_total;
            nova_disp = antigo[0].quantidade_disp + diferenca;
        }

        await db.execute(
            `UPDATE Material SET 
                nome=?, quantidade_total=?, categoria=?, especificacoes=?, 
                descricao_tecnica=?, local_armazenamento=?, imagem_url=?,
                quantidade_disp=?
             WHERE id_material=?`, 
            [nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, final_imagem_url, nova_disp, id]
        );
        
        if (diferenca !== 0) {
            const tipo = diferenca > 0 ? 'ajuste (entrada)' : 'ajuste (saida)';
            // CORREÇÃO: Removido 'motivo'.
            await db.execute(
                `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, ?, ?)`, 
                [id_user || 1, nome, tipo, Math.abs(diferenca)]
            );
        }

        res.json({ mensagem: "Atualizado com sucesso" });
    } catch (e) {
        console.error("Erro Editar:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// 7. VISIBILIDADE
exports.alterarVisibilidade = async (req, res) => {
    try {
        const { id } = req.params;
        const { visivel } = req.body;
        await db.execute('UPDATE Material SET visivel = ? WHERE id_material = ?', [visivel, id]);
        res.json({ message: "Visibilidade alterada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. ELIMINAR
exports.eliminar = async (req, res) => {
    try {
        await db.execute('DELETE FROM Material WHERE id_material = ?', [req.params.id]);
        res.json({ message: "Eliminado" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 9. LIMITES DO EVENTO 
exports.getLimitesEvento = async (req, res) => {
    const { idReq } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT e.data_inicio, e.data_fim 
            FROM Requisicao r 
            JOIN Evento e ON r.id_evento = e.id_evento 
            WHERE r.id_req = ?
        `, [idReq]);
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: "Evento não encontrado para esta requisição." });
        }
    } catch (e) {
        console.error("Erro Limites:", e.message);
        res.status(500).json({ error: e.message });
    }
};