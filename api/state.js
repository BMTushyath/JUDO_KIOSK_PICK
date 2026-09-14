import { Redis } from '@upstash/redis';

// In-memory state cache for warm serverless instances
let memoryState = {
  tournamentState: null,
  operatorPeerId: null,
  version: 0,
  lastUpdated: Date.now()
};

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch (e) {
      console.error('Failed to initialize Redis:', e);
    }
  }
  return null;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const redis = getRedis();

  if (req.method === 'GET') {
    try {
      if (redis) {
        const stored = await redis.get('VTU_JUDO_TOURNAMENT_STATE');
        if (stored) {
          const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
          return res.status(200).json(parsed);
        }
      }
      return res.status(200).json(memoryState);
    } catch (err) {
      console.error('GET /api/state error:', err);
      return res.status(200).json(memoryState);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      let currentStoredState = memoryState.tournamentState || {};
      if (redis) {
        try {
          const stored = await redis.get('VTU_JUDO_TOURNAMENT_STATE');
          if (stored) {
            const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
            if (parsed?.tournamentState) {
              currentStoredState = parsed.tournamentState;
            }
          }
        } catch (e) {
          // ignore redis read error
        }
      }

      const mergedTournamentState = body.tournamentState !== undefined
        ? { ...currentStoredState, ...body.tournamentState }
        : currentStoredState;

      const newVersion = (memoryState.version || 0) + 1;
      const updated = {
        tournamentState: mergedTournamentState,
        operatorPeerId: body.operatorPeerId !== undefined ? body.operatorPeerId : memoryState.operatorPeerId,
        version: newVersion,
        lastUpdated: Date.now()
      };
      memoryState = updated;

      if (redis) {
        await redis.set('VTU_JUDO_TOURNAMENT_STATE', JSON.stringify(updated));
      }

      return res.status(200).json({ success: true, version: updated.version, lastUpdated: updated.lastUpdated });
    } catch (err) {
      console.error('POST /api/state error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
