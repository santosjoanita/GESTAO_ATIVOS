const db = require('../config/db');

// 1. ATUALIZAR ESTADO
exports.atualizarEstado = async (req, res) => {
    const { tipo, id } = req.params; 
    const { id_estado } = req.body;
    let tabela, pk, colunaEstado;
    if (tipo === 'requisicoes') { tabela = 'Requisicao'; pk = 'id_req'; colunaEstado = 'id_estado_req'; } 
    else if (tipo === 'eventos') { tabela = 'Evento'; pk = 'id_evento'; colunaEstado = 'id_estado'; } 
    else { return res.status(400).json({ error: "Tipo inválido." }); }

    try {
        await db.execute(`UPDATE ${tabela} SET ${colunaEstado} = ? WHERE ${pk} = ?`, [id_estado, id]);
        res.json({ msg: "Estado atualizado." });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// 2. STATS
exports.getDashboardStats = async (req, res) => {
    try {
        const [reqPendentes] = await db.execute("SELECT COUNT(*) as total FROM Requisicao WHERE id_estado_req = 1");
        const [evPendentes] = await db.execute("SELECT COUNT(*) as total FROM Evento WHERE id_estado = 1");
        const [stockBaixo] = await db.execute("SELECT COUNT(*) as total FROM Material WHERE quantidade_disp < 5");
        res.json({ requisicoes_pendentes: reqPendentes[0].total, eventos_pendentes: evPendentes[0].total, alertas_stock: stockBaixo[0].total });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// 3. NOTIFICAÇÕES
exports.getNotificacoesPrazos = async (req, res) => {
    const { id } = req.params; 
    try {
        let sql = `
            SELECT r.id_req, u.nome as requerente, e.data_fim, e.nome_evento,
                   DATEDIFF(e.data_fim, CURDATE()) as dias_para_fim
            FROM Requisicao r
            JOIN Utilizador u ON r.id_user = u.id_user
            LEFT JOIN Evento e ON r.id_evento = e.id_evento
            WHERE r.id_estado_req = 4 AND e.data_fim <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
        `;
        const params = [];
        if (id) { sql += ` AND r.id_user = ?`; params.push(id); }
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (e) { console.error("Erro Prazos:", e.message); res.json([]); }
};

// 4. HISTÓRICO
exports.getHistoricoStock = async (req, res) => {
    try {
        console.log("A ler histórico..."); 
        
        const [rows] = await db.execute(`
            SELECT 
                h.*, 
                u.nome as nome_utilizador
            FROM Historico_Stock h
            LEFT JOIN Utilizador u ON h.id_user = u.id_user
            ORDER BY h.data_movimento DESC
        `);
        
        console.log("Histórico lido. Linhas:", rows.length);
        res.json(rows);

    } catch (e) {
        console.error("ERRO GRAVE NO HISTÓRICO:", e.message); 
        res.status(500).json({ error: e.message });
    }
};