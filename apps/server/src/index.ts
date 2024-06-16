import http from "http";
import SocketService from "./services/socket";

async function init() {
    
    const httpServer = http.createServer();
    const socketService = new SocketService(httpServer);
    const PORT = process.env.PORT || 8000;

    httpServer.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
    })
    socketService.initListeners();
}

init();