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
const loanRoutes_1 = __importDefault(require("./routes/loanRoutes"));
const blockchainService_1 = __importDefault(require("./services/blockchainService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use(express_1.default.json());
// Verificar conexión a Stellar al iniciar
app.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const isConnected = yield blockchainService_1.default.testConnection();
    res.json({
        status: 'ok',
        blockchain: isConnected ? 'connected' : 'disconnected'
    });
}));
// Rutas
app.use('/api/loans', loanRoutes_1.default);
// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
exports.default = app;
