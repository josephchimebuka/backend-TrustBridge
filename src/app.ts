import express from 'express';
import dotenv from 'dotenv';
import loanRoutes from './routes/loanRoutes';
import blockchainService from './services/blockchainService';

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());

// Verificar conexión a Stellar al iniciar
app.get('/health', async (req, res) => {
  const isConnected = await blockchainService.testConnection();
  res.json({ 
    status: 'ok', 
    blockchain: isConnected ? 'connected' : 'disconnected' 
  });
});

// Rutas
app.use('/api/loans', loanRoutes);

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;