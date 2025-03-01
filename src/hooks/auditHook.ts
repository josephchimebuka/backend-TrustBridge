import {logAction} from "../services/auditService";
import prisma from "../config/prisma";

export async function auditTrigger() {

  console.log("Initializing log triggers...");

  prisma.$use(async (params, next) => {
    const result = await next(params);
  
    if (["create", "update"].includes(params.action)) {
      let userId = null;
      if (params.model === "Payment" || params.model === "Loan") {
        userId = params.args.data?.userId || params.args.where?.userId;
      }
      if (userId) {
        console.log("updating logger");
        await logAction(userId, `${params.action} ${params.model}`, JSON.stringify(params.args.data));
      }
    }
  
    return result;
  });
  
}

