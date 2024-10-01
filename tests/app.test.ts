import request from 'supertest';
import { app, server } from '../src/app'; // Ensure server is imported
import { PostgresWalletRepository } from '../src/repositories/postgres-wallet-repository';

jest.mock('../src/repositories/postgres-wallet-repository', () => {
    let balance = 1000;
    let version = 1;
    let lastTransactionId = 'tx001'; 

    return {
        PostgresWalletRepository: jest.fn().mockImplementation(() => ({
            getWalletById: jest.fn().mockImplementation((id) => {
                if (id === 'nonExistentWallet') return null; 
                return {
                    getLastTransactionId: () => lastTransactionId,
                    getVersion: () => version,
                    getBalance: () => balance,
                    credit: jest.fn(function (transactionId, coins) {
                        balance += coins; 
                        lastTransactionId = transactionId; 
                        version += 1; 
                    }),
                    debit: jest.fn(function (transactionId, coins) {
                        if (balance < coins) return false; 
                        balance -= coins; 
                        lastTransactionId = transactionId; 
                        version += 1; 
                        return true;
                    }),
                };
            }),
            saveWallet: jest.fn(), 
            closeConnection: jest.fn(),
        })),
    };
});


describe('Wallet API', () => {
    afterAll(async () => {
        const repository  = PostgresWalletRepository.getInstance();
        await repository.closeConnection();
        server.close(); 
    });

    test('GET /wallets/:id - should return wallet balance', async () => {
        const walletId = 'wallet123';
        const response = await request(app).get(`/wallets/${walletId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('transactionId', 'tx001');
        expect(response.body).toHaveProperty('version', 1);
        expect(response.body).toHaveProperty('coins', 1000);
    });

    test('POST /wallets/:id/credit - should credit the wallet', async () => {
        const walletId = 'wallet123';
        const response = await request(app)
            .post(`/wallets/${walletId}/credit`)
            .send({ transactionId: 'tx002', coins: 500 });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('transactionId', 'tx002');
        expect(response.body).toHaveProperty('version', 2); 
        expect(response.body).toHaveProperty('coins', 1500); 
    });

    test('POST /wallets/:id/debit - should debit the wallet', async () => {
        const walletId = 'wallet123';
        const response = await request(app)
            .post(`/wallets/${walletId}/debit`)
            .send({ transactionId: 'tx003', coins: 200 });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('transactionId', 'tx003');
        expect(response.body).toHaveProperty('version', 3); 
        expect(response.body).toHaveProperty('coins', 1300);
    });

    test('POST /wallets/:id/debit - should not debit more than balance', async () => {
        const walletId = 'wallet123';
        const response = await request(app)
            .post(`/wallets/${walletId}/debit`)
            .send({ transactionId: 'tx004', coins: 2000 }); 

        expect(response.status).toBe(400);
        expect(response.text).toBe('Insufficient balance');
    });

    test('POST /wallets/:id/credit - should return 202 for duplicate transaction', async () => {
        const walletId = 'wallet123';
        await request(app)
            .post(`/wallets/${walletId}/credit`)
            .send({ transactionId: 'tx002', coins: 500 });

        const response = await request(app)
            .post(`/wallets/${walletId}/credit`)
            .send({ transactionId: 'tx002', coins: 300 });

        expect(response.status).toBe(202);
        expect(response.text).toBe('Transaction already processed');
    });

    test('POST /wallets/:id/debit - should return 202 for duplicate transaction', async () => {
        const walletId = 'wallet123';
        await request(app)
            .post(`/wallets/${walletId}/debit`)
            .send({ transactionId: 'tx003', coins: 200 });

        const response = await request(app)
            .post(`/wallets/${walletId}/debit`)
            .send({ transactionId: 'tx003', coins: 100 });

        expect(response.status).toBe(202);
        expect(response.text).toBe('Transaction already processed');
    });

    test('POST /wallets/:id/debit - should return 400 for insufficient balance', async () => {
        const walletId = 'wallet123';
        const response = await request(app)
            .post(`/wallets/${walletId}/debit`)
            .send({ transactionId: 'tx007', coins: 2000 });

        expect(response.status).toBe(400);
        expect(response.text).toBe('Insufficient balance');
    });

});
