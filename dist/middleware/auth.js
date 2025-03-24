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
exports.handleAuthError = exports.authenticateUser = exports.isLender = exports.isAuthenticated = void 0;
const passport_1 = __importDefault(require("passport"));
const prisma_1 = __importDefault(require("../config/prisma"));
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized - Please login first' });
};
exports.isAuthenticated = isAuthenticated;
const isLender = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const userId = req.user?.id; // Assuming user ID is attached to req.user after authentication. 
        const userId = 'user-id';
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized - User not authenticated properly' });
            return;
        }
        const userRole = yield prisma_1.default.role.findMany({
            where: {
                users: {
                    some: {
                        userId: userId,
                    },
                },
                name: 'lender',
            },
        });
        if (userRole.length === 0) {
            res.status(403).json({ error: 'Forbidden - You do not have access to the audit logs' });
            return;
        }
        return next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.isLender = isLender;
const authenticateUser = (req, res, next) => {
    passport_1.default.authenticate('wallet', (err, user, info) => {
        var _a;
        if (err) {
            return next(err);
        }
        if (!user) {
            const status = (info === null || info === void 0 ? void 0 : info.status) || (((_a = info === null || info === void 0 ? void 0 : info.message) === null || _a === void 0 ? void 0 : _a.includes('not found')) ? 400 : 401);
            return res.status(status).json({ error: (info === null || info === void 0 ? void 0 : info.message) || 'Authentication failed' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            next();
        });
    })(req, res, next);
};
exports.authenticateUser = authenticateUser;
// Custom error handler for authentication
const handleAuthError = (err, req, res, next) => {
    if (err.name === 'AuthenticationError') {
        return res.status(401).json({ error: err.message });
    }
    next(err);
};
exports.handleAuthError = handleAuthError;
