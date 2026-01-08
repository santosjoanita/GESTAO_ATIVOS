const db = require('../config/db');

// Criar Evento com Anexos
exports.criar = async (req, res) => {
    const { nome_evento, descricao, localizacao, data_inicio, data_fim, id_user } = req.body;
    try {
        const [resEv] = await db.execute(
            `INSERT INTO Evento (nome_evento, descricao, data_inicio, data_fim, localizacao, id_user, id_estado) VALUES (?, ?, ?, ?, ?, ?, 1)`, 
            [nome_evento, descricao, data_inicio, data_fim || data_inicio, localizacao, id_user]
        );

        // Lógica de anexos (Multer envia múltiplos ficheiros em req.files)
        if (req.files) {
            for (const f of req.files) {
                await db.execute(
                    `INSERT INTO EventoAnexo (id_evento, nome, nome_oculto, extensao, ativo) VALUES (?, ?, ?, ?, 1)`, 
                    [resEv.insertId, f.originalname, f.filename, require('path').extname(f.originalname)]
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