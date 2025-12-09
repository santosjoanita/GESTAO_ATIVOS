const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors'); 
const app = express();
const port = 3001;

// --- CONFIGURAÇÃO DB (MySQL) ---
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

// --- CORS ---
app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const searchEmail = `${username}@cm-esposende.pt`; 

    try {
        const query = `
            SELECT 
                id_user, nome, email, password_hash, id_perfil 
            FROM 
                Utilizador 
            WHERE 
                email = ?;
        `;
        const [rows] = await pool.query(query, [searchEmail]);
        const user = rows[0];

        if (!user) {
            return res.status(401).send('Credenciais inválidas.');
        }

        // --- VERIFICAÇÃO DA SENHA ---
        // Se a senha for (username + 123), verifica o hash
        const expectedPassword = `${username}123`;
        
        // Compara a senha esperada (expectedPassword) com o hash da DB
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).send('Credenciais inválidas.');
        }

        res.status(200).json({
            message: "Login bem-sucedido.",
            user: {
                id: user.id_user,
                nome: user.nome,
                id_perfil: user.id_perfil
            }
        });

    } catch (error) {
        console.error('Erro no processo de login:', error.stack);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.listen(port, () => {
  console.log(`Serviço de Autenticação a correr na porta ${port}`);
});

pool.query('SELECT 1 + 1 AS solution')
    .then(res => console.log('MySQL conectado com sucesso.'))
    .catch(err => console.error('ERRO CRÍTICO: Falha na conexão MySQL:', err.stack));