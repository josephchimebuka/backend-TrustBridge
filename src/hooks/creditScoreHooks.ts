import prisma from "../services/prismaClient";
import CreditScoreService from "../services/creditScoreService";

export async function initializeCreditScoreTriggers() {
  console.log("Initializing credit score update triggers...");

  prisma.$use(async (params, next) => {
    const result = await next(params);

    if (["create", "update"].includes(params.action) && ["Payment", "Reputation"].includes(params.model!)) {
      const userId = params.args.data?.userId || params.args.where?.userId;
      if (userId) {
        console.log(`Updating credit score for user: ${userId}...`);
        await CreditScoreService.calculateCreditScore(userId);
      }
    }

    return result;
  });
}
