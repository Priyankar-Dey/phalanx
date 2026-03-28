import { useState, useEffect, useCallback } from 'react';

export type ThreatSeverity = 'CRITICAL' | 'WARNING' | 'ANOMALY' | 'SECURE';
export type ActionTaken = 'BLOCKED' | 'DIVERTED' | 'LOGGED' | 'ANALYZING';

export interface ThreatEvent {
  id: string;
  timestamp: number;
  ip: string;
  country: string;
  type: string;
  severity: ThreatSeverity;
  action: ActionTaken;
  lat: number;
  lng: number;
}

const THREAT_TYPES = [
  'DDoS Vector Attack',
  'SQL Injection Attempt',
  'XSS Payload Detected',
  'Brute Force Login',
  'Unauthorized API Access',
  'Malware Signature',
  'Zero-Day Anomaly',
  'Rate Limit Exceeded',
];

const COUNTRIES = [
  { c: 'RU', lat: 61, lng: 105 },
  { c: 'CN', lat: 35, lng: 104 },
  { c: 'US', lat: 37, lng: -95 },
  { c: 'BR', lat: 35, lng: 104 },
  { c: 'IR', lat: 32, lng: 53 },
  { c: 'KP', lat: 32, lng: 53 },
  { c: 'DE', lat: 51, lng: 9 },
  { c: 'KR', lat: 40, lng: 127 },
];

const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

const generateIp = () => 
  `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

export function useThreatSimulation() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState({
    neutralized: 2438921,
    activeSessions: 14092,
    systemLoad: 42,
    firewallActions: 894,
    health: 98.4
  });

  const generateEvent = useCallback((): ThreatEvent => {
    const rand = Math.random();
    let severity: ThreatSeverity = 'ANOMALY';
    let action: ActionTaken = 'ANALYZING';

    if (rand > 0.9) {
      severity = 'CRITICAL';
      action = 'BLOCKED';
    } else if (rand > 0.6) {
      severity = 'WARNING';
      action = 'DIVERTED';
    } else {
      severity = 'ANOMALY';
      action = 'LOGGED';
    }

    const loc = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

    return {
      id: `EVT-${generateId()}`,
      timestamp: Date.now(),
      ip: generateIp(),
      country: loc.c,
      type: THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)],
      severity,
      action,
      lat: loc.lat + (Math.random() * 10 - 5),
      lng: loc.lng + (Math.random() * 10 - 5),
    };
  }, []);

  // Initial population
  useEffect(() => {
    const initial = Array.from({ length: 15 }, () => {
      const evt = generateEvent();
      evt.timestamp = Date.now() - Math.floor(Math.random() * 60000);
      return evt;
    }).sort((a, b) => b.timestamp - a.timestamp);
    setEvents(initial);
  }, [generateEvent]);

  // Live feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateEvent();
      
      setEvents(prev => {
        const updated = [newEvent, ...prev].slice(0, 50); // keep last 50
        return updated;
      });

      // Update stats slightly
      setStats(prev => ({
        neutralized: prev.neutralized + (newEvent.severity === 'CRITICAL' ? 1 : 0),
        activeSessions: prev.activeSessions + Math.floor(Math.random() * 10) - 5,
        systemLoad: Math.min(100, Math.max(10, prev.systemLoad + Math.floor(Math.random() * 5) - 2)),
        firewallActions: prev.firewallActions + (newEvent.action === 'BLOCKED' ? 1 : 0),
        health: Math.min(100, Math.max(85, prev.health + (Math.random() * 0.4 - 0.2)))
      }));

    }, 2500);

    return () => clearInterval(interval);
  }, [generateEvent]);

  return { events, stats };
}
