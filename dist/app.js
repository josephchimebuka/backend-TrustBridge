"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("./config/passport"));
const loanRoutes_1 = __importDefault(require("./routes/loanRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const creditScoreRoutes_1 = __importDefault(require("./routes/creditScoreRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const blockchainService_1 = __importDefault(require("./services/blockchainService"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const auth_1 = require("./middleware/auth");
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use(express_1.default.json());
// Session configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Initialize Passport and restore authentication state from session
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Database Connection Check
db_1.default.connect()
    .then(() => console.log('✅ Connected to PostgreSQL'))
    .catch((err) => console.error('❌ Database connection error:', err));
// Health check route
app.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const isConnected = yield blockchainService_1.default.testConnection();
    res.json({
        status: 'ok',
        blockchain: isConnected ? 'connected' : 'disconnected'
    });
}));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/loans', auth_1.isAuthenticated, loanRoutes_1.default); // Protect loan routes
app.use("/api", auditRoutes_1.default, creditScoreRoutes_1.default);
app.use('/api/audit', auth_1.isAuthenticated, auth_1.isLender, auditRoutes_1.default); // Protect audit routes
app.use('/api/analytics', auth_1.isAuthenticated, analyticsRoutes_1.default); // Protect analytics routes
app.use('/api/notifications', auth_1.isAuthenticated, notificationRoutes_1.default); // Notification Routes
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
exports.default = app;
