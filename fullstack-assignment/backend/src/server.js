// okay, booting express here
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// basic middleware for json body (might switch to zod/joi later)
app.use(express.json());

// wire up our routes so stuff actually responds
import tokenRoutes from './routes/token.js';
import hyperliquidRoutes from './routes/hyperliquid.js';
import healthRoutes from './routes/health.js';

app.use('/api/token', tokenRoutes);
app.use('/api/hyperliquid', hyperliquidRoutes);
app.use('/api/health', healthRoutes);

app.listen(PORT, () => {
  console.log(`server going on port ${PORT}`);
});
