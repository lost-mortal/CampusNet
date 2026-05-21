import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getToken } from './session';
import { SOCKET_URL } from './config';

// Keeps a lightweight socket connection alive for the duration of a layout mount.
// This is the only thing needed for presence — no event handlers, just connect/disconnect.
// Chat functionality (join_room, send_message) lives in ChatTab and uses its own socket instance.
// Both sockets authenticate with the same JWT; the server's onlineMap handles multiple sockets
// per user correctly (socketId → userId, user is online if any of their sockets are connected).
export function usePresenceSocket() {
  const ref = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    ref.current = socket;
    socket.on('connect_error', () => {}); // silent — presence failure is non-critical

    return () => {
      socket.disconnect();
      ref.current = null;
    };
  }, []);
}
