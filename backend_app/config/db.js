const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 20, 
    queueLimit: 0
});


(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Backend_App: Ligado ao MySQL com sucesso!');
        connection.release();
    } catch (err) {
        console.error('❌ Backend_App: Erro ao ligar à BD:', err.message);
    }
})();

module.exports = pool;