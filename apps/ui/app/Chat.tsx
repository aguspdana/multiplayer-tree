"use client";

import { useState } from "react";
import { io } from "socket.io-client";

export function Chat() {
  const [value, setValue] = useState();

  const socket = io("ws://localhost:3001");
  //
  // client-side
  socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });

  socket.on("disconnect", () => {
    console.log(socket.id); // undefined
  });

  return (
    <input/>
  );
}
