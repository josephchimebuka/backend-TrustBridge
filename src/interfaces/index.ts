export interface IRecommendation {
  id: string;
  userId: string;
  recommendedUserId: string;
  reason: string;
  createdAt: Date;
}


