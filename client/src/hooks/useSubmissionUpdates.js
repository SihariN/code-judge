import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getToken } from "../lib/api";

// Connects while a user is logged in and reports live submission events.
// onConnect fires on the first connection AND every reconnection, so the
// page can re-fetch anything it missed while disconnected.
export function useSubmissionUpdates({ userId, onUpdate, onConnect }) {
  // Keep the latest callbacks in refs so the socket isn't recreated
  // every time the page re-renders
  const onUpdateRef = useRef(onUpdate);
  const onConnectRef = useRef(onConnect);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onConnectRef.current = onConnect;
  });

  useEffect(() => {
    if (!userId) return;

    const socket = io({ auth: { token: getToken() } });

    socket.on("connect", () => {
      if (onConnectRef.current) onConnectRef.current();
    });
    socket.on("submission:update", (data) => {
      if (onUpdateRef.current) onUpdateRef.current(data);
    });

    // Close the connection when the page closes or the user changes
    return () => {
      socket.close();
    };
  }, [userId]);
}