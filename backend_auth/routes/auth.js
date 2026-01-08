
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const email = username.includes('@') ? username : `${username}@cm-esposende.pt`;
    try {
        const [rows] = await pool.execute('SELECT * FROM Utilizador WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ erro: "Utilizador inexistente" });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            const hash = await bcrypt.hash(password, 10);
            await pool.execute('UPDATE Utilizador SET password_hash = ? WHERE id_user = ?', [hash, user.id_user]);
            return res.status(401).json({ erro: "Sincronização necessária." });
        }
        

        res.json({ 
            id: user.id_user, 
            nome: user.nome, 
            id_perfil: user.id_perfil, 
            email: user.email 
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});