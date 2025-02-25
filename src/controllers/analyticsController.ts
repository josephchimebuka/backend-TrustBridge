import { Request, Response } from "express";
import LoanService from "../services/loanService";

class AnalyticsController {
  async getUserLoans(req: Request, res: Response) {
    const { userId } = req.params;
    const data = await LoanService.getUserLoans(userId);
    res.json(data);
  }

}

export default new AnalyticsController();
