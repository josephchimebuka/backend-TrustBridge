import AuditService from "../services/auditService";
import prisma from "../services/prismaClient";

export async function auditTrigger() {

  console.log("Initializing log triggers...");

  prisma.$use(async (params, next) => {
    const result = await next(params);
  
    if (["create", "update"].includes(params.action)) {
      let userId = null;
      if (params.model === "Payment" || params.model === "Loan") {
        userId = params.args.data.userId;
      }
      if (userId) {
        console.log("updating logger");
        await AuditService.logAction(userId, `${params.action} ${params.model}`, JSON.stringify(params.args.data));
      }
    }
  
    return result;
  });
  
}

