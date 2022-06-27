import chalk from 'chalk';
import express, { response } from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs"

dotenv.config();
const PORT = process.env.PORTA;

let time = dayjs().format("HH:mm:ss")

const app = express();
app.use(cors());
app.use(express.json());

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URL);
const promise = mongoClient.connect();
promise.then(() => db = mongoClient.db(process.env.BANCO));

app.post('/participants', async (req, res) => {

  const { name } = req.body;

  const validation = participantsSchema.validate(req.body)
  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  try {
    const collection = db.collection("participants");
    const alreadyExist = await collection.findOne({ name: name });
    if (alreadyExist) {
      res.status(409).send("Usuário já existente");
      return;
    }
    await collection.insertOne({ name: name, lastStatus: Date.now() })
    await db.collection('messages').insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: time })
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get('/participants', async (req, res) => {
  try {
    const participants = await db.collection('participants').find().toArray();
    res.send(participants);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get('/messages', async (req, res) => {
  const { user: name } = req.headers;
  let limit = req.query.limit;
  try {
    let collection = db.collection("messages");
    const messages = await collection.find().toArray();
    const userMessages = messages.filter(message => {
      const { type, to, from } = message;
      if (type === "message" || type === "status" || from === name || to === name || to === 'Todos') {
        return true;
      }
      return false;
    });
    if (limit === undefined) {
      res.status(200).send(userMessages);
      return;
    }
    const length = userMessages.length;
    res.status(200).send(userMessages.slice(length - limit, length));
  } catch (error) {
    res.status(500).send(error);
  }
})

app.post('/messages', async (req, res) => {

  const { user } = req.headers;
  const { to, text, type } = req.body;

  const validation = messagesSchema.validate(req.body)
  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  try {
    const collection = db.collection("messages");
    const message = { from: user, to, text, type, time: time }
    await collection.insertOne(message);
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }

});

setInterval(updateParticipants, 15000);

app.listen(PORT, () => {
  console.log(chalk.green.bold(`Servidor rodando na porta ${PORT}`));
});
