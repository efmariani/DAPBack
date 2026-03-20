const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken, isAdmin, isTecnico } = require('../middleware/auth.middleware');

router.post('/create', ticketController.createTicket);
router.get('/', verifyToken, ticketController.getTickets);
router.get('/search', verifyToken, ticketController.searchTickets);

// Admin / Tecnico status updates
router.patch('/:id/status', verifyToken, isTecnico, ticketController.updateTicketStatus);

// Admin only management
router.put('/:id', verifyToken, isAdmin, ticketController.updateTicket);
router.delete('/:id', verifyToken, isAdmin, ticketController.deleteTicket);

module.exports = router;
