const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' })); 
app.use('/uploads', express.static('uploads'));

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'user_gestao',
    password: process.env.DB_PASS || 'user_password_segura',
    database: process.env.DB_NAME || 'gestao_ativos_db',
    waitForConnections: true,
    connectionLimit: 15
});

// --- 1. AUTENTICAÇÃO ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const email = username.includes('@') ? username : `${username}@cm-esposende.pt`;
    try {
        const [rows] = await pool.execute('SELECT * FROM Utilizador WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ erro: "Utilizador inexistente" });
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const hash = await bcrypt.hash(password, 10);
            await pool.execute('UPDATE Utilizador SET password_hash = ? WHERE id_user = ?', [hash, user.id_user]);
            return res.status(401).json({ erro: "Sincronização necessária." });
        }
        res.json({ id: user.id_user, id_user: user.id_user, nome: user.nome, id_perfil: user.id_perfil, email: user.email });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 2. EVENTOS & ANEXOS ---
app.get('/api/notificacoes/prazos/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                r.id_req as id,
                e.nome_evento,
                DATEDIFF(e.data_fim, CURDATE()) as dias_restantes,
                'requisição' as tipo
            FROM Requisicao r
            JOIN Evento e ON r.id_evento = e.id_evento
            WHERE r.id_user = ? 
              AND DATEDIFF(e.data_fim, CURDATE()) BETWEEN 0 AND 3
              AND r.id_estado = 2 -- Apenas as que foram aprovadas/estão ativas
            ORDER BY dias_restantes ASC`, [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/eventos/lista-simples', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id_evento, nome_evento FROM Evento WHERE id_estado = 2');
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/eventos/user/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, es.nome as estado_nome FROM Evento e 
            JOIN Estado es ON e.id_estado = es.id_estado 
            WHERE e.id_user = ? ORDER BY e.id_evento DESC`, [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/gestao/eventos/todos', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, u.nome as requerente, es.nome as estado_nome FROM Evento e 
            JOIN Utilizador u ON e.id_user = u.id_user 
            JOIN Estado es ON e.id_estado = es.id_estado 
            ORDER BY e.id_evento DESC`);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/eventos/summary/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM Evento WHERE id_evento = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Não encontrado" });
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/api/eventos', upload.array('anexos'), async (req, res) => {
    const { nome_evento, descricao, localizacao, data_inicio, data_fim, id_user } = req.body;
    try {
        const [resEv] = await pool.execute(
            `INSERT INTO Evento (nome_evento, descricao, data_inicio, data_fim, localizacao, id_user, id_estado) VALUES (?, ?, ?, ?, ?, ?, 1)`, 
            [nome_evento, descricao, data_inicio, data_fim || data_inicio, localizacao, id_user]
        );
        if (req.files) {
            for (const f of req.files) {
                await pool.execute(`INSERT INTO EventoAnexo (id_evento, nome, nome_oculto, extensao, ativo) VALUES (?, ?, ?, ?, 1)`, 
                [resEv.insertId, f.originalname, f.filename, path.extname(f.originalname)]);
            }
        }
        res.status(201).json({ id: resEv.insertId });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/api/eventos/:id/anexos', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM EventoAnexo WHERE id_evento = ? AND ativo = 1", [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

// --- 3. REQUISIÇÕES ---
app.get('/api/requisicoes/user/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
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
        console.error("Erro ao listar requisições:", e);
        res.status(500).json([]); 
    }
});

app.get('/api/gestao/requisicoes/todas', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.*, u.nome as requerente, e.nome_evento, es.nome as estado_nome FROM Requisicao r 
            JOIN Utilizador u ON r.id_user = u.id_user 
            JOIN Evento e ON r.id_evento = e.id_evento 
            JOIN Estado es ON r.id_estado = es.id_estado 
            ORDER BY r.id_req DESC`);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/requisicoes', async (req, res) => {
    const { id_evento, id_user } = req.body;

    try {
        if (!id_evento || !id_user) {
            return res.status(400).json({ error: "Faltam dados obrigatórios." });
        }

        const [result] = await pool.execute(
            `INSERT INTO Requisicao (id_evento, id_user, data_pedido, id_estado) 
             VALUES (?, ?, NOW(), 1)`,
            [id_evento, id_user]
        );

        res.status(201).json({ id: result.insertId, message: "Requisição criada com sucesso!" });

    } catch (error) {
        console.error("ERRO NO BACKEND:", error.message);
        res.status(500).json({ error: "Erro interno no servidor", detalhes: error.message });
    }
});

