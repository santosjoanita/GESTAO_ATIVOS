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
    database: process.env.DB_NAME || 'gestao_ativos_db'
});

app.use(express.json());
app.use(cors());

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const email = username.includes('@') ? username : `${username}@cm-esposende.pt`; 

    try {
        const [rows] = await pool.execute(
            `SELECT id_user, nome, email, password_hash, id_perfil FROM Utilizador WHERE email = ?`, 
            [email]
        );

        if (rows.length > 0) {
            const user = rows[0];
            let isMatch = false;

            // Se a password na BD começar por $2, é um hash (caso do Bruno)
            if (user.password_hash.startsWith('$2')) {
                isMatch = await bcrypt.compare(password, user.password_hash);
            } else {
                // Caso contrário é texto simples (caso do José António)
                isMatch = (password === user.password_hash);
            }

            if (isMatch) {
                const { password_hash, ...userSafe } = user;
                console.log(`Sucesso: ${user.nome} entrou como Perfil ${user.id_perfil}`);
                return res.json(userSafe);
            }
        }
        res.status(401).json({ message: "Credenciais inválidas" });
    } catch (error) {
        res.status(500).send("Erro no servidor");
    }
});

// Rotas de Gestão (Requisições e Eventos)
app.get('/api/gestao/requisicoes/todas', async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT r.*, e.nome_evento, u.nome as requerente 
        FROM Requisicao r 
        JOIN Evento e ON r.id_evento = e.id_evento 
        JOIN Utilizador u ON r.id_user = u.id_user`);
    res.json(rows);
});

app.listen(port, () => console.log(`Servidor na porta ${port}`));