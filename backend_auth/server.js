const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors'); 
const app = express();
const port = 3001;

const eventosRoutes = require('./routes/eventosRoutes'); 
const materialRoutes = require('./routes/materialRoutes'); 

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'user_gestao',
    password: process.env.DB_PASS || 'user_password_segura',
    database: process.env.DB_NAME || 'gestao_ativos_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const searchEmail = `${username}@cm-esposende.pt`; 
    try {
        const query = `SELECT id_user, nome, email, password_hash, id_perfil FROM Utilizador WHERE email = ?;`;
        const [rows] = await pool.execute(query, [searchEmail]); 
        const user = rows[0];
        if (!user) return res.status(401).send('Incorreto');
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).send('Incorreto');
        res.status(200).json({ user: { id: user.id_user, nome: user.nome, id_perfil: user.id_perfil } });
    } catch (e) { res.status(500).send(e); }
});

app.post('/api/requisicoes', async (req, res) => {
    const { id_evento, id_user, data_reserva, notas } = req.body;
    try {
        const query = `INSERT INTO Requisicao (id_evento, id_user, data_requisicao, estado, notas) VALUES (?, ?, ?, 'Pendente', ?)`;
        const [result] = await pool.execute(query, [id_evento, id_user, data_reserva, notas]);
        res.status(201).json({ id_requisicao: result.insertId });
    } catch (e) { res.status(500).send(e); }
});

app.get('/api/requisicoes/user/:id_user', async (req, res) => {
    try {
        const query = `SELECT r.*, e.nome as nome_evento FROM Requisicao r JOIN Evento e ON r.id_evento = e.id_evento WHERE r.id_user = ?`;
        const [rows] = await pool.execute(query, [req.params.id_user]);
        res.json(rows);
    } catch (e) { res.status(500).send(e); }
});

app.use('/api/eventos', eventosRoutes); 
app.use('/api/materiais', materialRoutes);
app.use('/uploads', express.static('uploads'));

app.listen(port, () => console.log(`3001`));