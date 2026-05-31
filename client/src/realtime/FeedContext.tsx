import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import { API_BASE_URL, getToken } from '../config';

/** A live event received from the server over SignalR (the real-time push channel). */
export interface LiveEvent {
  id: string;
  type: string; // e.g. 'TournamentStatusChanged', 'AnnouncementPublished'
  occurredAtUtc: string;
  payload: unknown;
}

interface FeedContextValue {
  connected: boolean;
  events: LiveEvent[];
}

const FeedContext = createContext<FeedContextValue>({ connected: false, events: [] });

/**
 * Opens a SignalR connection to the API's NotificationsHub and accumulates the
 * "DomainEvent" messages it broadcasts (RF6.2 push / live schedule + result
 * updates). The connection authenticates with the stored JWT.
 */
export function FeedProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notifications`, { accessTokenFactory: () => getToken() ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('DomainEvent', (envelope: { type: string; occurredAtUtc: string; payload: unknown }) => {
      setEvents((prev) => [
        { id: crypto.randomUUID(), type: envelope.type, occurredAtUtc: envelope.occurredAtUtc, payload: envelope.payload },
        ...prev,
      ].slice(0, 50));
    });

    connection.onreconnected(() => setConnected(true));
    connection.onclose(() => setConnected(false));

    connection
      .start()
      .then(() => setConnected(connection.state === HubConnectionState.Connected))
      .catch(() => setConnected(false));

    connectionRef.current = connection;
    return () => {
      void connection.stop();
    };
  }, []);

  return <FeedContext.Provider value={{ connected, events }}>{children}</FeedContext.Provider>;
}

export const useFeed = (): FeedContextValue => useContext(FeedContext);
