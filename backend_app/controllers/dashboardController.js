const db = require('../config/db');

exports.notificacoesPrazos = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.id_req as id, e.nome_evento, e.data_fim, DATEDIFF(e.data_fim, CURDATE()) as dias_restantes
            FROM Requisicao r
            JOIN Evento e ON r.id_evento = e.id_evento
            WHERE r.id_user = ? AND e.data_fim IS NOT NULL AND r.id_estado = 2 
            ORDER BY dias_restantes ASC`, [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
};

// Histórico de Stock
exports.historicoStock = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT h.*, u.nome as nome_utilizador FROM Historico_Stock h 
            JOIN Utilizador u ON h.id_user = u.id_user 
            ORDER BY h.data_movimento DESC LIMIT 50`);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
};