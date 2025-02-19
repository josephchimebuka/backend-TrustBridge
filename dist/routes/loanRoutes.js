"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const blockchainService_1 = __importDefault(require("../services/blockchainService"));
const router = express_1.default.Router();
// Ruta pública - Obtener préstamos disponibles
router.get('/available', (req, res) => {
    blockchainService_1.default.getAvailableLoans()
        .then(loans => {
        res.json({ success: true, data: loans });
    })
        .catch(error => {
        console.error('Error fetching loans:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch loans' });
    });
});
// Ruta protegida - Detalles de préstamo específico
router.get('/:id', auth_1.verifyWalletAuth, (req, res) => {
    const loanId = req.params.id;
    // En una implementación real, buscarías este préstamo en la blockchain
    res.json({
        success: true,
        data: {
            id: loanId,
            amount: '500',
            interest: '4%',
            duration: '45 days',
            borrower: '0x1234...5678',
            status: 'active'
        }
    });
});
exports.default = router;
