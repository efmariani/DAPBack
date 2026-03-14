const db = require('../config/db');

exports.createTicket = async (req, res) => {
  // Honeypot check
  if (req.body.opinion) {
    return res.status(400).json({ message: 'Bot detected.' });
  }

  const { nombre, email, telefono, establecimiento, direccion, marca, modelo, n_serie, consulta } = req.body;

  try {
    await db.query(
      `INSERT INTO tickets (nombre, email, telefono, establecimiento, direccion, marca, modelo, n_serie, consulta) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [nombre, email, telefono, establecimiento, direccion, marca, modelo, n_serie, consulta]
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

exports.getTickets = async (req, res) => {
  const { user } = req;

  try {
    let query = 'SELECT * FROM tickets';
    let params = [];

    if (user.role === 'Cliente') {
      query += ' WHERE email = $1';
      params = [user.email];
    } else if (user.role === 'Técnico') {
       // Filter by assigned technician - this assumes we have a column for it
       // query += ' WHERE tecnico_asignado_id = $1';
       // params = [user.id];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};
