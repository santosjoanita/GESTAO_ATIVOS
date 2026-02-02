const db = require('../config/db');
const path = require('path');

exports.listarTodos = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT e.*, ee.nome_estado as estado_nome, u.nome as requerente 
            FROM Evento e 
            JOIN Estado_Evento ee ON e.id_estado = ee.id_estado 
            JOIN Utilizador u ON e.id_user = u.id_user 
            ORDER BY e.data_inicio DESC
        `);
        res.json(rows);
    } catch (e) {
        console.error("Erro SQL em listarTodos:", e.message);
        res.status(500).json({ error: "Erro na BD", detalhes: e.message });
    }
};

// 2. CRIAR EVENTO 
exports.criar = async (req, res) => {
    const { nome_evento, descricao, localizacao, data_inicio, data_fim, id_user, latitude, longitude } = req.body;
    
    try {
        // --- VALIDAÇÃO DE DATAS ---
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const inicio = new Date(data_inicio);
        const fim = new Date(data_fim || data_inicio);

        if (inicio < hoje) {
            return res.status(400).json({ error: "Não é possível criar eventos no passado." });
        }

        if (fim < inicio) {
            return res.status(400).json({ error: "A data de fim não pode ser anterior à data de início." });
        }

        const [resEv] = await db.execute(
            `INSERT INTO Evento (nome_evento, descricao, data_inicio, data_fim, localizacao, id_user, id_estado, latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`, 
            [nome_evento, descricao, data_inicio, data_fim || data_inicio, localizacao, id_user, latitude || null, longitude || null]
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
        console.error(e);
        res.status(500).json({ erro: e.message });
    }
};

exports.listarPorUser = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT e.*, ee.nome_estado as estado_nome FROM Evento e 
             JOIN Estado_Evento ee ON e.id_estado = ee.id_estado 
             WHERE e.id_user = ? ORDER BY e.id_evento DESC`, [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
};

exports.obterDetalhes = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Evento WHERE id_evento = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Não encontrado" });
        res.json(rows[0]);
    } catch (e) { 
        res.status(500).json({ code: 500, message: "erro", erro: e.message }); 
    }
};

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

exports.listarSimples = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT id_evento, nome_evento FROM Evento ORDER BY id_evento DESC");
        res.json(rows);
    } catch (e) {
        res.status(500).json([]);
    }
};
exports.listarRequisicoesDoEvento = async (req, res) => {
    try {
        const idEvento = req.params.id;
        const [rows] = await db.execute(`
            SELECT 
                r.id_req, 
                r.id_estado_req,
                er.nome_estado as estado_nome,
                r.data_pedido
            FROM Requisicao r
            LEFT JOIN Estado_Requisicao er ON r.id_estado_req = er.id_estado_req
            WHERE r.id_evento = ?
            ORDER BY r.id_req DESC
        `, [idEvento]);
        
        res.json(rows);
    } catch (e) {
        console.error("Erro SQL no Backend:", e.message);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
};