const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken, isTecnico } = require('../middleware/auth.middleware');

router.post('/create', ticketController.createTicket);
router.get('/', verifyToken, ticketController.getTickets);
router.patch('/:id/status', verifyToken, isTecnico, ticketController.updateTicketStatus);

module.exports = router;
