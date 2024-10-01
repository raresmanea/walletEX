import express, { Request, Response } from "express";
import bodyParser from 'body-parser';
import { body, validationResult } from 'express-validator';
import { PostgresWalletRepository } from './repositories/postgres-wallet-repository';
import { WalletService } from './services/wallet-service';

const app = express();
const port = process.env.PORT || 8080;

// Initialize repository and service
const walletRepository = new PostgresWalletRepository();
const walletService = new WalletService(walletRepository);

app.use(bodyParser.json());

app.get('/wallets/:id', async (req: Request, res: Response) => {
    const walletId = req.params.id;

    try {
        const wallet = await walletService.getWallet(walletId);
        if (!wallet) {
            return res.status(404).send('Wallet not found');
        }

        res.status(200).json({
            transactionId: wallet.getLastTransactionId(),
            version: wallet.getVersion(),
            coins: wallet.getBalance(),
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message); // Handle specific error message
        } else {
            res.status(500).send('Internal server error'); // Fallback for unknown errors
        }
    }
});

app.post('/wallets/:id/credit', [
    body('transactionId').isString(),
    body('coins').isInt({ gt: 0 }),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const walletId = req.params.id;
    const { transactionId, coins } = req.body;

    try {
        const wallet = await walletService.creditWallet(walletId, transactionId, coins);
        res.status(201).json({
            transactionId: transactionId,
            version: wallet.getVersion(),
            coins: wallet.getBalance(),
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Transaction already processed') {
                return res.status(202).send(error.message);
            }
            res.status(500).send(error.message); // Send error message if available
        } else {
            res.status(500).send('Internal server error'); // Handle unknown errors
        }
    }
});

app.post('/wallets/:id/debit', [
    body('transactionId').isString(),
    body('coins').isInt({ gt: 0 }),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const walletId = req.params.id;
    const { transactionId, coins } = req.body;

    try {
        const wallet = await walletService.debitWallet(walletId, transactionId, coins);
        res.status(201).json({
            transactionId: transactionId,
            version: wallet.getVersion(),
            coins: wallet.getBalance(),
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Insufficient balance') {
                return res.status(400).send(error.message);
            }
            if (error.message === 'Transaction already processed') {
                return res.status(202).send(error.message);
            }
            if (error.message === 'Wallet not found') {
                return res.status(404).send(error.message);
            }
            res.status(500).send(error.message); // Handle known errors with messages
        } else {
            res.status(500).send('Internal server error'); // Handle unknown errors
        }
    }
});

const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
    await walletRepository.closeConnection();
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

export { app, server };
