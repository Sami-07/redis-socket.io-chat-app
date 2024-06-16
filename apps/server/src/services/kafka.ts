import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import prisma from "./prisma";
dotenv.config();

const kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER!],
    ssl: {
        ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")]
    },
    sasl: {
        username: process.env.KAFKA_USERNAME!,
        password: process.env.KAFKA_PASSWORD!,
        mechanism: "plain"
    }
})

let producer: null | Producer = null;
// Here, It wont create a new producer if it already exists. We can re use the same producer instance.
export async function createProducer() {
    if (producer) return producer;

    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer;
    return producer;
}

export async function produceMessage(message: string) {
    const producer = await createProducer();
    await producer.send({
        messages: [{ key: `message=${Date.now()}`, value: message }],
        topic: "MESSAGES"
    })
    return true;
}

export async function startMessageConsumer() {
    console.log("Starting message consumer");
    const consumer = kafka.consumer({ groupId: "default" });
    await consumer.connect();
    await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });
    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ message, pause }) => {
            if (!message.value) return;
            console.log("Message Received", message.value?.toString());
            try {
                await prisma.message.create({
                    data: {
                        text: message.value?.toString()
                    }
                })
            } catch (error: any) {
                console.log("Error while saving message to database", error.message);
                // The error could be due to database going down or some other issue. We can pause the consumer for a 60 seconds and then resume it. But that doesn't mean the message is lost. All the messages are stored in Kafka and we can consume them later when the database is up and running.
                pause();
                setTimeout(() => {
                    consumer.resume([{ topic: "MESSAGES" }]);
                }, 60 * 1000);
            }
        }
    })
}

export default kafka;