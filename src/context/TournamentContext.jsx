import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PeerPkg from 'peerjs';

const TournamentContext = createContext(null);

const STORAGE_KEY = "VTU_JUDO_TOURNAMENT_STATE_V2";
const CHANNEL_NAME = "VTU_JUDO_CHANNEL_V2";

const DEFAULT_CATEGORY = {
  gender: "MEN",
  weightCategory: "-73 KG"
};

const readLS = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key, val) => {
  try {
    if (val === undefined || val === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch {}
};

export function TournamentProvider({ children }) {
  const isDisplay = typeof window !== 'undefined' && window.location.pathname.startsWith('/display');

  // State definitions initialized from localStorage cache for instant UI rendering
  const [datasetMeta, setDatasetMeta] = useState(() => readLS(`${STORAGE_KEY}_DATASET_META`, null));
  const [participants, setParticipants] = useState(() => readLS(`${STORAGE_KEY}_PARTICIPANTS`, []));
  const [operatorCategory, setOperatorCategoryState] = useState(() => readLS(`${STORAGE_KEY}_OPERATOR_CATEGORY`, DEFAULT_CATEGORY));
  const [fixtures, setFixtures] = useState(() => readLS(`${STORAGE_KEY}_FIXTURES`, []));
  const [currentFixtureId, setCurrentFixtureId] = useState(() => readLS(`${STORAGE_KEY}_CURRENT_ID`, null));
  const [auditLogs, setAuditLogs] = useState(() => readLS(`${STORAGE_KEY}_LOGS`, []));

  const [lastSync, setLastSync] = useState(() => new Date().toLocaleTimeString());
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTED");
  const [dbStatus, setDbStatus] = useState("ONLINE");
  const [displayConnected, setDisplayConnected] = useState(true);

  // References for WebRTC and synchronization to prevent re-renders & connection churn
  const localVersionRef = useRef(0);
  const operatorPeerIdRef = useRef(null);
  const connectedPeerIdRef = useRef(null);
  const activeConnectionsRef = useRef([]);
  const peerRef = useRef(null);

  // Always-fresh snapshot of state for asynchronous handlers without effect re-triggering
  const stateRef = useRef({
    datasetMeta,
    participants,
    operatorCategory,
    fixtures,
    currentFixtureId,
    auditLogs
  });

  useEffect(() => {
    stateRef.current = {
      datasetMeta,
      participants,
      operatorCategory,
      fixtures,
      currentFixtureId,
      auditLogs
    };
  });

  // Apply state updates from remote source (API or WebRTC or BroadcastChannel)
  const applyRemoteState = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') return;
    try {
      if (payload.datasetMeta !== undefined) {
        setDatasetMeta(payload.datasetMeta);
        writeLS(`${STORAGE_KEY}_DATASET_META`, payload.datasetMeta);
      }
      if (payload.participants !== undefined) {
        setParticipants(payload.participants);
        writeLS(`${STORAGE_KEY}_PARTICIPANTS`, payload.participants);
      }
      if (payload.operatorCategory !== undefined) {
        setOperatorCategoryState(payload.operatorCategory);
        writeLS(`${STORAGE_KEY}_OPERATOR_CATEGORY`, payload.operatorCategory);
      }
      if (payload.fixtures !== undefined) {
        setFixtures(payload.fixtures);
        writeLS(`${STORAGE_KEY}_FIXTURES`, payload.fixtures);
      }
      if (payload.currentFixtureId !== undefined) {
        setCurrentFixtureId(payload.currentFixtureId);
        writeLS(`${STORAGE_KEY}_CURRENT_ID`, payload.currentFixtureId);
      }
      if (payload.auditLogs !== undefined) {
        setAuditLogs(payload.auditLogs);
        writeLS(`${STORAGE_KEY}_LOGS`, payload.auditLogs);
      }
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn("Error applying remote state:", e);
    }
  }, []);

  // Multi-tier broadcast: WebRTC DataChannel + /api/state backend + BroadcastChannel + localStorage
  const broadcast = useCallback((updates) => {
    try {
      // 1. Update localStorage cache
      if (updates.datasetMeta !== undefined) writeLS(`${STORAGE_KEY}_DATASET_META`, updates.datasetMeta);
      if (updates.participants !== undefined) writeLS(`${STORAGE_KEY}_PARTICIPANTS`, updates.participants);
      if (updates.operatorCategory !== undefined) writeLS(`${STORAGE_KEY}_OPERATOR_CATEGORY`, updates.operatorCategory);
      if (updates.fixtures !== undefined) writeLS(`${STORAGE_KEY}_FIXTURES`, updates.fixtures);
      if (updates.currentFixtureId !== undefined) writeLS(`${STORAGE_KEY}_CURRENT_ID`, updates.currentFixtureId);
      if (updates.auditLogs !== undefined) writeLS(`${STORAGE_KEY}_LOGS`, updates.auditLogs);

      setLastSync(new Date().toLocaleTimeString());

      // 2. BroadcastChannel for same-device cross-tab communication
      try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: "STATE_UPDATE", payload: updates });
        channel.close();
      } catch {}

      // 3. WebRTC DataChannel: push to connected display peer(s) instantly (<30ms)
      if (activeConnectionsRef.current.length > 0) {
        activeConnectionsRef.current.forEach(conn => {
          try {
            if (conn.open) {
              conn.send({ type: "STATE_UPDATE", payload: updates });
            }
          } catch (err) {
            console.warn("Peer broadcast error:", err);
          }
        });
      }

      // 4. Serverless API persistence: sync with Vercel /api/state
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentState: updates,
          operatorPeerId: operatorPeerIdRef.current
        })
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data) return;
          if (data.version) {
            localVersionRef.current = Math.max(localVersionRef.current, data.version);
          }
          setDbStatus("ONLINE");
        })
        .catch(() => {});

    } catch (e) {
      console.warn("Broadcast error:", e);
    }
  }, []);

  // Stable Realtime Sync Engine: Initialized ONCE on mount to eliminate flickering & reconnections
  useEffect(() => {
    let isMounted = true;

    // 1. Initial State Fetch from Vercel backend /api/state
    fetch('/api/state')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!isMounted || !data) return;
        if (data.version) localVersionRef.current = data.version;

        const currentSnapshot = stateRef.current;
        const hasLocalData = (currentSnapshot.participants && currentSnapshot.participants.length > 0) ||
                             (currentSnapshot.fixtures && currentSnapshot.fixtures.length > 0);

        if (data.tournamentState) {
          // If on /display or operator has zero local data, hydrate from backend
          if (isDisplay || !hasLocalData) {
            applyRemoteState(data.tournamentState);
          }
        } else if (!isDisplay && hasLocalData) {
          // Seed server with operator's initial state if server is blank
          fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tournamentState: {
                datasetMeta: currentSnapshot.datasetMeta,
                participants: currentSnapshot.participants,
                operatorCategory: currentSnapshot.operatorCategory,
                fixtures: currentSnapshot.fixtures,
                currentFixtureId: currentSnapshot.currentFixtureId,
                auditLogs: currentSnapshot.auditLogs
              }
            })
          }).catch(() => {});
        }
      })
      .catch(() => {});

    // 2. BroadcastChannel listener (same device cross-tab)
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (!isMounted) return;
        // On display, always apply. On operator, only apply if we receive a remote update
        if (event.data?.type === "STATE_UPDATE" && isDisplay) {
          applyRemoteState(event.data.payload);
        }
      };
    } catch {}

    // 3. Storage event listener (same device cross-tab fallback)
    const handleStorage = (e) => {
      if (!isMounted || !isDisplay || !e.key || !e.key.startsWith(STORAGE_KEY)) return;
      try {
        if (e.key === `${STORAGE_KEY}_DATASET_META`) setDatasetMeta(e.newValue ? JSON.parse(e.newValue) : null);
        if (e.key === `${STORAGE_KEY}_PARTICIPANTS`) setParticipants(e.newValue ? JSON.parse(e.newValue) : []);
        if (e.key === `${STORAGE_KEY}_OPERATOR_CATEGORY`) setOperatorCategoryState(e.newValue ? JSON.parse(e.newValue) : DEFAULT_CATEGORY);
        if (e.key === `${STORAGE_KEY}_FIXTURES`) setFixtures(e.newValue ? JSON.parse(e.newValue) : []);
        if (e.key === `${STORAGE_KEY}_CURRENT_ID`) setCurrentFixtureId(e.newValue ? JSON.parse(e.newValue) : null);
        if (e.key === `${STORAGE_KEY}_LOGS`) setAuditLogs(e.newValue ? JSON.parse(e.newValue) : []);
        setLastSync(new Date().toLocaleTimeString());
      } catch {}
    };
    window.addEventListener('storage', handleStorage);

    // 4. WebRTC Connection Setup via PeerJS (Persistent connection)
    let peerInstance = null;
    const connectToOperator = (targetPeerId) => {
      if (!peerRef.current || !targetPeerId || targetPeerId === connectedPeerIdRef.current) return;
      try {
        const conn = peerRef.current.connect(targetPeerId, { reliable: true });
        connectedPeerIdRef.current = targetPeerId;

        conn.on('open', () => {
          if (!isMounted) return;
          setRealtimeStatus("CONNECTED");
          setDisplayConnected(true);
        });

        conn.on('data', (data) => {
          if (!isMounted || !data) return;
          if (data.type === 'FULL_STATE' || data.type === 'STATE_UPDATE') {
            applyRemoteState(data.payload);
          }
        });

        const handleDisconnect = () => {
          connectedPeerIdRef.current = null;
          if (isMounted) setRealtimeStatus("SYNCING");
        };
        conn.on('close', handleDisconnect);
        conn.on('error', handleDisconnect);
      } catch (err) {
        console.warn("Peer connection error:", err);
      }
    };

    try {
      const PeerClass = PeerPkg?.Peer || PeerPkg?.default || PeerPkg;
      if (typeof PeerClass === 'function') {
        peerInstance = new PeerClass();
        peerRef.current = peerInstance;

        if (!isDisplay) {
          // OPERATOR: Host peer
          peerInstance.on('open', (id) => {
            if (!isMounted) return;
            operatorPeerIdRef.current = id;
            setRealtimeStatus("CONNECTED");
            fetch('/api/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operatorPeerId: id })
            }).catch(() => {});
          });

          peerInstance.on('connection', (conn) => {
            conn.on('open', () => {
              activeConnectionsRef.current.push(conn);
              setDisplayConnected(true);
              setRealtimeStatus("CONNECTED");
              // Send latest full state to newly connected display
              try {
                conn.send({
                  type: 'FULL_STATE',
                  payload: { ...stateRef.current }
                });
              } catch {}
            });

            const removeConn = () => {
              activeConnectionsRef.current = activeConnectionsRef.current.filter(c => c !== conn);
              if (activeConnectionsRef.current.length === 0 && isMounted) {
                setDisplayConnected(false);
              }
            };
            conn.on('close', removeConn);
            conn.on('error', removeConn);
          });
        } else {
          // DISPLAY: Fetch operator's peer ID and connect
          peerInstance.on('open', () => {
            if (!isMounted) return;
            fetch('/api/state')
              .then(r => (r.ok ? r.json() : null))
              .then(d => {
                if (d?.operatorPeerId) {
                  connectToOperator(d.operatorPeerId);
                }
              })
              .catch(() => {});
          });
        }

        peerInstance.on('error', (err) => {
          console.warn("PeerJS notice:", err?.type || err);
        });
      }
    } catch (e) {
      console.warn("PeerJS initialization notice:", e);
    }

    // 5. Watchdog Polling (Every 1500ms): Guarantees cross-device sync without operator flicker
    const pollInterval = setInterval(() => {
      fetch('/api/state')
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!isMounted || !data) return;
          setDbStatus("ONLINE");
          setRealtimeStatus("CONNECTED");

          // CRITICAL: ONLY Display applies remote state from polling to prevent Operator state oscillation/flicker!
          if (isDisplay && data.tournamentState && data.version && data.version > localVersionRef.current) {
            localVersionRef.current = data.version;
            applyRemoteState(data.tournamentState);
          }

          // If on display and operator peer is newly registered, establish WebRTC
          if (isDisplay && data.operatorPeerId && data.operatorPeerId !== connectedPeerIdRef.current) {
            connectToOperator(data.operatorPeerId);
          }
        })
        .catch(() => {
          if (isMounted) setDbStatus("RECONNECTING");
        });
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      if (peerInstance) {
        try { peerInstance.destroy(); } catch {}
      }
    };
  }, [isDisplay, applyRemoteState]);

  // Helper to append an audit log
  const logAction = (action, description) => {
    const currentLogs = stateRef.current.auditLogs || [];
    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString(),
      action,
      description,
      operator: "Admin Operator (Mat 1)"
    };
    const updated = [newLog, ...currentLogs.slice(0, 99)];
    setAuditLogs(updated);
    return updated;
  };

  // Derive Current Fixture
  const currentFixture = fixtures.find(f => f.id === currentFixtureId) || fixtures[0] || null;

  // Upcoming fixtures (excluding current)
  const remainingFixtures = fixtures.filter(
    f => f.id !== currentFixture?.id && (f.status === "PENDING" || f.status === "ONGOING")
  );
  // Next 2 fixtures for public display
  const nextFixtures = remainingFixtures.slice(0, 2);
  const completedFixtures = fixtures.filter(f => f.status === "COMPLETED");

  // Operator Category toggle
  const setOperatorCategory = (newCat) => {
    const merged = { ...operatorCategory, ...newCat };
    setOperatorCategoryState(merged);
    const updatedLogs = logAction(
      "CATEGORY_CHANGED",
      `Display category updated to ${merged.gender} • ${merged.weightCategory}`
    );
    broadcast({ operatorCategory: merged, auditLogs: updatedLogs });
  };

  // Dataset Import
  const importDataset = (newParticipants, meta) => {
    setParticipants(newParticipants);
    setDatasetMeta(meta);
    const updatedLogs = logAction(
      "DATASET_IMPORTED",
      `Imported dataset "${meta.fileName}" with ${newParticipants.length} participants.`
    );
    broadcast({
      participants: newParticipants,
      datasetMeta: meta,
      auditLogs: updatedLogs
    });
  };

  // Clear Dataset
  const clearDataset = () => {
    setParticipants([]);
    setDatasetMeta(null);
    const updatedLogs = logAction("DATASET_CLEARED", "Cleared active participant dataset.");
    broadcast({
      participants: [],
      datasetMeta: null,
      auditLogs: updatedLogs
    });
  };

  // Add single participant
  const addParticipant = (newParticipant) => {
    const updated = [newParticipant, ...participants];
    setParticipants(updated);
    let updatedMeta = datasetMeta;
    if (datasetMeta) {
      updatedMeta = { ...datasetMeta, recordCount: updated.length };
      setDatasetMeta(updatedMeta);
    }
    const updatedLogs = logAction("PARTICIPANT_ADDED", `Added participant: ${newParticipant.name} (${newParticipant.college})`);
    broadcast({
      participants: updated,
      ...(updatedMeta ? { datasetMeta: updatedMeta } : {}),
      auditLogs: updatedLogs
    });
  };

  // Update single participant
  const updateParticipant = (participant_id, fields) => {
    const updated = participants.map(p => p.participant_id === participant_id ? { ...p, ...fields } : p);
    setParticipants(updated);
    const updatedLogs = logAction("PARTICIPANT_UPDATED", `Updated participant ${participant_id}: ${fields.name || ''}`);
    broadcast({
      participants: updated,
      auditLogs: updatedLogs
    });
  };

  // Delete single participant
  const deleteParticipant = (participant_id) => {
    const updated = participants.filter(p => p.participant_id !== participant_id);
    setParticipants(updated);
    let updatedMeta = datasetMeta;
    if (datasetMeta) {
      updatedMeta = { ...datasetMeta, recordCount: updated.length };
      setDatasetMeta(updatedMeta);
    }
    const updatedLogs = logAction("PARTICIPANT_DELETED", `Deleted participant ID ${participant_id}`);
    broadcast({
      participants: updated,
      ...(updatedMeta ? { datasetMeta: updatedMeta } : {}),
      auditLogs: updatedLogs
    });
  };

  // Matchup Creation: Add to ordered queue without interrupting live match
  const createMatchup = (player1, player2) => {
    const newId = "fix_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    const isFirstFixture = fixtures.length === 0;

    const newFixture = {
      id: newId,
      participant1: {
        id: player1.participant_id || player1.id || "P1",
        name: player1.name,
        college: player1.college
      },
      participant2: {
        id: player2.participant_id || player2.id || "P2",
        name: player2.name,
        college: player2.college
      },
      status: isFirstFixture ? "ONGOING" : "PENDING",
      winnerId: null
    };

    const updatedFixtures = [...fixtures, newFixture];
    const newCurrentId = isFirstFixture ? newId : currentFixtureId;

    setFixtures(updatedFixtures);
    if (isFirstFixture) setCurrentFixtureId(newCurrentId);

    const updatedLogs = logAction(
      "MATCHUP_CREATED",
      `Matchup queued: ${player1.name} (${player1.college}) vs ${player2.name} (${player2.college})`
    );

    broadcast({
      fixtures: updatedFixtures,
      currentFixtureId: newCurrentId,
      auditLogs: updatedLogs
    });
  };

  // Delete Matchup from queue
  const deleteMatchup = (fixtureId) => {
    const updatedFixtures = fixtures.filter(f => f.id !== fixtureId);
    let newCurrentId = currentFixtureId;
    if (currentFixtureId === fixtureId) {
      newCurrentId = updatedFixtures[0]?.id || null;
      setCurrentFixtureId(newCurrentId);
    }
    setFixtures(updatedFixtures);
    const updatedLogs = logAction("MATCHUP_DELETED", `Removed fixture from queue.`);
    broadcast({
      fixtures: updatedFixtures,
      currentFixtureId: newCurrentId,
      auditLogs: updatedLogs
    });
  };

  // Reorder Matchups in queue
  const reorderMatchups = (newFixturesList) => {
    setFixtures(newFixturesList);
    broadcast({ fixtures: newFixturesList });
  };

  // DECLARE WINNER: Never automatically advance to the next fixture!
  const declareWinner = (fixtureId, winnerId) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    const winnerName = fixture.participant1?.id === winnerId ? fixture.participant1.name : fixture.participant2?.name;

    const updatedFixtures = fixtures.map(f => {
      if (f.id === fixtureId) {
        return {
          ...f,
          status: "COMPLETED",
          winnerId
        };
      }
      return f;
    });

    const updatedLogs = logAction(
      "WINNER_DECLARED",
      `Winner declared: ${winnerName}. Match marked COMPLETED. Awaiting manual "Show Next Fixture".`
    );

    setFixtures(updatedFixtures);
    broadcast({
      fixtures: updatedFixtures,
      auditLogs: updatedLogs
    });
  };

  // RESULT CORRECTION / UNDO
  const undoWinner = (fixtureId) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    const updatedFixtures = fixtures.map(f => {
      if (f.id === fixtureId) {
        return {
          ...f,
          status: "ONGOING",
          winnerId: null
        };
      }
      return f;
    });

    const updatedLogs = logAction(
      "RESULT_CORRECTED",
      `Winner declaration reverted to ONGOING by operator.`
    );

    setFixtures(updatedFixtures);
    broadcast({
      fixtures: updatedFixtures,
      auditLogs: updatedLogs
    });
  };

  // SHOW NEXT FIXTURE: Explicit operator action
  const showNextFixture = () => {
    const nextFixture = remainingFixtures[0];
    if (!nextFixture) return;

    const updatedFixtures = fixtures.map(f => {
      if (f.id === currentFixture?.id && f.status === "ONGOING") {
        return { ...f, status: "COMPLETED" };
      }
      if (f.id === nextFixture.id) {
        return { ...f, status: "ONGOING" };
      }
      return f;
    });

    const updatedLogs = logAction(
      "NEXT_FIXTURE_SHOWN",
      `Operator displayed Next Fixture: ${nextFixture.participant1?.name} vs ${nextFixture.participant2?.name}`
    );

    setCurrentFixtureId(nextFixture.id);
    setFixtures(updatedFixtures);

    broadcast({
      currentFixtureId: nextFixture.id,
      fixtures: updatedFixtures,
      auditLogs: updatedLogs
    });
  };

  // Select fixture directly
  const selectFixture = (fixtureId) => {
    const target = fixtures.find(f => f.id === fixtureId);
    if (!target) return;

    const updatedFixtures = fixtures.map(f => {
      if (f.id === fixtureId && f.status === 'PENDING') {
        return { ...f, status: 'ONGOING' };
      }
      return f;
    });

    const updatedLogs = logAction(
      "FIXTURE_SELECTED",
      `Operator manually switched active display to: ${target.participant1?.name} vs ${target.participant2?.name}`
    );

    setCurrentFixtureId(fixtureId);
    setFixtures(updatedFixtures);

    broadcast({
      currentFixtureId: fixtureId,
      fixtures: updatedFixtures,
      auditLogs: updatedLogs
    });
  };

  // Clear/Reset all tournament state
  const resetDemoState = () => {
    localStorage.removeItem(`${STORAGE_KEY}_DATASET_META`);
    localStorage.removeItem(`${STORAGE_KEY}_PARTICIPANTS`);
    localStorage.removeItem(`${STORAGE_KEY}_OPERATOR_CATEGORY`);
    localStorage.removeItem(`${STORAGE_KEY}_FIXTURES`);
    localStorage.removeItem(`${STORAGE_KEY}_CURRENT_ID`);
    localStorage.removeItem(`${STORAGE_KEY}_LOGS`);

    setDatasetMeta(null);
    setParticipants([]);
    setOperatorCategoryState(DEFAULT_CATEGORY);
    setFixtures([]);
    setCurrentFixtureId(null);
    setAuditLogs([]);

    broadcast({
      datasetMeta: null,
      participants: [],
      operatorCategory: DEFAULT_CATEGORY,
      fixtures: [],
      currentFixtureId: null,
      auditLogs: []
    });
  };

  return (
    <TournamentContext.Provider value={{
      datasetMeta,
      participants,
      operatorCategory,
      fixtures,
      currentFixture,
      nextFixtures,
      remainingFixtures,
      completedFixtures,
      auditLogs,
      lastSync,
      realtimeStatus,
      dbStatus,
      displayConnected,
      setOperatorCategory,
      importDataset,
      clearDataset,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      createMatchup,
      deleteMatchup,
      reorderMatchups,
      declareWinner,
      undoWinner,
      showNextFixture,
      selectFixture,
      resetDemoState,
      setFixtures
    }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}
