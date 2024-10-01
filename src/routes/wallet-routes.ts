import { Router } from 'express';
import { WalletController } from '../controllers/wallet-controller';
import { PostgresWalletRepository } from '../repositories/postgres-wallet-repository';
import { WalletService } from '../services/wallet-service';

const router = Router();

const walletRepository = PostgresWalletRepository.getInstance();
const walletService = new WalletService(walletRepository);
const walletController = new WalletController(walletService);

router.get('/wallets/:id', (req, res) => walletController.getWalletById(req, res));
router.post('/wallets/:id/credit', (req, res) => walletController.credit(req, res));
router.post('/wallets/:id/debit', (req, res) => walletController.debit(req, res));

export { router as walletRoutes };
