import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-state-dev-mock',
      configureServer(server) {
        let devMemoryState = {
          tournamentState: null,
          operatorPeerId: null,
          version: 0,
          lastUpdated: Date.now()
        };
        server.middlewares.use('/api/state', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
          res.setHeader('Access-Control-Allow-Headers', '*');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            res.statusCode = 200;
            res.end(JSON.stringify(devMemoryState));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);

                if (data.action === 'UPDATE_PHOTO' && data.participantId) {
                  const pId = String(data.participantId);
                  const newPhoto = data.photo || null;
                  const currentStoredState = devMemoryState.tournamentState || {};

                  const participants = Array.isArray(currentStoredState.participants) ? currentStoredState.participants : [];
                  const updatedParticipants = participants.map(p => {
                    if (String(p.participant_id) === pId || String(p.id) === pId) {
                      return { ...p, photo: newPhoto };
                    }
                    return p;
                  });

                  const fixtures = Array.isArray(currentStoredState.fixtures) ? currentStoredState.fixtures : [];
                  const updatedFixtures = fixtures.map(f => {
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

                  const newVersion = (devMemoryState.version || 0) + 1;
                  const newLastUpdated = Date.now();

                  devMemoryState = {
                    tournamentState: {
                      ...currentStoredState,
                      participants: updatedParticipants,
                      fixtures: updatedFixtures
                    },
                    operatorPeerId: devMemoryState.operatorPeerId,
                    version: newVersion,
                    lastUpdated: newLastUpdated
                  };

                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: true,
                    version: devMemoryState.version,
                    lastUpdated: devMemoryState.lastUpdated,
                    tournamentState: devMemoryState.tournamentState
                  }));
                  return;
                }

                const incomingVersion = Number(data.version) || 0;
                const newVersion = Math.max(devMemoryState.version || 0, incomingVersion) + 1;
                const newLastUpdated = Math.max(Date.now(), Number(data.lastUpdated) || 0);

                const mergedTournamentState = data.tournamentState !== undefined
                  ? (data.isFullState ? data.tournamentState : { ...(devMemoryState.tournamentState || {}), ...data.tournamentState })
                  : devMemoryState.tournamentState;

                devMemoryState = {
                  tournamentState: mergedTournamentState,
                  operatorPeerId: data.operatorPeerId !== undefined ? data.operatorPeerId : devMemoryState.operatorPeerId,
                  version: newVersion,
                  lastUpdated: newLastUpdated
                };
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, version: devMemoryState.version, lastUpdated: devMemoryState.lastUpdated }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