// --- 4. MATERIAIS & CATÁLOGO ---
app.get('/api/materiais', async (req, res) => {
    const isAdmin = req.query.admin === 'true';
    const sql = isAdmin 
        ? 'SELECT * FROM Material ORDER BY nome ASC' 
        : 'SELECT * FROM Material WHERE visivel = 1 ORDER BY nome ASC';
    try {
        const [rows] = await pool.execute(sql);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

// --- 4. MATERIAIS & CATÁLOGO (PADRÃO REST) ---

//  Criar novo material
app.post('/api/materiais', upload.single('imagem'), async (req, res) => {
    const { nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, id_user } = req.body;
    const imagem_url = req.file ? req.file.filename : null;

    try {
        await pool.execute(
            `INSERT INTO Material (nome, quantidade_total, quantidade_disp, categoria, especificacoes, descricao_tecnica, local_armazenamento, imagem_url, visivel) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`, 
            [nome, quantidade_total, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, imagem_url]
        );
        
        await pool.execute(
            `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, 'Adicionou', ?)`, 
            [id_user || 1, nome, quantidade_total]
        );
        res.status(201).send("Criado com sucesso");
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Atualizar material existente
app.put('/api/materiais/:id', upload.single('imagem'), async (req, res) => {
    const { id } = req.params;
    const { nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, id_user } = req.body;
    
    try {
        // 1. Ir buscar os dados atuais para comparar o que mudou
        const [rows] = await pool.execute('SELECT * FROM Material WHERE id_material = ?', [id]);
        if (rows.length === 0) return res.status(404).send("Material não encontrado");
        const antigo = rows[0];

        let alteracoes = [];
        if (antigo.nome !== nome) alteracoes.push("nome");
        if (antigo.quantidade_total != quantidade_total) alteracoes.push("stock");
        if (antigo.categoria !== categoria) alteracoes.push("categoria");
        if (antigo.local_armazenamento !== local_armazenamento) alteracoes.push("localização");
        if (antigo.especificacoes !== especificacoes) alteracoes.push("especificações");
        if (req.file) alteracoes.push("foto");

        // Criar a descrição detalhada
        const acaoTexto = alteracoes.length > 0 
            ? `Editou: ${alteracoes.join(', ')}` 
            : 'Editou (sem alterações)';

        let final_imagem_url = req.file ? req.file.filename : req.body.imagem_url;

        await pool.execute(
            `UPDATE Material SET 
                nome=?, quantidade_total=?, categoria=?, especificacoes=?, 
                descricao_tecnica=?, local_armazenamento=?, imagem_url=?, 
                quantidade_disp=? 
             WHERE id_material=?`, 
            [nome, quantidade_total, categoria, especificacoes, descricao_tecnica, local_armazenamento, final_imagem_url, quantidade_total, id]
        );
        
        await pool.execute(
            `INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, ?, ?)`, 
            [id_user || 1, nome, acaoTexto, quantidade_total]
        );

        res.send("Atualizado com sucesso");
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
});

app.put('/api/materiais/:id/visibilidade', async (req, res) => {
    const { id } = req.params;
    const { visivel, id_user } = req.body; 
    try {
        const [rows] = await pool.execute('SELECT nome FROM Material WHERE id_material = ?', [id]);
        if (rows.length === 0) return res.status(404).send("Não encontrado");
        await pool.execute('UPDATE Material SET visivel = ? WHERE id_material = ?', [visivel, id]);
        const acao = visivel ? 'Ativou' : 'Ocultou';
        await pool.execute(`INSERT INTO Historico_Stock (id_user, item_nome, tipo_movimento, quantidade_alt) VALUES (?, ?, ?, 0)`, [id_user || 1, rows[0].nome, acao]);
        res.send("OK");
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/categorias', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM Categoria ORDER BY nome ASC");
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

// --- 5. STOCK & HISTÓRICO ---
app.get('/api/stock/historico', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT h.*, u.nome as nome_utilizador FROM Historico_Stock h 
            JOIN Utilizador u ON h.id_user = u.id_user 
            ORDER BY h.data_movimento DESC LIMIT 50`);
        res.json(rows);
    } catch (e) { res.status(500).json([]); }
});

// --- 6. GESTÃO DE ESTADOS ---
app.put('/api/gestao/:tipo/:id/estado', async (req, res) => {
    const { tipo, id } = req.params;
    const { id_estado } = req.body;
    const tabela = tipo === 'requisicoes' ? 'Requisicao' : 'Evento';
    const pk = tipo === 'requisicoes' ? 'id_req' : 'id_evento';
    try {
        await pool.execute(`UPDATE ${tabela} SET id_estado = ? WHERE ${pk} = ?`, [id_estado, id]);
        res.send("OK");
    } catch (e) { res.status(500).send(e.message); }
});

app.listen(port, '0.0.0.0', () => console.log(`🚀 Server on port ${port}`));