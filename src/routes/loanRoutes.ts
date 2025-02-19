import express from 'express';
import { verifyWalletAuth } from '../middleware/auth';
import blockchainService from '../services/blockchainService';

const router = express.Router();

// Ruta pública - Obtener préstamos disponibles
router.get('/available', (req, res) => {
  blockchainService.getAvailableLoans()
    .then(loans => {
      res.json({ success: true, data: loans });
    })
    .catch(error => {
      console.error('Error fetching loans:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch loans' });
    });
});

// Ruta protegida - Detalles de préstamo específico
router.get('/:id', verifyWalletAuth, (req, res) => {
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

export default router;