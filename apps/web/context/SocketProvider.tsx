"use client";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

interface ISocketContext {
    sendMessage: (message: string) => any;
    messages: string[];
}

const SocketContext = createContext<ISocketContext | null>(null);

export const useSocket = () => {
    const state = React.useContext(SocketContext);
    if (!state) {
        throw new Error("State is undefined. Make sure you use useSocket inside SocketProvider");
    }
    return state;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | undefined>();
    const [messages, setMessages] = useState<string[]>([]);

    const sendMessage: ISocketContext['sendMessage'] = useCallback((message) => {
        console.log("Sending message", message);
        if (socket) {
            console.log("Emitting message");
            socket.emit("event:message", { message });
        }
    }, [socket]);

    const onMessageReceived = useCallback((msg: string) => {
        const { message } = JSON.parse(msg);
        console.log("Message received xxx", message);
        setMessages((prev) => [...prev, message]);
    }, []);


    useEffect(() => {
        const _socket = io("http://localhost:8000");
        _socket.on("message", onMessageReceived);
        _socket.on("connect", () => {
            console.log("Socket connected", _socket.id);
            setSocket(_socket);
        });

        _socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setSocket(undefined);
        });

        // Cleanup on component unmount
        return () => {
            if (_socket) {
                _socket.disconnect();
                console.log("Socket disconnected on unmount");
                _socket.off("message", onMessageReceived);
                setSocket(undefined);
            }
        };
    }, []);

    console.log("SocketProvider rendered");

    return (
        <SocketContext.Provider value={{ sendMessage, messages }}>
            {children}
        </SocketContext.Provider>
    );
};
