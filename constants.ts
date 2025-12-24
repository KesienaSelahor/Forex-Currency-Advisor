
export const MAJOR_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'XAUUSD'];

// Sessions defined in UTC hours
export const SESSIONS = [
  { name: 'Sydney', start: 22, end: 7, color: '#0ea5e9' }, // 10 PM - 7 AM UTC
  { name: 'Tokyo', start: 0, end: 9, color: '#facc15' },   // 12 AM - 9 AM UTC
  { name: 'London', start: 8, end: 17, color: '#22c55e' },  // 8 AM - 5 PM UTC
  { name: 'New York', start: 13, end: 22, color: '#ef4444' } // 1 PM - 10 PM UTC
];

export const KILL_ZONE = { start: 14, end: 17 }; // Lagos Time (UTC+1)

export const SESSION_PAIRS: Record<string, string[]> = {
  'Tokyo': ['USDJPY', 'AUDUSD', 'NZDUSD'],
  'London': ['EURUSD', 'GBPUSD', 'EURGBP', 'GER40'],
  'New York': ['EURUSD', 'XAUUSD', 'USDCAD', 'USDJPY'],
  'Overlap': ['XAUUSD', 'EURUSD', 'GBPUSD', 'GBPCHF']
};

export const TIMEZONES = [
  { label: "UTC (GMT)", value: "UTC" },
  { label: "Lagos (UTC+1)", value: "Africa/Lagos" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "New York (EST/EDT)", value: "America/New_York" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Sydney (AEST/AEDT)", value: "Australia/Sydney" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Los Angeles (PST/PDT)", value: "America/Los_Angeles" },
  { label: "Frankfurt (CET/CEST)", value: "Europe/Berlin" },
  { label: "Johannesburg (SAST)", value: "Africa/Johannesburg" }
];
