import prisma from "../config/prisma";
import CreditScoreService from "../services/creditScoreService";

export async function creditScoreTrigger() {
  console.log("Initializing credit score update triggers...");

  prisma.$use(async (params, next) => {
    const result = await next(params);

    if (["create", "update"].includes(params.action) && ["Payment", "Reputation", "Loan"].includes(params.model!)) {
      const userId = params.args.data.userId;
      if (userId) {
        console.log(`Updating credit score for user: ${userId}`);
        await CreditScoreService.calculateCreditScore(userId);
      }
    }

    return result;
  });
}
