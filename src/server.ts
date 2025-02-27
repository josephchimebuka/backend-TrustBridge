import app from './app';
import dotenv from 'dotenv';
import { initializeCreditScoreTriggers } from './hooks/creditScoreHooks';
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`TrustBridge API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  initializeCreditScoreTriggers();
});