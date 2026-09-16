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
