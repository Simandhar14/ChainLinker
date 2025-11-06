// hyperliquid wallet stuff comes through here
import { Router } from 'express';
import { getWalletPnl } from '../controllers/hyperliquidController.js';
const router = Router();

// GET /api/hyperliquid/:wallet/pnl
router.get('/:wallet/pnl', getWalletPnl);

export default router;
