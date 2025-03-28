export interface IRecommendation {
  id: string;
  userId: string;
  recommendedUserId: string;
  reason: string;
  createdAt: Date;
}


export interface IAuthInfo {
  message?: string;
  status?: number;
}

export interface IAuthUser {
  walletAddress: string;
}

export interface IDeviceInfo {
  device: string | null; // Device type (mobile, desktop, etc.)
  deviceId: string | null; // Unique identifier for the device
  userAgent: string | null; // Browser/app user agent
  ipAddress: string | null; // IP address of the request
}


export interface IEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    type: string;
    user: string;
    // OAuth2 properties
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    accessToken?: string;
    expires?: number;
    // Password fallback (only used if OAuth2 is not configured)
    pass?: string;
  };
}

export interface IEmailTemplate {
  subject: string;
  template: (userName: string, message: string) => string;
}


export interface IJWTPayload {
  walletAddress: string;
  type: "access" | "refresh";
  origin?: string; // Origin used when generating the token
}


export interface IRefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  family: string | null; // Token family identifier for tracking lineage
  replacedByToken: string | null; // The token that replaced this one
  device: string | null; // Device information
  deviceId: string | null; // Unique identifier for the device
  userAgent: string | null; // User agent string
  ipAddress: string | null; // IP address
}


export interface IUser {
  walletAddress: string;
  nonce: string; // Used for signature verification
  createdAt: Date;
  lastLogin?: Date;
}


export interface IUserSession {
  walletAddress: string;
}


export interface ILoan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface ICreditScore {
  id: string;
  userId: string;
  score: number;
  lastUpdated: Date;
}


export interface IPayment {
  id: string;
  userId: string;
  loanId: string;
  amount: number;
  paymentDate: Date;
  status: string;
}


export interface IReputation {
  id: string;
  userId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAudit {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
}
