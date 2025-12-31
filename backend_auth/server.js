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
// 1. AUTENTICAÇÃO E SEGURANÇA
// ==========================================


app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const emailCompleto = username.includes('@') ? username : `${username}@cm-esposende.pt`;

    try {
        const [rows] = await pool.execute('SELECT * FROM Utilizador WHERE email = ?', [emailCompleto]);
        
        if (rows.length === 0) return res.status(401).json({ erro: "User não encontrado" });

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            console.log("Hash incompatível detetado. A gerar hash nativo do Docker...");
            
            const novoHashNativo = await bcrypt.hash(password, 10);
            
            await pool.execute('UPDATE Utilizador SET password_hash = ? WHERE id_user = ?', [novoHashNativo, user.id_user]);
            
            console.log("Hash atualizado com sucesso na BD. Tenta agora o login novamente!");
            return res.status(401).json({ erro: "Sistema sincronizado. Tenta login outra vez!" });
        }

        console.log("LOGIN SUCESSO!");
        res.json({ id: user.id_user, nome: user.nome, id_perfil: user.id_perfil });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno" });
    }
});

// ==========================================
// 2. DASHBOARD E EVENTOS
// ==========================================

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

app.get('/api/eventos/user/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, es.nome as estado_nome FROM Evento e 
            JOIN Estado es ON e.id_estado = es.id_estado WHERE e.id_user = ?`, [req.params.id]);
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

// ==========================================
// 3. PAINEL DE GESTÃO (ADMIN/GESTOR)
// ==========================================

app.get('/api/gestao/eventos', async (req, res) => {
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

app.put('/api/gestao/eventos/:id/estado', async (req, res) => {
    const { id_estado } = req.body; 
    try {
        await pool.execute("UPDATE Evento SET id_estado = ? WHERE id_evento = ?", [id_estado, req.params.id]);
        res.status(200).send("Evento atualizado");
    } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
// 4. GESTÃO DE MATERIAIS
// ==========================================

app.get('/api/materiais', async (req, res) => {
    const isAdmin = req.query.admin === 'true';
    const query = isAdmin 
        ? 'SELECT * FROM Material ORDER BY nome ASC' 
        : 'SELECT * FROM Material WHERE visivel = 1 ORDER BY nome ASC';
    try {
        const [rows] = await pool.execute(query);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/materiais/update', async (req, res) => {
    const { 
        id_material, nome, quantidade_total, categoria, 
        especificacoes, descricao_tecnica, local_armazenamento, visivel 
    } = req.body;
    try {
        if (id_material) {
            await pool.execute(
                `UPDATE Material SET nome=?, quantidade_total=?, categoria=?, especificacoes=?, 
                descricao_tecnica=?, local_armazenamento=?, visivel=?, quantidade_disp=? WHERE id_material=?`,
                [nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, visivel ?? 1, quantidade_total, id_material]
            );
        } else {
            await pool.execute(
                `INSERT INTO Material (nome, quantidade_total, quantidade_disp, categoria, especificacoes, 
                descricao_tecnica, local_armazenamento, visivel) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [nome, quantidade_total, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento]
            );
        }
        res.status(200).send("OK");
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/materiais/movimentar', async (req, res) => {
    const { id_material, quantidade, tipo } = req.body; 
    try {
        const operador = tipo === 'entrada' ? '+' : '-';
        await pool.execute(
            `UPDATE Material SET quantidade_total = quantidade_total ${operador} ?, 
            quantidade_disp = quantidade_disp ${operador} ? WHERE id_material = ?`,
            [quantidade, quantidade, id_material]
        );
        res.json({ message: "Stock atualizado com sucesso" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/categorias', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT id_categoria, nome FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(port, '0.0.0.0', () => console.log(`Backend ativo na porta ${port}`));