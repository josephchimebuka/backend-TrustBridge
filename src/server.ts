import app from './app';
import dotenv from 'dotenv';
import { auditTrigger } from './hooks/auditHook';
import { creditScoreTrigger } from './hooks/creditScoreHooks';
import { createGraphQLServer } from './graphql-server';

dotenv.config();

const PORT = process.env.PORT ?? 3000;

async function startServer() {
  // Integrate GraphQL with existing app
  await createGraphQLServer(app);

  // Start the server
  app.listen(PORT, () => {
    console.log(`TrustBridge API running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`Health check: http://localhost:${PORT}/health`);

    auditTrigger();
    creditScoreTrigger();
  });
}

startServer().catch(console.error);