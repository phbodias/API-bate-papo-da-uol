import chalk from 'chalk';
import express, { json } from 'express'
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORTA;

app.listen(PORT, () => {
  console.log(chalk.green.bold(`Servidor rodando na porta ${PORT}`));
});
