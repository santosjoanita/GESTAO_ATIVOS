const db = require('../config/db');

// Rota de listagem 
exports.listarTodos = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT u.id_user, u.nome, u.email, u.ativo, p.nome as perfil_nome, u.id_perfil
            FROM Utilizador u 
            JOIN Perfil p ON u.id_perfil = p.id_perfil
            ORDER BY u.nome ASC
        `);
        res.json(rows);
    } catch (e) {
        console.error("Erro em listarTodos:", e.message);
        res.status(500).json({ error: e.message });
    }
};

exports.alterarPerfil = async (req, res) => {
    const { id_perfil } = req.body;
    const { id } = req.params;
    try {
        await db.execute('UPDATE Utilizador SET id_perfil = ? WHERE id_user = ?', [id_perfil, id]);
        res.json({ message: "Perfil atualizado com sucesso" });
    } catch (e) {
        res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
};

exports.alterarEstado = async (req, res) => {
    const { ativo } = req.body;
    const { id } = req.params;
    try {
        await db.execute('UPDATE Utilizador SET ativo = ? WHERE id_user = ?', [ativo, id]);
        res.json({ message: "Estado alterado com sucesso" });
    } catch (e) {
        res.status(500).json({ error: "Erro ao alterar estado" });
    }
};