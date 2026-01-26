const db = require('../config/db');

// 1. LISTAR TODAS
exports.listarTodas = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, u.nome as requerente, e.nome_evento, er.nome_estado as estado_nome
            FROM Requisicao r
            JOIN Utilizador u ON r.id_user = u.id_user
            LEFT JOIN Evento e ON r.id_evento = e.id_evento
            LEFT JOIN Estado_Requisicao er ON r.id_estado_req = er.id_estado_req
            ORDER BY r.data_pedido DESC
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: "Erro interno." });
    }
};

// 2. LISTAR POR USER
exports.listarPorUser = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, e.nome_evento, er.nome_estado as estado_nome
            FROM Requisicao r
            LEFT JOIN Evento e ON r.id_evento = e.id_evento
            LEFT JOIN Estado_Requisicao er ON r.id_estado_req = er.id_estado_req
            WHERE r.id_user = ?
            ORDER BY r.data_pedido DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: "Erro ao carregar perfil." });
    }
};

// 3. CRIAR REQUISIÇÃO (Vazia)
exports.criar = async (req, res) => {
    const { id_user, id_evento, descricao } = req.body;
    try {
        const [result] = await db.execute(
            `INSERT INTO Requisicao (id_user, id_evento, data_pedido, id_estado_req, descricao) 
             VALUES (?, ?, NOW(), 1, ?)`,
            [id_user, id_evento, descricao || "Sem descrição"]
        );
        res.status(201).json({ id_req: result.insertId });
    } catch (e) {
        res.status(500).json({ error: "Erro ao criar requisição." });
    }
};

// 4. SUBMETER MATERIAIS (AGORA CONSOME STOCK IMEDIATAMENTE)
exports.submeterMateriais = async (req, res) => {
    const { id } = req.params; 
    const { materiais } = req.body; 

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.execute('DELETE FROM RequisicaoItem WHERE id_req = ?', [id]);
        
        for (const m of materiais) {
            // 1. Inserir item
            await connection.execute(
                `INSERT INTO RequisicaoItem (id_req, id_material, quantidade, data_saida, data_devolucao) 
                 VALUES (?, ?, ?, ?, ?)`,
                [id, m.id_material, m.quantidade, m.levantamento, m.devolucao]
            );

            // 2. ATUALIZAÇÃO CRÍTICA: Descontar stock IMEDIATAMENTE
            await connection.execute(
                'UPDATE Material SET quantidade_disp = quantidade_disp - ? WHERE id_material = ?',
                [m.quantidade, m.id_material]
            );

            // 3. Registar Histórico
            await connection.execute(
                `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) 
                 VALUES (?, ?, 'reserva (pendente)', ?)`,
                [1, m.nome, m.quantidade] 
            );
        }

        await connection.commit();
        res.status(200).json({ message: "Materiais reservados com sucesso!" });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// 5. ATUALIZAR ESTADO (Gestor: Aprovar ou Rejeitar)
exports.atualizarEstado = async (req, res) => {
    const { id } = req.params; 
    const { id_estado } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        if (parseInt(id_estado) === 3) {
            const [itens] = await connection.execute('SELECT id_material, quantidade FROM RequisicaoItem WHERE id_req = ?', [id]);
            for (const item of itens) {
                await connection.execute(
                    'UPDATE Material SET quantidade_disp = quantidade_disp + ? WHERE id_material = ?',
                    [item.quantidade, item.id_material]
                );
            }
        }

        await connection.execute(`UPDATE Requisicao SET id_estado_req = ? WHERE id_req = ?`, [id_estado, id]);
        await connection.commit();
        res.json({ msg: "Estado atualizado." });
    } catch (e) {
        await connection.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        connection.release();
    }
};

