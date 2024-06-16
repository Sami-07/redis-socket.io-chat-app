"use client";

import { useSocket } from "../context/SocketProvider";
import { useState } from "react";
export default function HomePage() {
  const { sendMessage, messages } = useSocket();
  const [message, setMessage] = useState("");
  return (
    <div>
      <input onChange={(e) => setMessage(e.target.value)} className="text-black px-4 py-2 w-40 rounded-xl" type="text" placeholder="Enter message" />
      <button onClick={() => sendMessage(message)} className="bg-green-500 px-4 py-2 rounded-xl">Send</button>
      <p className="font-semibold">All Messages will appear here</p>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </div>
  )
}