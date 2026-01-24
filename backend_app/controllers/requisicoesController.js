const db = require('../config/db');

// 1. LISTAR TODAS (Para o Gestor)
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
        console.error("Erro SQL listarTodas:", e.message);
        res.status(500).json({ error: "Erro interno ao listar requisições." });
    }
};

// 2. LISTAR POR USER (Para o Perfil)
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
        console.error("Erro SQL listarPorUser:", e.message);
        res.status(500).json({ error: "Erro ao carregar o perfil." });
    }
};

// 3. CRIAR REQUISIÇÃO
exports.criar = async (req, res) => {
    const { id_user, id_evento, descricao } = req.body;
    const descFinal = descricao || "Sem descrição";

    try {
        const [result] = await db.execute(
            `INSERT INTO Requisicao (id_user, id_evento, data_pedido, id_estado_req, descricao) 
             VALUES (?, ?, NOW(), 1, ?)`,
            [id_user, id_evento, descFinal]
        );
        res.status(201).json({ id_req: result.insertId });
    } catch (e) {
        console.error("Erro SQL Criar:", e.message);
        res.status(500).json({ error: "Erro ao criar requisição." });
    }
};

// 4. SUBMETER MATERIAIS
exports.submeterMateriais = async (req, res) => {
    const { id } = req.params; 
    const { materiais } = req.body; 

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            await connection.execute('DELETE FROM RequisicaoItem WHERE id_req = ?', [id]);
            for (const m of materiais) {
                await connection.execute(
                    `INSERT INTO RequisicaoItem (id_req, id_material, quantidade, data_saida, data_devolucao) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, m.id_material, m.quantidade, m.levantamento, m.devolucao]
                );
            }
            await connection.commit();
            res.status(200).json({ message: "Sucesso!" });
        } catch (error) {
            await connection.rollback();
            res.status(400).json({ error: error.message });
        } finally {
            connection.release();
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 5. ATUALIZAR ESTADO (Genérico)
exports.atualizarEstado = async (req, res) => {
    const { id } = req.params; 
    const { id_estado } = req.body;
    try {
        await db.execute(`UPDATE Requisicao SET id_estado_req = ? WHERE id_req = ?`, [id_estado, id]);
        res.json({ msg: "Estado atualizado." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 6. EXTRAS 
exports.listarEventosDisponiveis = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT * FROM Evento 
            WHERE id_estado = 2 
            AND data_fim >= CURDATE()
            ORDER BY data_inicio ASC
        `);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.listarMateriais = async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT ri.*, m.nome FROM RequisicaoItem ri JOIN Material m ON ri.id_material = m.id_material WHERE ri.id_req = ?`, [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// 7. DEVOLVER REQUISIÇÃO 
exports.devolverRequisicao = async (req, res) => {
    const { id } = req.params; 
    const { id_user } = req.body; 

    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction();

        const [reqInfo] = await connection.execute('SELECT * FROM Requisicao WHERE id_req = ?', [id]);
        
        if (reqInfo.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(404).json({ error: "Requisição não encontrada." });
        }
        if (reqInfo[0].id_estado_req === 5) {
            await connection.rollback(); connection.release();
            return res.status(400).json({ error: "Esta requisição já foi devolvida." });
        }

        const [itens] = await connection.execute(
            'SELECT id_material, quantidade FROM RequisicaoItem WHERE id_req = ?',
            [id]
        );

        for (const item of itens) {
            await connection.execute(
                'UPDATE Material SET quantidade_disp = quantidade_disp + ? WHERE id_material = ?',
                [item.quantidade, item.id_material]
            );

            await connection.execute(
                'UPDATE RequisicaoItem SET data_devolucao = CURDATE() WHERE id_req = ? AND id_material = ?',
                [id, item.id_material]
            );

            const [mat] = await connection.execute('SELECT nome FROM Material WHERE id_material = ?', [item.id_material]);
            const nomeMaterial = mat.length > 0 ? mat[0].nome : 'Material Desconhecido';

            await connection.execute(
                `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) 
                 VALUES (?, ?, 'entrada', ?)`,
                [id_user || 1, nomeMaterial, item.quantidade]
            );
        }

        // Finalizar Requisição
        await connection.execute(
            'UPDATE Requisicao SET id_estado_req = 5, data_fim = NOW() WHERE id_req = ?',
            [id]
        );

        // Histórico da Requisição
        await connection.execute(
            `INSERT INTO Historico_Requisicao (id_req, id_user, acao, detalhes, data_acao) 
             VALUES (?, ?, 'Finalizada', 'Materiais devolvidos ao armazém', NOW())`,
            [id, id_user || 1]
        );

        await connection.commit();
        res.json({ message: "Devolução registada com sucesso!" });

    } catch (error) {
        await connection.rollback();
        console.error("Erro ao devolver:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// 8. OBTER HISTÓRICO 
exports.getHistoricoGeral = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT h.*, u.nome as nome_responsavel
            FROM Historico_Requisicao h
            LEFT JOIN Utilizador u ON h.id_user = u.id_user
            ORDER BY h.data_acao DESC
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 9. CANCELAR REQUISIÇÃO 
exports.cancelarRequisicao = async (req, res) => {
    const { id } = req.params;
    const { id_user } = req.body; 

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [reqInfo] = await connection.execute('SELECT * FROM Requisicao WHERE id_req = ?', [id]);
        
        if (reqInfo.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(404).json({ error: "Requisição não encontrada." });
        }

        const estadoAtual = reqInfo[0].id_estado_req;

        if (estadoAtual === 5 || estadoAtual === 6) {
            await connection.rollback(); connection.release();
            return res.status(400).json({ error: "Não é possível cancelar uma requisição já finalizada ou cancelada." });
        }

        if ([2, 3, 4].includes(estadoAtual)) {
            
            const [itens] = await connection.execute('SELECT id_material, quantidade FROM RequisicaoItem WHERE id_req = ?', [id]);

            for (const item of itens) {
                // A. Repor Stock
                await connection.execute(
                    'UPDATE Material SET quantidade_disp = quantidade_disp + ? WHERE id_material = ?', 
                    [item.quantidade, item.id_material]
                );

                // B. Histórico de Stock
                const [mat] = await connection.execute('SELECT nome FROM Material WHERE id_material = ?', [item.id_material]);
                await connection.execute(
                    `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) 
                     VALUES (?, ?, 'entrada', ?)`,
                    [id_user || 1, mat[0].nome, item.quantidade]
                );
            }
        }

        // Mudar estado para Cancelada (6)
        await connection.execute('UPDATE Requisicao SET id_estado_req = 6 WHERE id_req = ?', [id]);

        // Histórico da Requisição
        await connection.execute(
            `INSERT INTO Historico_Requisicao (id_req, id_user, acao, detalhes, data_acao) 
             VALUES (?, ?, 'Cancelada', 'Cancelamento manual pelo utilizador/gestor', NOW())`,
            [id, id_user || 1]
        );

        await connection.commit();
        res.json({ message: "Requisição cancelada com sucesso." });

    } catch (error) {
        await connection.rollback();
        console.error("Erro ao cancelar:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};