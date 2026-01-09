const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const bcrypt = require('bcrypt');


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const email = username.includes('@') ? username : `${username}@cm-esposende.pt`;
    
    try {
        const [rows] = await db.execute('SELECT * FROM Utilizador WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ erro: "Utilizador inexistente" });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            // Lógica de sincronização que tinhas no server.js
            const hash = await bcrypt.hash(password, 10);
            await db.execute('UPDATE Utilizador SET password_hash = ? WHERE id_user = ?', [hash, user.id_user]);
            return res.status(401).json({ erro: "Sincronização necessária. Tente novamente." });
        }
        
        res.json({ 
            id: user.id_user, 
            id_user: user.id_user, 
            nome: user.nome, 
            id_perfil: user.id_perfil, 
            email: user.email 
        });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

module.exports = router;