const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const app = express();
const port = 3001;

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'user_gestao',
    password: process.env.DB_PASS || 'user_password_segura',
    database: process.env.DB_NAME || 'gestao_ativos_db',
    waitForConnections: true,
    connectionLimit: 10
});

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// --- LOGIN ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const email = username.includes('@') ? username : `${username}@cm-esposende.pt`;
    try {
        const [rows] = await pool.execute('SELECT * FROM Utilizador WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            const isMatch = user.password_hash.startsWith('$2') ? await bcrypt.compare(password, user.password_hash) : (password === user.password_hash);
            if (isMatch) return res.json(user);
        }
        res.status(401).json({ error: "Credenciais inválidas" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- DASHBOARD SUMMARY (Resolve o 404 da Home) ---
app.get('/api/eventos/summary/:id', async (req, res) => {
    try {
        const [evs] = await pool.execute('SELECT COUNT(*) as total FROM Evento WHERE id_user = ?', [req.params.id]);
        const [reqs] = await pool.execute('SELECT COUNT(*) as total FROM Requisicao WHERE id_user = ?', [req.params.id]);
        res.json({ 
            eventosCount: evs[0].total || 0, 
            requisicoesCount: reqs[0].total || 0, 
            notifications: [] 
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/eventos', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id_evento, nome_evento FROM Evento');
        res.json(rows || []); 
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/eventos', async (req, res) => {
    const { nome_evento, data_inicio, data_fim, localizacao, id_user } = req.body;
    
    if (!nome_evento || !id_user) {
        return res.status(400).json({ error: "Nome do evento e utilizador são obrigatórios." });
    }

    try {
        await pool.execute(
            `INSERT INTO Evento (nome_evento, data_inicio, data_fim, localizacao, id_user, id_estado) 
             VALUES (?, ?, ?, ?, ?, 1)`, 
            [nome_evento, data_inicio, data_fim, localizacao, id_user]
        );
        res.status(201).json({ message: "Evento criado com sucesso" });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Erro interno na base de dados" }); 
    }
});

// --- SUBMETER REQUISIÇÃO ---
app.post('/api/requisicoes', async (req, res) => {
    const { id_user, id_evento, data_requisicao } = req.body;
    try {
        await pool.execute(
            `INSERT INTO Requisicao (id_user, id_evento, data_requisicao, estado) VALUES (?, ?, ?, 'Pendente')`,
            [id_user, id_evento, data_requisicao || new Date().toISOString().slice(0, 10)]
        );
        res.status(201).json({ message: "Requisição enviada" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LISTAGENS PERFIL (Filtrado por User) ---
app.get('/api/requisicoes/user/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.*, e.nome_evento FROM Requisicao r 
            JOIN Evento e ON r.id_evento = e.id_evento WHERE r.id_user = ?`, [req.params.id]);
        res.json(rows || []);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/eventos/user/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, es.nome as estado_nome FROM Evento e 
            JOIN Estado es ON e.id_estado = es.id_estado WHERE e.id_user = ?`, [req.params.id]);
        res.json(rows || []);
    } catch (e) { res.status(500).json([]); }
});

// --- GESTÃO (José António) ---
app.get('/api/gestao/requisicoes/todas', async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT r.*, e.nome_evento, u.nome as requerente FROM Requisicao r 
        JOIN Evento e ON r.id_evento = e.id_evento 
        JOIN Utilizador u ON r.id_user = u.id_user ORDER BY r.id_requisicao DESC`);
    res.json(rows);
});

app.get('/api/gestao/eventos/todos', async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT e.*, es.nome as estado_nome FROM Evento e 
        JOIN Estado es ON e.id_estado = es.id_estado ORDER BY e.id_evento DESC`);
    res.json(rows);
});

app.put('/api/gestao/:tipo/:id/estado', async (req, res) => {
    const { tipo, id } = req.params;
    const val = tipo === 'requisicoes' ? req.body.estado : req.body.id_estado;
    const sql = tipo === 'requisicoes' ? 'UPDATE Requisicao SET estado = ? WHERE id_requisicao = ?' : 'UPDATE Evento SET id_estado = ? WHERE id_evento = ?';
    try {
        await pool.execute(sql, [val, id]);
        res.json({ message: "OK" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(port, '0.0.0.0', () => console.log(`Backend ativo na porta ${port}`));