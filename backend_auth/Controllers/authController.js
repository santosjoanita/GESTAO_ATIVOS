const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const email = username.includes('@') ? username : `${username}@cm-esposende.pt`;

    try {
        const [rows] = await db.execute('SELECT * FROM Utilizador WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ error: "Utilizador inexistente" });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            const hash = await bcrypt.hash(password, 10);
            await db.execute('UPDATE Utilizador SET password_hash = ? WHERE id_user = ?', [hash, user.id_user]);
            return res.status(401).json({ error: "Sincronização necessária. Tente novamente." });
        }

        const token = jwt.sign(
            { id: user.id_user, perfil: user.id_perfil },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({ 
            code: "200",
            message: "success",
            token: token,
            user: {
                id: user.id_user,
                id_user: user.id_user, 
                nome: user.nome,
                id_perfil: user.id_perfil,
                email: user.email
            }
        });

    } catch (e) {
        console.error("Erro no AuthController:", e);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
};