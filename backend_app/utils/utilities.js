const crypto = require('crypto');

const utilities = {
    generateUniqueId() {
        return crypto.randomBytes(16).toString('hex').slice(0, 16);
    },

    // Função para obter a data e hora atual formatada
    getDate() {
        let date = new Date();
        return date.getUTCFullYear() + '-' +
            ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
            ('00' + date.getUTCDate()).slice(-2) + ' ' + 
            ('00' + date.getUTCHours()).slice(-2) + ':' + 
            ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
            ('00' + date.getUTCSeconds()).slice(-2);
    }
};

module.exports = utilities;