const jwt = require('jsonwebtoken');
const { permissionsByProfile } = require('../auth/acl'); 
const utils = require('../utils/utilities');

// --- 1. VERIFY TOKEN ---
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        const data = utils.getDate ? utils.getDate() : new Date().toISOString();
        console.error(`[${data}] Bloqueado: Sem token.`);
        return res.status(401).json({ 
            code: "401",
            message: "error",
            error: "Acesso negado. Token não fornecido." 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'teu_segredo_aqui');
        req.user = decoded; 
        next(); 
    } catch (error) {
        console.error("Erro token:", error.message);
        return res.status(403).json({ 
            code : "403",
            message: "error",
            error: "Token inválido ou expirado." 
        });
    }
};

// --- 2. CHECK PERMISSION  ---
exports.checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
             return res.status(401).json({ error: "Utilizador não autenticado." });
        }

        const userProfile = req.user.perfil; 
        
        if (!permissionsByProfile || !permissionsByProfile[parseInt(userProfile)]) {
             return res.status(403).json({ error: "Perfil de utilizador inválido." });
        }

        const perms = permissionsByProfile[parseInt(userProfile)];

        if (perms && perms.has(permission)) {
            next(); 
        } else {
            const data = utils.getDate ? utils.getDate() : new Date().toISOString();
            console.warn(`[${data}] Proibido: Perfil ${userProfile} sem permissão.`);
            res.status(403).json({ 
                code: "403",
                message: "error", 
                error: "Sem permissão para esta ação."
            });
        }
    };
};