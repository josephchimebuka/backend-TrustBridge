"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWalletAuth = void 0;
const blockchainService_1 = __importDefault(require("../services/blockchainService"));
// Middleware de autenticación sincrono que maneja la promesa internamente
const verifyWalletAuth = (req, res, next) => {
    const walletAddress = req.headers.walletaddress;
    const signature = req.headers.signature;
    if (!walletAddress || !signature) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    const message = 'authenticate_trustbridge';
    // Manejamos la promesa internamente
    blockchainService_1.default.verifyWalletSignature(walletAddress, signature, message)
        .then(isValid => {
        if (!isValid) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
        // Añadir usuario a la request y continuar
        req.user = { walletAddress };
        next();
    })
        .catch(error => {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    });
};
exports.verifyWalletAuth = verifyWalletAuth;
