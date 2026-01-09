const db = require('../config/db');

// 1. CRIAR REQUISIÇÃO (Fazer o pedido completo)
exports.criar = async (req, res) => {
    const { id_evento, id_user } = req.body; 

    try {
        if (!id_evento || !id_user) {
            return res.status(400).json({ error: "Faltam dados: id_evento ou id_user." });
        }

   
        const [result] = await db.execute(
            `INSERT INTO Requisicao (id_evento, id_user, data_pedido, id_estado) 
             VALUES (?, ?, NOW(), 1)`,
            [id_evento, id_user]
        );

        res.status(201).json({ 
            id: result.insertId, 
            message: "Requisição efetuada com sucesso!" 
        });

    } catch (error) {
        console.error("Erro na requisição:", error.message);
        res.status(500).json({ error: "Erro interno", detalhes: error.message });
    }
};

// 2. LISTAR REQUISIÇÕES 
exports.listarTodas = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, u.nome as requerente, e.nome_evento, es.nome as estado_nome 
            FROM Requisicao r 
            JOIN Utilizador u ON r.id_user = u.id_user 
            JOIN Evento e ON r.id_evento = e.id_evento 
            JOIN Estado es ON r.id_estado = es.id_estado 
            ORDER BY r.id_req DESC`);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// 3. ATUALIZAR ESTADO (Aprovar/Rejeitar)
exports.atualizarEstado = async (req, res) => {
    const { id } = req.params; 
    const { id_estado } = req.body;

    try {
        await db.execute(
            `UPDATE Requisicao SET id_estado = ? WHERE id_req = ?`, 
            [id_estado, id]
        );
        res.json({ msg: "Estado da requisição atualizado com sucesso." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.listarPorUser = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                r.*, 
                e.nome_evento, 
                es.nome as estado_nome,
                (SELECT COUNT(*) FROM Requisicao r2 
                 WHERE r2.id_evento = r.id_evento AND r2.id_req <= r.id_req) as ordem
            FROM Requisicao r 
            JOIN Evento e ON r.id_evento = e.id_evento 
            JOIN Estado es ON r.id_estado = es.id_estado 
            WHERE r.id_user = ? 
            ORDER BY r.id_req DESC`, [req.params.id]);

        const formatadas = rows.map(r => ({
            ...r,
            nome_exibicao: `${r.nome_evento || 'Evento'} - Requisição ${r.ordem}`
        }));

        res.json(formatadas);
    } catch (e) {
        res.status(500).json([]);
    }
};

// 4. LISTAR REQUISIÇÕES POR UTILIZADOR
exports.listarPorUser = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, e.nome_evento, es.nome as estado_nome 
            FROM Requisicao r 
            JOIN Evento e ON r.id_evento = e.id_evento 
            JOIN Estado es ON r.id_estado = es.id_estado 
            WHERE r.id_user = ? 
            ORDER BY r.id_req DESC`, [req.params.id]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};