import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { WalletService } from "../services/wallet-service";

export class WalletController {
    private walletService: WalletService;

    constructor(walletService: WalletService) {
        this.walletService = walletService;
    }

    public async getWalletById(req: Request, res: Response): Promise<Response> {
        const walletId = req.params.id;

        try {
            const wallet = await this.walletService.getWallet(walletId);
            if (!wallet) {
                return res.status(404).send('Wallet not found');
            }

            return res.status(200).json(this.formatWalletResponse(wallet));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    public async credit(req: Request, res: Response): Promise<Response> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id: walletId } = req.params;
        const { transactionId, coins } = req.body;

        try {
            const wallet = await this.walletService.creditWallet(walletId, transactionId, coins);
            return res.status(201).json(this.formatWalletResponse(wallet));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    public async debit(req: Request, res: Response): Promise<Response> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id: walletId } = req.params;
        const { transactionId, coins } = req.body;

        try {
            const wallet = await this.walletService.debitWallet(walletId, transactionId, coins);
            return res.status(201).json(this.formatWalletResponse(wallet));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    private formatWalletResponse(wallet: any): object {
        return {
            transactionId: wallet.getLastTransactionId(),
            version: wallet.getVersion(),
            coins: wallet.getBalance(),
        };
    }

    private handleError(res: Response, error: unknown): Response {
        if (error instanceof Error) {
            if (error.message === 'Transaction already processed') {
                return res.status(202).send(error.message);
            }
            if (error.message === 'Insufficient balance') {
                return res.status(400).send(error.message);
            }
            if (error.message === 'Wallet not found') {
                return res.status(404).send(error.message);
            }
            return res.status(500).send(error.message);
        }
        return res.status(500).send('Internal server error');
    }
}
