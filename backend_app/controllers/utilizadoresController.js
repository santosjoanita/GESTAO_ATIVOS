const db = require('../config/db');

// Listar todos os utilizadores 
exports.listarTodos = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT u.id_user, u.nome, u.email, p.nome as perfil 
            FROM Utilizador u 
            JOIN Perfil p ON u.id_perfil = p.id_perfil
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({
            code: "500",
            message: "erro",
             erro: e.message
             });
    }
};

// Ver detalhes de um perfil específico
exports.obterPerfil = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Perfil');
        res.json(rows);
    } catch (e) {
        res.status(500).json([]);
    }
};