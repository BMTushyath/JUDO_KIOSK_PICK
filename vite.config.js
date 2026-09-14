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
                const mergedTournamentState = data.tournamentState !== undefined
                  ? { ...(devMemoryState.tournamentState || {}), ...data.tournamentState }
                  : devMemoryState.tournamentState;
                devMemoryState = {
                  tournamentState: mergedTournamentState,
                  operatorPeerId: data.operatorPeerId !== undefined ? data.operatorPeerId : devMemoryState.operatorPeerId,
                  version: (devMemoryState.version || 0) + 1,
                  lastUpdated: Date.now()
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
