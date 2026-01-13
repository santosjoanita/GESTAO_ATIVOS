const jwt = require('jsonwebtoken');
const { permissionsByProfile } = require('../auth/acl'); 
const utils = require('../utils/utilities');


exports.checkPermission = (permission) => {
    return (req, res, next) => {
        
        // --- 1. VALIDAR TOKEN ---
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            console.error(`[${utils.getDate()}] Bloqueado: Sem token.`);
            return res.status(401).json({ 
                code: "401",
                message: "error",
                error: "Acesso negado. Token não fornecido." 
            });
        }

        try {
            // Verifica se o token é verdadeiro
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; 

            // --- 2. VERIFICAR PERMISSÕES ---
            const userProfile = decoded.perfil; 
            const perms = permissionsByProfile[parseInt(userProfile)];

            if (perms && perms.has(permission)) {
                next(); 
            } else {
                console.warn(`[${utils.getDate()}] Proibido: Perfil ${userProfile} sem permissão.`);
                res.status(403).json({ 
                   code: "403",
                   message: "error", 
                   error: "Sem permissão para esta ação."
                });
            }

        } catch (error) {
            console.error("Erro token:", error.message);
            return res.status(403).json({ 
                code : "403",
                message: "error",
                error: "Token inválido ou expirado." 
            });
        }
    };
};