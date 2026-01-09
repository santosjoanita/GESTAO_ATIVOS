const db = require('../config/db');
const path = require('path');

// Criar Evento com Anexos
exports.criar = async (req, res) => {
    const { nome_evento, descricao, localizacao, data_inicio, data_fim, id_user } = req.body;
    try {
        const [resEv] = await db.execute(
            `INSERT INTO Evento (nome_evento, descricao, data_inicio, data_fim, localizacao, id_user, id_estado) VALUES (?, ?, ?, ?, ?, ?, 1)`, 
            [nome_evento, descricao, data_inicio, data_fim || data_inicio, localizacao, id_user]
        );

        if (req.files) {
            for (const f of req.files) {
                await db.execute(
                    `INSERT INTO EventoAnexo (id_evento, nome, nome_oculto, extensao, ativo) VALUES (?, ?, ?, ?, 1)`, 
                    [resEv.insertId, f.originalname, f.filename, path.extname(f.originalname)]
                );
            }
        }
        res.status(201).json({ id: resEv.insertId });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
};

// Listar eventos de um utilizador específico
exports.listarPorUser = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT e.*, es.nome as estado_nome FROM Evento e 
             JOIN Estado es ON e.id_estado = es.id_estado 
             WHERE e.id_user = ? ORDER BY e.id_evento DESC`, [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
};



// Obter detalhes de um evento (o summary)
exports.obterDetalhes = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Evento WHERE id_evento = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Não encontrado" });
        res.json(rows[0]);
    } catch (e) { 
        res.status(500).json({ erro: e.message }); 
    }
};

// Listar anexos de um evento
exports.listarAnexos = async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM EventoAnexo WHERE id_evento = ? AND ativo = 1", 
            [req.params.id]
        );
        res.json(rows);
    } catch (e) { 
        res.status(500).json([]); 
    }
};
exports.listarTodos = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT e.*, es.nome as estado_nome, u.nome as requerente 
            FROM Evento e 
            JOIN Estado es ON e.id_estado = es.id_estado 
            JOIN Utilizador u ON e.id_user = u.id_user 
            ORDER BY e.data_inicio DESC
        `);
        res.json(rows);
    } catch (e) {
        console.error("Erro SQL:", e.message);
        res.status(500).json({ error: "Erro na BD", detalhes: e.message });
    }
};