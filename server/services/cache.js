import NodeCache from 'node-cache';

// Default TTL = 5 minutes, check expired every 60 seconds
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL || '300'),
  checkperiod: 60,
});

export const CACHE_KEYS = {
  DASHBOARD_TODAY: 'dashboard_today',
  DASHBOARD_YESTERDAY: 'dashboard_kemarin',
  DASHBOARD_WEEK: 'dashboard_week',
  DASHBOARD_CUSTOM: 'dashboard_custom', // prefix, append date range
  LAST_UPDATED: 'last_updated',
};

export default cache;
