import { Request, Response } from "express";
import LoanService from "../services/loanService";
import paymentService from "../services/paymentService";

class AnalyticsController {
  async getUserLoans(req: Request, res: Response) {
    const { userId } = req.params;
    const data = await LoanService.getUserLoans(userId);
    res.json(data);
  }

  async getUserPayments(req: Request, res: Response) {
    const { user_id } = req.params;
    const data = await paymentService.getUserPayments(user_id);
    res.json(data);
  }

}

export default new AnalyticsController();
