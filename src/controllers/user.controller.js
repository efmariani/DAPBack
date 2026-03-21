const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT u.id, u.nombre, u.email, r.nombre as role, u.columnas_visibles FROM usuarios u JOIN roles r ON u.rol_id = r.id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { roleName } = req.body;

  try {
    const roleResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [roleName]);
    if (roleResult.rows.length === 0) return res.status(400).json({ message: 'Invalid role' });

    await db.query('UPDATE usuarios SET rol_id = $1 WHERE id = $2', [roleResult.rows[0].id, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
};

exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const isAdminReset = req.user.id !== id; // Check if it's an admin resetting another user's password

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // If it's an admin reset, we set must_change_password = true
    const query = 'UPDATE usuarios SET password = $1, must_change_password = $2 WHERE id = $3';
    await db.query(query, [hashedPassword, isAdminReset, id]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};
exports.updateColumns = async (req, res) => {
  const { id } = req.params;
  const { columns } = req.body; // e.g., '0,1,3'

  try {
    await db.query('UPDATE usuarios SET columnas_visibles = $1 WHERE id = $2', [columns, id]);
    res.json({ message: 'Preferred columns updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating columns' });
  }
};
