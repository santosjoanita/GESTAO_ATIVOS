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
    const { id_user, id_evento } = req.body;
    
    try {
        const hoje = new Date().toISOString().slice(0, 10);
        
        await pool.execute(
            `INSERT INTO Requisicao (id_user, id_evento, id_estado, data_pedido) 
             VALUES (?, ?, 1, ?)`,
            [id_user, id_evento, hoje]
        );
        
        res.status(201).json({ message: "Requisição criada com sucesso" });
    } catch (e) { 
        console.error("ERRO SQL:", e.message);
        res.status(500).json({ error: "Erro na BD: " + e.message }); 
    }
});

// --- LISTAGENS PERFIL---
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

// --- GESTÃO ---
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
    } catch (e) {
        console.error("ERRO LISTAGEM:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/gestao/eventos/todos', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, es.nome as estado_nome 
            FROM Evento e 
            LEFT JOIN Estado es ON e.id_estado = es.id_estado 
            ORDER BY e.id_evento DESC`);
        res.json(rows);
    } catch (e) {
        console.error("Erro SQL Eventos:", e.message);
        res.status(500).json({ error: "Erro ao listar eventos" });
    }
});
app.put('/api/gestao/requisicoes/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { id_estado } = req.body; 
    try {
        await pool.execute('UPDATE Requisicao SET id_estado = ? WHERE id_req = ?', [id_estado, id]);
        res.json({ message: "Estado atualizado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
// --- GESTÃO DE MATERIAIS ---

app.get('/api/materiais', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM Material ORDER BY nome ASC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Adicionar novo material ou atualizar quantidade
app.post('/api/materiais/update', async (req, res) => {
    const { id_material, nome, quantidade, categoria, descricao_tecnica, local_armazenamento } = req.body;
    try {
        if (id_material) {
            // Atualizar existente
            await pool.execute(
                `UPDATE Material SET nome=?, quantidade=?, categoria=?, 
                 descricao_tecnica=?, local_armazenamento=? WHERE id_material=?`,
                [nome, quantidade, categoria, descricao_tecnica, local_armazenamento, id_material]
            );
        } else {
            // Inserir novo
            await pool.execute(
                `INSERT INTO Material (nome, quantidade, categoria, descricao_tecnica, local_armazenamento) 
                 VALUES (?, ?, ?, ?, ?)`,
                [nome, quantidade, categoria, descricao_tecnica, local_armazenamento]
            );
        }
        res.json({ message: "Stock atualizado com sucesso!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao atualizar base de dados" });
    }
});

// Detalhes do evento + requisições associadas

app.get('/api/gestao/eventos/:id/detalhes', async (req, res) => {
    try {
        //  nome do dono do Evento (criador)
        const [evento] = await pool.execute(`
            SELECT e.*, u.nome as criador 
            FROM Evento e 
            JOIN Utilizador u ON e.id_user = u.id_user 
            WHERE e.id_evento = ?`, [req.params.id]);

        // nome de quem pediu material (requerente)
        const [requisicoes] = await pool.execute(`
            SELECT r.*, u.nome as requerente 
            FROM Requisicao r 
            JOIN Utilizador u ON r.id_user = u.id_user 
            WHERE r.id_evento = ?`, [req.params.id]);
        
        res.json({ evento: evento[0], requisicoes });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});
app.listen(port, '0.0.0.0', () => console.log(`Backend ativo na porta ${port}`));