const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.use(isAdmin);

router.get('/', userController.getUsers);
router.patch('/:id/role', userController.updateRole);
router.patch('/:id/reset-password', userController.resetPassword);
router.delete('/:id', userController.deleteUser);

module.exports = router;
