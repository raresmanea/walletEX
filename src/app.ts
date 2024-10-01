import express from "express";
import bodyParser from 'body-parser';
import { walletRoutes } from './routes/wallet-routes';
import { PostgresWalletRepository } from './repositories/postgres-wallet-repository';

const app = express();
const port = process.env.PORT || 8080;

const walletRepository = PostgresWalletRepository.getInstance();

app.use(bodyParser.json());
app.use(walletRoutes);

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
