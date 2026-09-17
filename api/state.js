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

const REDIS_KEY = 'VTU_JUDO_TOURNAMENT_STATE';

/**
 * Read the current authoritative state from Redis (falling back to memoryState).
 * Returns { tournamentState, operatorPeerId, version, lastUpdated }.
 */
async function readAuthoritative(redis) {
  if (redis) {
    try {
      const stored = await redis.get(REDIS_KEY);
      if (stored) {
        const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
        if (parsed && (Number(parsed.version) || 0) >= (memoryState.version || 0)) {
          memoryState = parsed;
          return parsed;
        } else if (memoryState && (memoryState.version || 0) > 0) {
          return memoryState;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Redis read error:', e);
    }
  }
  return memoryState;
}

/**
 * Write state to Redis and update memoryState.
 * Returns the persisted state object.
 */
async function writeAuthoritative(redis, state) {
  memoryState = state;
  if (redis) {
    await redis.set(REDIS_KEY, JSON.stringify(state));
  }
  return state;
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
      const current = await readAuthoritative(redis);
      return res.status(200).json(current);
    } catch (err) {
      console.error('GET /api/state error:', err);
      return res.status(200).json(memoryState);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Always read the latest authoritative state first (read-your-writes consistency)
      const current = await readAuthoritative(redis);
      const currentStoredState = current.tournamentState || {};
      const storedVersion = Number(current.version) || 0;
      const currentOperatorPeerId = current.operatorPeerId;

      // ── Atomic photo update action (used by PIC PICKER and Operator) ──
      if (body.action === 'UPDATE_PHOTO' && body.participantId) {
        const pId = String(body.participantId);
        const newPhoto = body.photo || null;

        const storedParticipants = Array.isArray(currentStoredState.participants) ? currentStoredState.participants : [];
        const fallbackParticipants = Array.isArray(body.participants) ? body.participants : [];
        const baseParticipants = storedParticipants.length >= fallbackParticipants.length ? storedParticipants : fallbackParticipants;

        const updatedParticipants = baseParticipants.map(p => {
          if (String(p.participant_id) === pId || String(p.id) === pId) {
            return { ...p, photo: newPhoto };
          }
          return p;
        });

        const storedFixtures = Array.isArray(currentStoredState.fixtures) ? currentStoredState.fixtures : [];
        const fallbackFixtures = Array.isArray(body.fixtures) ? body.fixtures : [];
        // Preserve fixtures: if server has empty fixtures but client sent fixtures, NEVER drop fixtures!
        const baseFixtures = storedFixtures.length >= fallbackFixtures.length ? storedFixtures : fallbackFixtures;

        const updatedFixtures = baseFixtures.map(f => {
          let updatedF = { ...f };
          let changed = false;
          if (f.participant1 && (String(f.participant1.id) === pId || String(f.participant1.participant_id) === pId)) {
            updatedF.participant1 = { ...f.participant1, photo: newPhoto };
            changed = true;
          }
          if (f.participant2 && (String(f.participant2.id) === pId || String(f.participant2.participant_id) === pId)) {
            updatedF.participant2 = { ...f.participant2, photo: newPhoto };
            changed = true;
          }
          return changed ? updatedF : f;
        });

        const newVersion = storedVersion + 1;
        const newLastUpdated = Date.now();

        const mergedTournamentState = {
          ...currentStoredState,
          participants: updatedParticipants,
          fixtures: updatedFixtures
        };

        const updated = {
          tournamentState: mergedTournamentState,
          operatorPeerId: currentOperatorPeerId,
          version: newVersion,
          lastUpdated: newLastUpdated
        };

        await writeAuthoritative(redis, updated);

        return res.status(200).json({
          success: true,
          version: updated.version,
          lastUpdated: updated.lastUpdated,
          tournamentState: updated.tournamentState
        });
      }

      // ── General state update (operator full-state push) ──
      const incomingVersion = Number(body.version) || 0;

      // Guard against stale full-state overwrites: if an incoming full state is based on an older version
      // than what Redis already stores, reject the overwrite and return current authoritative state.
      if (body.isFullState && storedVersion > 0 && incomingVersion < storedVersion) {
        return res.status(200).json({
          success: false,
          stale: true,
          version: storedVersion,
          lastUpdated: Number(current.lastUpdated) || Date.now(),
          tournamentState: currentStoredState
        });
      }

      const newVersion = Math.max(storedVersion, incomingVersion) + 1;
      const newLastUpdated = Date.now();

      const mergedTournamentState = body.tournamentState !== undefined
        ? (body.isFullState ? body.tournamentState : { ...currentStoredState, ...body.tournamentState })
        : currentStoredState;

      const updated = {
        tournamentState: mergedTournamentState,
        operatorPeerId: body.operatorPeerId !== undefined ? body.operatorPeerId : currentOperatorPeerId,
        version: newVersion,
        lastUpdated: newLastUpdated
      };

      await writeAuthoritative(redis, updated);

      // Return the full authoritative state so the caller can reconcile immediately
      return res.status(200).json({
        success: true,
        version: updated.version,
        lastUpdated: updated.lastUpdated,
        tournamentState: updated.tournamentState
      });
    } catch (err) {
      console.error('POST /api/state error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
