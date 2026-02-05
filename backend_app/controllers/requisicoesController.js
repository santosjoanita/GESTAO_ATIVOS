const db = require('../config/db');

const sendError = (res, code, msg, errorDetails) => {
    res.status(code).json({ code: code, message: msg, erro: errorDetails });
};

// 1. LISTAR TODAS
exports.listarTodasGeral = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, e.nome_evento, u.nome as nome_requisitante
            FROM Requisicao r
            JOIN Evento e ON r.id_evento = e.id_evento
            JOIN Utilizador u ON r.id_user = u.id_user
            ORDER BY r.data_pedido DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Erro em listarTodasGeral:", error);
        res.status(500).json({ error: "Erro ao listar requisições" });
    }
};

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
    } catch (e) { sendError(res, 500, "Erro ao listar", e.message); }
};

exports.listarPorUser = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, e.nome_evento, er.nome_estado as estado_nome
            FROM Requisicao r
            LEFT JOIN Evento e ON r.id_evento = e.id_evento
            LEFT JOIN Estado_Requisicao er ON r.id_estado_req = er.id_estado_req
            WHERE r.id_user = ? ORDER BY r.data_pedido DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (e) { sendError(res, 500, "Erro ao carregar perfil", e.message); }
};

exports.criar = async (req, res) => {
    const { id_user, id_evento, descricao } = req.body;
    try {
        const [result] = await db.execute(
            `INSERT INTO Requisicao (id_user, id_evento, data_pedido, id_estado_req, descricao) 
             VALUES (?, ?, NOW(), 1, ?)`, [id_user, id_evento, descricao || "Sem descrição"]
        );
        res.status(201).json({ id_req: result.insertId });
    } catch (e) { sendError(res, 500, "Erro ao criar", e.message); }
};

// 4. SUBMETER MATERIAIS COM VALIDAÇÃO DE COLISÃO DE DATAS E MUDANÇA DE ESTADO
exports.submeterMateriais = async (req, res) => {
    const { id } = req.params; 
    const { materiais } = req.body; 

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [requisicoes_feitas] = await connection.execute(
            `SELECT ri.id_material, ri.quantidade, ri.data_saida, ri.data_devolucao
            FROM RequisicaoItem ri
            JOIN Requisicao r ON ri.id_req = r.id_req
            WHERE r.id_req != ? AND r.id_estado_req IN (1, 2, 3, 4)`, [id]);

        for (const produto_atual of materiais) {
            let total_reservado_no_periodo = 0;

            for (const produto_req of requisicoes_feitas) {
                if (produto_atual.id_material === produto_req.id_material) {
                    const dt_ini_atual = new Date(produto_atual.levantamento);
                    const dt_fim_atual = new Date(produto_atual.devolucao);
                    const dt_ini_req = new Date(produto_req.data_saida);
                    const dt_fim_req = new Date(produto_req.data_devolucao);

                    if (dt_ini_atual >= dt_ini_req && dt_ini_atual <= dt_fim_req) {
                        total_reservado_no_periodo += produto_req.quantidade;
                    }

                    if (dt_fim_atual >= dt_ini_req && dt_fim_atual <= dt_fim_req) {
                        total_reservado_no_periodo += produto_req.quantidade;
                    }
                }
            }

            const [MaterialDb] = await connection.execute(
                `SELECT nome, quantidade_total FROM Material WHERE id_material = ?`,
                [produto_atual.id_material]
            );

            const quantidade_total = MaterialDb[0].quantidade_total;
            const quantidade_real_disp = quantidade_total - total_reservado_no_periodo;

            if (produto_atual.quantidade > quantidade_real_disp) {
                throw new Error(`Impossível reservar ${produto_atual.quantidade} un. de "${MaterialDb[0].nome}". Só existem ${quantidade_real_disp} disponíveis.`);
            }
            
            await connection.execute(
                `INSERT INTO RequisicaoItem(id_req, id_material, quantidade, data_saida, data_devolucao, status_item)
                VALUES (?, ?, ?, ?, ?, 'pendente')
                ON DUPLICATE KEY UPDATE
                quantidade = VALUES(quantidade),
                data_saida = VALUES(data_saida),
                data_devolucao = VALUES(data_devolucao)`, 
                [id, produto_atual.id_material, produto_atual.quantidade, produto_atual.levantamento, produto_atual.devolucao]
            );
        }

        await connection.execute(`UPDATE Requisicao SET id_estado_req = 1 WHERE id_req = ?`, [id]);
        
        await connection.commit();
        res.status(200).json({ message: "Materiais reservados com sucesso." });

    } catch (e) {
        await connection.rollback();
        res.status(400).json({ message: e.message });
    } finally {
        connection.release();
    }
};

