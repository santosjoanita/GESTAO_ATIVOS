const db = require('../config/db');

// Notificações de Prazos
exports.notificacoesPrazos = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, e.nome_evento, u.nome as requerente,
                   DATEDIFF(r.data_fim, CURDATE()) as dias_para_fim
            FROM Requisicao r
            JOIN Evento e ON r.id_evento = e.id_evento
            JOIN Utilizador u ON r.id_user = u.id_user
            WHERE r.id_estado = 2 
            AND r.data_fim BETWEEN DATE_SUB(CURDATE(), INTERVAL 3 DAY) 
                               AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            ORDER BY r.data_fim ASC
        `);
        res.json(rows);
    } catch (e) {
        console.error("Erro nas notificações:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// Histórico de Stock
exports.historicoStock = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT h.*, u.nome as nome_utilizador 
            FROM Historico_Stock h 
            JOIN Utilizador u ON h.id_user = u.id_user 
            ORDER BY h.data_movimento DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (e) { 
        console.error("Erro no historicoStock:", e.message);
        res.status(500).json([]); 
    }
};