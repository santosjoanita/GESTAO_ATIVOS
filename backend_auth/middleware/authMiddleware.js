const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {

    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ erro: "Nenhum token fornecido." });
    }

    const bearerToken = token.split(' ')[1] || token;

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ erro: "Token inválido ou expirado." });
        }
        
        req.userId = decoded.id;
        req.userPerfil = decoded.perfil; 
        next();
    });
};

module.exports = verificarToken;