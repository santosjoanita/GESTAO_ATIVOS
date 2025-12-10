const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'user_gestao',
    password: process.env.DB_PASS || 'user_password_segura',
    database: process.env.DB_NAME || 'gestao_ativos_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const ESTADO_PENDENTE_ID = 1; 
const ID_USER_TESTE = 1; 

router.post('/', async (req, res) => {
    const { 
        nome, 
        descricao, 
        localizacao, 
        data_inicio, 
        hora_inicio, 
        data_fim, 
        hora_fim 
    } = req.body;

    if (!nome || !data_inicio) {
        return res.status(400).json({ 
            message: 'Erro: Campos obrigatórios (nome, data_inicio) em falta.' 
        });
    }

    const query = `
        INSERT INTO Evento (
            id_user, id_estado, nome_evento, descricao, localizacao, 
            data_inicio, hora_inicio, data_fim, hora_fim
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        ID_USER_TESTE, ESTADO_PENDENTE_ID, nome, descricao, localizacao, 
        data_inicio, hora_inicio || null, data_fim || null, hora_fim || null
    ];

    try {
        const [result] = await pool.execute(query, values); 
        
        res.status(201).json({ 
            message: 'Evento criado com sucesso e enviado para aprovação.', 
            eventId: result.insertId 
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Erro interno ao submeter o evento.', 
            error: error.message 
        });
    }
});

router.get('/perfil/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const userQuery = `
            SELECT 
                u.nome, u.email, p.nome AS perfil_nome
            FROM 
                Utilizador u
            JOIN 
                Perfil p ON u.id_perfil = p.id_perfil
            WHERE 
                u.id_user = ?;
        `;
        const [userRows] = await pool.execute(userQuery, [userId]);
        const userData = userRows[0];

        if (!userData) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        const eventsQuery = `
            SELECT 
                id_evento, nome_evento, data_inicio, data_fim, e.nome AS estado_nome
            FROM 
                Evento
            JOIN
                Estado e ON Evento.id_estado = e.id_estado
            WHERE 
                id_user = ?
            ORDER BY data_criacao DESC;
        `;
        const [eventRows] = await pool.execute(eventsQuery, [userId]);
        
        // Retorna null, o frontend irá definir o default 'Sem requisição ativa'
        const projetoAtual = null; 

        res.status(200).json({
            nome: userData.nome,
            email: userData.email,
            perfil: userData.perfil_nome,
            projetoAtual: projetoAtual,
            eventos: eventRows
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro interno ao carregar o perfil.' });
    }
});

module.exports = router;