const db = require('../config/db');

exports.atualizarEstado = async (req, res) => {
    const { tipo, id } = req.params;
    const { id_estado } = req.body;
    
    const tabela = tipo === 'requisicoes' ? 'Requisicao' : 'Evento';
    const pk = tipo === 'requisicoes' ? 'id_req' : 'id_evento';

    try {
        await db.execute(`UPDATE ${tabela} SET id_estado = ? WHERE ${pk} = ?`, [id_estado, id]);
        res.send("Estado atualizado com sucesso");
    } catch (e) {
        res.status(500).send(e.message);
    }
};