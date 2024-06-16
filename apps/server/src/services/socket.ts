import { Server, Socket } from "socket.io";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import prisma from "./prisma";
import {createProducer, produceMessage} from "./kafka";
dotenv.config();

const pub = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD

});
const sub = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD
});

class SocketService {
    private _io: Server;

    constructor(httpServer: any) {
        console.log("Socket service initialized");
        this._io = new Server(httpServer, {
            cors: {
                allowedHeaders: ["*"],
                origin: "*"
            }
        });
        sub.subscribe("MESSAGES");
    }

    public initListeners() {
        console.log("Initializing socket listeners");
        const io = this._io;
        io.on("connect", (socket: Socket) => {
            console.log("New Socket Connected", socket.id);

            socket.on("event:message", async ({ message }: { message: string }) => {
                console.log("Message received", message); // publish the message to redis
                await pub.publish("MESSAGES", JSON.stringify({ message }));
            });
        });
        sub.on("message", async (channel, message) => {
            if (channel === "MESSAGES") {
                console.log("Message received from redis", message);
                io.emit("message", message);
                await produceMessage(message);
                console.log("Message sent/produced to Kafka Broker");
            //    await prisma.message.create({
            //         data: {
            //             text: message
            //         }
                
            //     })
            }
        })
    }
}

export default SocketService;
