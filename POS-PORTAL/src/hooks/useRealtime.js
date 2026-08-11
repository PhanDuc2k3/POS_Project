/**
 * useRealtime hook
 * 
 * Subscribe to realtime socket events and auto-cleanup on unmount.
 * 
 * Usage:
 *   useRealtime('transaction:created', (data) => {
 *     // Update state when new order arrives
 *     setOrders(prev => [data, ...prev]);
 *   });
 */

import { useEffect } from 'react';
import { onSocketEvent } from '../services/socket';

export function useRealtime(event, handler) {
  useEffect(() => {
    const unsubscribe = onSocketEvent(event, handler);
    return unsubscribe;
  }, [event, handler]);
}

/**
 * useRealtimeMulti - Subscribe to multiple events
 * 
 * Usage:
 *   useRealtimeMulti({
 *     'transaction:created': handleNew,
 *     'transaction:cancelled': handleCancel,
 *   });
 */
export function useRealtimeMulti(eventsMap) {
  useEffect(() => {
    const unsubscribes = Object.entries(eventsMap).map(
      ([event, handler]) => onSocketEvent(event, handler)
    );
    return () => unsubscribes.forEach(fn => fn());
  }, []);
}
