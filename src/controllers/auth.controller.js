const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { nombre, email, password } = req.body;

  // Honeypot check
  if (req.body.signup_phone) {
    return res.status(400).json({ message: 'Bot detected.' });
  }

  try {
    const userExist = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) return res.status(409).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First user as Admin, otherwise Cliente
    const roleResult = await db.query('SELECT id FROM roles WHERE nombre = $1', ['Cliente']);
    const roleId = roleResult.rows[0].id;

    const newUser = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email',
      [nombre, email, hashedPassword, roleId]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      'SELECT u.*, r.nombre as role FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role, must_change_password: user.must_change_password }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
