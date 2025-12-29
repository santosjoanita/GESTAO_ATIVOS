const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const app = express();
const port = 3001;

// --- CONFIGURAÇÃO DA BASE DE DADOS ---
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

// ==========================================
// 1. AUTENTICAÇÃO E PERFIL
// ==========================================

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

// ==========================================
// 2. GESTÃO DE EVENTOS E REQUISIÇÕES (USER)
// ==========================================

app.get('/api/eventos', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id_evento, nome_evento FROM Evento');
        res.json(rows || []); 
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/eventos', async (req, res) => {
    const { nome_evento, data_inicio, data_fim, localizacao, id_user } = req.body;
    if (!nome_evento || !id_user) return res.status(400).json({ error: "Dados incompletos." });
    try {
        await pool.execute(
            `INSERT INTO Evento (nome_evento, data_inicio, data_fim, localizacao, id_user, id_estado) VALUES (?, ?, ?, ?, ?, 1)`, 
            [nome_evento, data_inicio, data_fim, localizacao, id_user]
        );
        res.status(201).json({ message: "Evento criado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/requisicoes', async (req, res) => {
    const { id_user, id_evento } = req.body;
    try {
        const hoje = new Date().toISOString().slice(0, 10);
        await pool.execute(
            `INSERT INTO Requisicao (id_user, id_evento, id_estado, data_pedido) VALUES (?, ?, 1, ?)`,
            [id_user, id_evento, hoje]
        );
        res.status(201).json({ message: "Requisição criada" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Listagens específicas do Perfil
app.get('/api/requisicoes/user/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.*, e.nome_evento, es.nome as estado_nome 
            FROM Requisicao r 
            JOIN Evento e ON r.id_evento = e.id_evento 
            JOIN Estado es ON r.id_estado = es.id_estado
            WHERE r.id_user = ?`, [req.params.id]);
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

// ==========================================
// 3. PAINEL DE GESTÃO (ADMIN/GESTOR)
// ==========================================

app.get('/api/gestao/requisicoes/todas', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.*, e.nome_evento, u.nome as requerente, es.nome as estado_nome
            FROM Requisicao r 
            LEFT JOIN Evento e ON r.id_evento = e.id_evento 
            LEFT JOIN Utilizador u ON r.id_user = u.id_user
            LEFT JOIN Estado es ON r.id_estado = es.id_estado
            ORDER BY r.id_req DESC`);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/gestao/eventos/todos', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, es.nome as estado_nome, u.nome as requerente
            FROM Evento e 
            LEFT JOIN Estado es ON e.id_estado = es.id_estado 
            LEFT JOIN Utilizador u ON e.id_user = u.id_user
            ORDER BY e.id_evento DESC`);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Rota Unificada para Detalhes
app.get('/api/gestao/eventos/:id/detalhes', async (req, res) => {
    try {
        const [evento] = await pool.execute(`
            SELECT e.*, u.nome as criador FROM Evento e 
            JOIN Utilizador u ON e.id_user = u.id_user WHERE e.id_evento = ?`, [req.params.id]);
        const [requisicoes] = await pool.execute(`
            SELECT r.*, u.nome as requerente, es.nome as estado_nome 
            FROM Requisicao r 
            JOIN Utilizador u ON r.id_user = u.id_user 
            JOIN Estado es ON r.id_estado = es.id_estado
            WHERE r.id_evento = ?`, [req.params.id]);
        res.json({ evento: evento[0], requisicoes });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Ações de Aprovação/Rejeição
app.put('/api/gestao/eventos/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { id_estado } = req.body; 
    try {
        await pool.execute("UPDATE Evento SET id_estado = ? WHERE id_evento = ?", [id_estado, id]);
        res.status(200).send("Evento atualizado");
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/gestao/requisicoes/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { id_estado } = req.body; 
    try {
        await pool.execute("UPDATE Requisicao SET id_estado = ? WHERE id_req = ?", [id_estado, id]);
        res.status(200).send("Requisição atualizada");
    } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
// 4. GESTÃO DE MATERIAIS E CATEGORIAS
// ==========================================

app.get('/api/materiais', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM Material ORDER BY nome ASC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/categorias', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT id_categoria, nome FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/materiais/update', async (req, res) => {
    const { 
        id_material, nome, quantidade_total, categoria, 
        especificacoes, descricao_tecnica, local_armazenamento 
    } = req.body;
    try {
        if (id_material) {
            await pool.execute(
                `UPDATE Material SET nome=?, quantidade_total=?, categoria=?, especificacoes=?, descricao_tecnica=?, local_armazenamento=?, quantidade_disp=? WHERE id_material=?`,
                [nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, quantidade_total, id_material]
            );
        } else {
            await pool.execute(
                `INSERT INTO Material (nome, quantidade_total, quantidade_disp, categoria, especificacoes, descricao_tecnica, local_armazenamento) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [nome, quantidade_total, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento]
            );
        }
        res.status(200).send("OK");
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(port, '0.0.0.0', () => console.log(`Backend ativo na porta ${port}`));