// 6. DEVOLVER REQUISIÇÃO
exports.devolverRequisicao = async (req, res) => {
    const { id } = req.params; 
    const { id_user } = req.body; 
    const connection = await db.getConnection(); 
    try {
        await connection.beginTransaction();
        const [reqInfo] = await connection.execute('SELECT id_estado_req FROM Requisicao WHERE id_req = ?', [id]);
        if (reqInfo.length === 0 || reqInfo[0].id_estado_req === 5) {
            await connection.rollback(); connection.release(); return res.status(400).json({error:"Inválido"});
        }

        const [itens] = await connection.execute('SELECT id_material, quantidade FROM RequisicaoItem WHERE id_req = ?', [id]);
        for (const item of itens) {
            await connection.execute('UPDATE Material SET quantidade_disp = quantidade_disp + ? WHERE id_material = ?', [item.quantidade, item.id_material]);
            await connection.execute('UPDATE RequisicaoItem SET data_devolucao = CURDATE() WHERE id_req = ? AND id_material = ?', [id, item.id_material]);
            const [mat] = await connection.execute('SELECT nome FROM Material WHERE id_material = ?', [item.id_material]);
            await connection.execute(`INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'devolucao', ?)`, [id_user || 1, mat[0].nome, item.quantidade]);
        }
        await connection.execute('UPDATE Requisicao SET id_estado_req = 5 WHERE id_req = ?', [id]);
        await connection.execute(`INSERT INTO Historico_Requisicao (id_req, id_user, acao, detalhes, data_acao) VALUES (?, ?, 'Finalizada', 'Devolução', NOW())`, [id, id_user || 1]);
        await connection.commit();
        res.json({ message: "Devolvido." });
    } catch (error) { await connection.rollback(); res.status(500).json({ error: error.message }); }
    finally { if (connection) connection.release(); }
};

// 7. CANCELAR REQUISIÇÃO
exports.cancelarRequisicao = async (req, res) => {
    const { id } = req.params;
    const { id_user } = req.body; 
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [reqInfo] = await connection.execute('SELECT id_estado_req FROM Requisicao WHERE id_req = ?', [id]);
        if (reqInfo.length === 0) { await connection.rollback(); connection.release(); return res.status(404).json({error:"N/A"}); }
        
        const estado = reqInfo[0].id_estado_req;

        if ([1, 2, 3, 4].includes(estado)) {
            const [itens] = await connection.execute('SELECT id_material, quantidade FROM RequisicaoItem WHERE id_req = ?', [id]);
            for (const item of itens) {
                await connection.execute('UPDATE Material SET quantidade_disp = quantidade_disp + ? WHERE id_material = ?', [item.quantidade, item.id_material]);
                const [mat] = await connection.execute('SELECT nome FROM Material WHERE id_material = ?', [item.id_material]);
                await connection.execute(`INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'cancelamento', ?)`, [id_user || 1, mat[0].nome, item.quantidade]);
            }
        }
        await connection.execute('UPDATE Requisicao SET id_estado_req = 6 WHERE id_req = ?', [id]);
        await connection.execute(`INSERT INTO Historico_Requisicao (id_req, id_user, acao, detalhes, data_acao) VALUES (?, ?, 'Cancelada', 'Cancelamento', NOW())`, [id, id_user || 1]);
        await connection.commit();
        res.json({ message: "Cancelada." });
    } catch (error) { await connection.rollback(); res.status(500).json({ error: error.message }); }
    finally { if (connection) connection.release(); }
};

// EXTRAS
exports.getHistoricoGeral = async (req, res) => {
    try { const [rows] = await db.execute(`SELECT h.*, u.nome as nome_responsavel FROM Historico_Requisicao h LEFT JOIN Utilizador u ON h.id_user = u.id_user ORDER BY h.data_acao DESC`); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.listarEventosDisponiveis = async (req, res) => {
    try { const [rows] = await db.execute(`SELECT * FROM Evento WHERE id_estado = 2 AND data_fim >= CURDATE() ORDER BY data_inicio ASC`); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.listarMateriais = async (req, res) => {
    try { const [rows] = await db.execute(`SELECT ri.*, m.nome FROM RequisicaoItem ri JOIN Material m ON ri.id_material = m.id_material WHERE ri.id_req = ?`, [req.params.id]); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }); }
};