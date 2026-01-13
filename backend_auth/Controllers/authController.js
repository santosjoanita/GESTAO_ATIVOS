const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


exports.login = async (req, res) => {
    const { username, password } = req.body;
    
    // Lógica para aceitar username ou email completo
    const email = username.includes('@') ? username : `${username}@cm-esposende.pt`;

    try {
        const [rows] = await db.execute('SELECT * FROM Utilizador WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ erro: "Utilizador inexistente" });
        }

        const user = rows[0];

        // Comparar password com a hash da BD
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {

            return res.status(401).json({ erro: "Credenciais inválidas" });
        }

        const token = jwt.sign(
            { id: user.id_user, perfil: user.id_perfil },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );


        res.status(200).json({ 
            auth: true,
            token: token,
            user: {
                id: user.id_user,
                nome: user.nome,
                id_perfil: user.id_perfil,
                email: user.email,
                token: token
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro interno no servidor de autenticação" });
    }
};