const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// --- CONFIGURAÇÃO DE UPLOADS ---
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- MIDDLEWARES ---
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '20mb' })); 
app.use('/uploads', express.static('uploads'));

// --- CONEXÃO BD ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'user_gestao',
    password: process.env.DB_PASS || 'user_password_segura',
    database: process.env.DB_NAME || 'gestao_ativos_db',
    waitForConnections: true,
    connectionLimit: 10
});

// ==========================================
// 1. AUTENTICAÇÃO
// ==========================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const emailCompleto = username.includes('@') ? username : `${username}@cm-esposende.pt`;

    try {
        const [rows] = await pool.execute('SELECT * FROM Utilizador WHERE email = ?', [emailCompleto]);
        if (rows.length === 0) return res.status(401).json({ erro: "Utilizador não encontrado" });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            const novoHashNativo = await bcrypt.hash(password, 10);
            await pool.execute('UPDATE Utilizador SET password_hash = ? WHERE id_user = ?', [novoHashNativo, user.id_user]);
            return res.status(401).json({ erro: "Ambiente sincronizado. Tenta login outra vez!" });
        }

        res.json({ id: user.id_user, nome: user.nome, id_perfil: user.id_perfil });
    } catch (error) {
        res.status(500).json({ error: "Erro interno" });
    }
});

// ==========================================
// 2. DASHBOARD GESTOR
// ==========================================
app.get('/api/gestao/requisicoes/todas', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.id_req, u.nome as requerente, e.nome_evento, es.nome as estado_nome
            FROM Requisicao r
            JOIN Utilizador u ON r.id_user = u.id_user
            JOIN Evento e ON r.id_evento = e.id_evento
            JOIN Estado es ON r.id_estado = es.id_estado
            ORDER BY r.id_req DESC`);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/gestao/eventos/todos', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.id_evento, e.nome_evento, e.localizacao, u.nome as requerente, es.nome as estado_nome
            FROM Evento e
            JOIN Utilizador u ON e.id_user = u.id_user
            JOIN Estado es ON e.id_estado = es.id_estado
            ORDER BY e.id_evento DESC`);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.put('/api/gestao/:tipo/:id/estado', async (req, res) => {
    const { tipo, id } = req.params;
    const { id_estado } = req.body;
    const tabela = tipo === 'requisicoes' ? 'Requisicao' : 'Evento';
    const pk = tipo === 'requisicoes' ? 'id_req' : 'id_evento';

    try {
        await pool.execute(`UPDATE ${tabela} SET id_estado = ? WHERE ${pk} = ?`, [id_estado, id]);
        res.send("Estado atualizado com sucesso");
    } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 3. GESTÃO DE MATERIAIS (STOCK)
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
        especificacoes, descricao_tecnica, local_armazenamento, 
        visivel, imagem_url, id_user_responsavel 
    } = req.body;

    try {
        if (id_material) {
            await pool.execute(
                `UPDATE Material SET nome=?, quantidade_total=?, categoria=?, especificacoes=?, 
                descricao_tecnica=?, local_armazenamento=?, visivel=?, imagem_url=?, quantidade_disp=? WHERE id_material=?`,
                [nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, visivel ?? 1, imagem_url, quantidade_total, id_material]
            );
            await pool.execute(
                `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'Editou', ?)`,
                [id_user_responsavel || 1, nome, quantidade_total]
            );
        } else {
            await pool.execute(
                `INSERT INTO Material (nome, quantidade_total, quantidade_disp, categoria, especificacoes, 
                descricao_tecnica, local_armazenamento, imagem_url, visivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [nome, quantidade_total, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, imagem_url]
            );
            await pool.execute(
                `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'Adicionou', ?)`,
                [id_user_responsavel || 1, nome, quantidade_total]
            );
        }
        res.status(200).send("OK");
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/stock/historico', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT h.*, u.nome as nome_utilizador 
            FROM Historico_Stock h
            JOIN Utilizador u ON h.id_user = u.id_user
            ORDER BY h.data_movimento DESC LIMIT 50`);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/categorias', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT id_categoria, nome FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
// 4. EVENTOS E ANEXOS 
// ==========================================
app.post('/api/eventos', upload.array('anexos'), async (req, res) => {
    const { nome_evento, descricao, localizacao, data_inicio, data_fim, id_user } = req.body;
    
    if (!nome_evento || !id_user) {
        return res.status(400).json({ error: "Nome e Utilizador são obrigatórios." });
    }

    try {
        // 1. Inserir Evento
        const [result] = await pool.execute(
            `INSERT INTO Evento (nome_evento, descricao, data_inicio, data_fim, localizacao, id_user, id_estado) 
             VALUES (?, ?, ?, ?, ?, ?, 1)`, 
            [nome_evento, descricao, data_inicio, data_fim || data_inicio, localizacao, id_user]
        );
        
        const id_evento = result.insertId;

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await pool.execute(
                    `INSERT INTO EventoAnexo (id_evento, nome, nome_oculto, extensao, ativo) 
                     VALUES (?, ?, ?, ?, 1)`,
                    [id_evento, file.originalname, file.filename, path.extname(file.originalname)]
                );
            }
        }
        
        res.status(201).json({ message: "Evento e anexos criados com sucesso!", id_evento });
    } catch (e) {
        console.error("Erro SQL:", e);
        res.status(500).json({ error: "Erro interno ao criar evento." });
    }
});

app.get('/api/eventos/:id/anexos', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM EventoAnexo WHERE id_evento = ? AND ativo = 1", 
            [req.params.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.listen(port, '0.0.0.0', () => console.log(`Backend ativo na porta ${port}`));