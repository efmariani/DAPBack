const db = require('../config/db');

exports.createTicket = async (req, res) => {
  // Honeypot check
  if (req.body.opinion) {
    return res.status(400).json({ message: 'Bot detected.' });
  }

  const { nombre, email, telefono, establecimiento, direccion, marca, modelo, n_serie, consulta, usuario_id } = req.body;

  try {
    await db.query(
      `INSERT INTO tickets (nombre, email, telefono, establecimiento, direccion, marca, modelo, n_serie, consulta, usuario_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [nombre, email, telefono, establecimiento, direccion, marca, modelo, n_serie, consulta, usuario_id]
    );
    res.status(201).json({ message: 'Ticket created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating ticket' });
  }
};

exports.updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const validStates = ['Pendiente', 'En Curso', 'Resuelto'];
  if (!validStates.includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido. Use: Pendiente, En Curso, Resuelto.' });
  }

  try {
    const result = await db.query(
      'UPDATE tickets SET estado = $1 WHERE id = $2 RETURNING id',
      [estado, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Ticket no encontrado.' });
    res.json({ message: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estado del ticket.' });
  }
};

// Admin can update any field
exports.updateTicket = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields).filter(k => k !== 'id' && k !== 'created_at');
  
  if (keys.length === 0) return res.status(400).json({ message: 'No fields to update' });

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = keys.map(key => fields[key]);

  try {
    const result = await db.query(
      `UPDATE tickets SET ${setClause} WHERE id = $${keys.length + 1} RETURNING id`,
      [...values, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating ticket' });
  }
};

exports.deleteTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting ticket' });
  }
};

// Internal function to build the rules-based filter
const buildRulesFilter = async (user) => {
  if (user.role === 'Administrador') return { condition: 'TRUE', params: [] };

  const rulesResult = await db.query('SELECT campo, valor FROM reglas_filtrado WHERE usuario_id = $1', [user.id]);
  const rules = rulesResult.rows;

  if (rules.length === 0) {
    // If NO rules are set, should they see only their own tickets?
    // Let's assume ONLY tickets created by them or their email.
    return { condition: '(usuario_id = $1 OR email = $2)', params: [user.id, user.email] };
  }

  const conditions = rules.map((r, i) => `${r.campo} = $${i + 1}`);
  return { 
    condition: `(${conditions.join(' OR ')})`, 
    params: rules.map(r => r.valor) 
  };
};

exports.getTickets = async (req, res) => {
  const { user } = req;
  const { estado } = req.query; // Optional filter by status

  try {
    const filter = await buildRulesFilter(user);
    let query = `SELECT * FROM tickets WHERE ${filter.condition}`;
    let params = [...filter.params];

    if (estado) {
      query += ` AND estado = $${params.length + 1}`;
      params.push(estado);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};

exports.searchTickets = async (req, res) => {
  const { user } = req;
  const { q, field } = req.query; // Search query and optional field

  try {
    const filter = await buildRulesFilter(user);
    let query = `SELECT * FROM tickets WHERE ${filter.condition}`;
    let params = [...filter.params];

    if (q) {
      if (field) {
        query += ` AND ${field} ILIKE $${params.length + 1}`;
        params.push(`%${q}%`);
      } else {
        // Generic search on multiple fields
        query += ` AND (nombre ILIKE $${params.length + 1} OR establecimiento ILIKE $${params.length + 1} OR n_serie ILIKE $${params.length + 1})`;
        params.push(`%${q}%`);
      }
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error searching tickets' });
  }
};