// 5. ATUALIZAR ESTADO (COM ABATE DE STOCK NA APROVAÇÃO)
exports.atualizarEstado = async (req, res) => {
    const { id } = req.params; 
    const { id_estado } = req.body;
    const idUserLogado = req.user ? (req.user.id_user || req.user.id) : 1;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        if (parseInt(id_estado) === 2 || parseInt(id_estado) === 4) {
            
            const [itens] = await connection.execute(
                'SELECT id_material, quantidade FROM RequisicaoItem WHERE id_req = ? AND status_item = "pendente"', 
                [id]
            );

            for (const item of itens) {
                await connection.execute(
                    'UPDATE Material SET quantidade_disp = quantidade_disp - ? WHERE id_material = ?',
                    [item.quantidade, item.id_material]
                );
            }

            await connection.execute(
                'UPDATE RequisicaoItem SET status_item = "aprovado" WHERE id_req = ? AND status_item = "pendente"', 
                [id]
            );
        }

        await connection.execute(`UPDATE Requisicao SET id_estado_req = ? WHERE id_req = ?`, [id_estado, id]);

        await connection.commit();
        res.json({ msg: "Estado atualizado e stock abatido!" });
    } catch (e) {
        await connection.rollback();
        res.status(500).json({ message: e.message });
    } finally { connection.release(); }
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
            await connection.rollback(); connection.release(); return sendError(res, 400, "Erro", "Inválida");
        }
        const [itens] = await connection.execute('SELECT id_material, quantidade FROM RequisicaoItem WHERE id_req = ?', [id]);
        for (const item of itens) {
            await connection.execute('UPDATE Material SET quantidade_disp = quantidade_disp + ? WHERE id_material = ?', [item.quantidade, item.id_material]);
            await connection.execute('UPDATE RequisicaoItem SET data_devolucao = CURDATE() WHERE id_req = ? AND id_material = ?', [id, item.id_material]);
            const [mat] = await connection.execute('SELECT nome FROM Material WHERE id_material = ?', [item.id_material]);
            await connection.execute(`INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'devolucao', ?)`, [id_user || 1, mat[0].nome, item.quantidade]);
        }
        await connection.execute('UPDATE Requisicao SET id_estado_req = 5 WHERE id_req = ?', [id]);
        
        await connection.execute(`INSERT INTO Historico_Requisicao (id_req, id_user, acao, detalhes, data_acao) VALUES (?, ?, 'Finalizada', 'Devolução de material', NOW())`, [id, id_user || 1]);
        
        await connection.commit();
        res.json({ message: "Devolvido com sucesso." });
    } catch (e) { await connection.rollback(); sendError(res, 500, "Erro ao devolver", e.message); } 
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
        if (reqInfo.length === 0) { await connection.rollback(); connection.release(); return sendError(res, 404, "Erro", "N/A"); }
        
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
        
        await connection.execute(`INSERT INTO Historico_Requisicao (id_req, id_user, acao, detalhes, data_acao) VALUES (?, ?, 'Cancelada', 'Cancelada pelo utilizador', NOW())`, [id, id_user || 1]);
        
        await connection.commit();
        res.json({ message: "Cancelada com sucesso." });
    } catch (e) { await connection.rollback(); sendError(res, 500, "Erro ao cancelar", e.message); } 
    finally { if (connection) connection.release(); }
};

// EXTRAS
exports.getHistoricoGeral = async (req, res) => {
    try { const [rows] = await db.execute(
        `SELECT h.*, u.nome as nome_responsavel FROM Historico_Requisicao h LEFT JOIN Utilizador u ON h.id_user = u.id_user ORDER BY h.data_acao DESC`
    ); 
    res.json(rows); 
} catch (e) { 
    sendError(res, 500, "Erro", e.message);
 }
};
exports.listarEventosDisponiveis = async (req, res) => {
    try { const [rows] = await db.execute(`
        SELECT * FROM Evento WHERE id_estado = 2 AND data_fim >= CURDATE() ORDER BY data_inicio ASC`
    ); res.json(rows); 
} catch (e) { 
    sendError(res, 500, "Erro", e.message);
 }
};
exports.listarMateriais = async (req, res) => {
    try { const [rows] = await db.execute(`
        SELECT ri.*, m.nome FROM RequisicaoItem ri JOIN Material m ON ri.id_material = m.id_material WHERE ri.id_req = ?`, [req.params.id]);
         res.json(rows);
         } catch (e) { 
            sendError(res, 500, "Erro", e.message); 
        }
};

