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

router.get('/summary/:userId', async (req, res) => {
    const { userId } = req.params;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    try {
        const notificationsQuery = `
            SELECT 
                id_evento AS id, nome_evento AS nome, 'evento' AS tipo, data_fim, 
                DATEDIFF(data_fim, CURDATE()) AS dias_restantes, e.nome AS status_nome
            FROM 
                Evento
            JOIN
                Estado e ON Evento.id_estado = e.id_estado
            WHERE 
                id_user = ? 
                AND data_fim IS NOT NULL 
                AND data_fim <= ?
                AND data_fim > CURDATE()
            ORDER BY data_fim ASC;
        `;
        const [notifications] = await pool.execute(notificationsQuery, [userId, futureDateStr]);

        const activityCountsQuery = `
            SELECT 
                SUM(CASE WHEN e.nome = 'APROVADO' THEN 1 ELSE 0 END) AS requisicoes_ativas,
                SUM(CASE WHEN e.nome = 'PENDENTE' THEN 1 ELSE 0 END) AS requisicoes_pendentes,
                SUM(CASE WHEN e.nome = 'AGENDADO' THEN 1 ELSE 0 END) AS eventos_agendados,
                SUM(CASE WHEN e.nome = 'REJEITADO' THEN 1 ELSE 0 END) AS requisicoes_rejeitadas 
            FROM 
                Evento
            JOIN
                Estado e ON Evento.id_estado = e.id_estado
            WHERE 
                id_user = ?;
        `;
        const [countsRows] = await pool.execute(activityCountsQuery, [userId]);
        const activityCounts = countsRows[0];
        
        const projetoAtual = null;

        res.status(200).json({
            notifications: notifications.map(n => ({
                id: n.id,
                tipo: n.tipo,
                nome: n.nome,
                dias_restantes: n.dias_restantes,
                status_nome: n.status_nome
            })),
            activity_counts: {
                requisicoes_ativas: activityCounts.requisicoes_ativas,
                requisicoes_pendentes: activityCounts.requisicoes_pendentes,
                eventos_agendados: activityCounts.eventos_agendados,
                requisicoes_rejeitadas: activityCounts.requisicoes_rejeitadas,
            },
            projetoAtual: projetoAtual
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro interno ao carregar o dashboard.', error: error.message });
    }
});

module.exports = router;