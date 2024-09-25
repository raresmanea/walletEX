import express, { Request, Response } from "express";
import bodyParser from 'body-parser';
import { Wallet } from './models/wallet'; 
import { PostgresWalletRepository } from './repositories/postgres-wallet-repository';


const app = express();
const port = 8080;
const walletRepository = new PostgresWalletRepository();

app.use(bodyParser.json());

app.get('/wallets/:id', async (req: Request, res: Response) => {
    const walletId = req.params.id;
    
    const wallet = await walletRepository.getWalletById(walletId); 

    if (!wallet) {
        return res.status(404).send('Wallet not found');
    }

    res.status(200).json({
        transactionId: wallet.getLastTransactionId(),
        version: wallet.getVersion(),
        coins: wallet.getBalance(),
    });
});

app.post('/wallets/:id/credit', async (req: Request, res: Response) => {
    const walletId = req.params.id;
    const { transactionId, coins } = req.body;

    let wallet = await walletRepository.getWalletById(walletId); 

    if (!wallet) {
        wallet = new Wallet(0); 
        walletRepository.saveWallet(walletId, wallet);
    }

    if (wallet.getLastTransactionId() === transactionId) {
        return res.status(202).send('Transaction already processed'); 
    }

    wallet.credit(transactionId, coins);
    await walletRepository.saveWallet(walletId, wallet); 

    res.status(201).json({
        transactionId: transactionId,
        version: wallet.getVersion(),
        coins: wallet.getBalance(),
    });
});

app.post('/wallets/:id/debit', async (req: Request, res: Response) => {
    const walletId = req.params.id;
    const { transactionId, coins } = req.body;

    let wallet = await walletRepository.getWalletById(walletId); 

    if (!wallet) {
        return res.status(404).send('Wallet not found');
    }

    if (wallet.getLastTransactionId() === transactionId) {
        return res.status(202).send('Transaction already processed'); 
    }

    const success = wallet.debit(transactionId, coins);

    if (!success) {
        return res.status(400).send('Insufficient balance');
    }

    await walletRepository.saveWallet(walletId, wallet);

    res.status(201).json({
        transactionId: transactionId,
        version: wallet.getVersion(),
        coins: wallet.getBalance(),
    });
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

export { app, server  };