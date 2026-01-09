const { permissionsByProfile } = require('../auth/acl');
const utils = require('../utils/utilities');

exports.checkPermission = (permission) => {
    return (req, res, next) => {
        const userProfile = req.headers['x-user-profile']; 
        const userName = req.headers['x-user-name'] || 'Desconhecido';

        console.log(`--- Verificando: Utilizador ${userName} (Perfil ${userProfile}) ---`);
        console.log(`Permissão necessária: ${permission}`);

        if (!userProfile) {
            console.error(`[${utils.getDate()}] Bloqueado: Tentativa de acesso sem perfil.`);
            return res.status(401).json({ erro: "Utilizador não autenticado." });
        }

        const perms = permissionsByProfile[parseInt(userProfile)];

        if (perms && typeof perms.has === 'function' && perms.has(permission)) {
            console.log("Acesso Concedido ✅");
            next();
        } else {
            console.warn(`[${utils.getDate()}] ACESSO NEGADO: Utilizador ${userName} tentou aceder a ${req.originalUrl} sem a permissão ${permission}.`);
            
            res.status(403).json({ 
                erro: "Acesso proibido: Não tens permissão.",
                timestamp: utils.getDate()
            });
        }
    };
};