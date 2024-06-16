import http from "http";
import SocketService from "./services/socket";
import dotenv from "dotenv";
dotenv.config();
import { startMessageConsumer } from "./services/kafka";
async function init() {
    startMessageConsumer();
    const httpServer = http.createServer();
    const socketService = new SocketService(httpServer);
    const PORT = process.env.PORT || 8000;

    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
    socketService.initListeners();
}

init();