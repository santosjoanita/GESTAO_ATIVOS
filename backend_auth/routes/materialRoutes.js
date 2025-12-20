const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'user_gestao',
    password: process.env.DB_PASS || 'user_password_segura',
    database: process.env.DB_NAME || 'gestao_ativos_db'
});

// Rota para listar todos os materiais ativos para o formulário
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT m.*, c.nome AS categoria_nome 
            FROM Material m
            LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
            WHERE m.ativo = 1;
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar materiais', error: error.message });
    }
});

module.exports = router;