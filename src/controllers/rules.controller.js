const db = require('../config/db');

exports.getUserRules = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query('SELECT * FROM reglas_filtrado WHERE usuario_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching rules' });
  }
};

exports.addRule = async (req, res) => {
  const { userId } = req.params;
  const { campo, valor } = req.body;

  if (!campo || !valor) {
    return res.status(400).json({ message: 'Campo and valor are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO reglas_filtrado (usuario_id, campo, valor) VALUES ($1, $2, $3) RETURNING *',
      [userId, campo, valor]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding rule' });
  }
};

exports.deleteRule = async (req, res) => {
  const { ruleId } = req.params;
  try {
    const result = await db.query('DELETE FROM reglas_filtrado WHERE id = $1 RETURNING id', [ruleId]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Rule not found' });
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting rule' });
  }
};
