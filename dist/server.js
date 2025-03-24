"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const auditHook_1 = require("./hooks/auditHook");
const creditScoreHooks_1 = require("./hooks/creditScoreHooks");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`TrustBridge API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    (0, auditHook_1.auditTrigger)();
    (0, creditScoreHooks_1.creditScoreTrigger)();
});
