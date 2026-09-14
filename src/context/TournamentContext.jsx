import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TournamentContext = createContext(null);

const STORAGE_KEY = "VTU_JUDO_TOURNAMENT_STATE_V2";
const CHANNEL_NAME = "VTU_JUDO_CHANNEL_V2";

const DEFAULT_CATEGORY = {
  gender: "MEN",
  weightCategory: "-73 KG"
};

export function TournamentProvider({ children }) {
  // 1. Dataset metadata & Participants list
  const [datasetMeta, setDatasetMeta] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_DATASET_META`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [participants, setParticipants] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_PARTICIPANTS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Operator display category (Independent of participant data)
  const [operatorCategory, setOperatorCategoryState] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_OPERATOR_CATEGORY`);
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORY;
    } catch {
      return DEFAULT_CATEGORY;
    }
  });

  // 3. Matchup Queue (Ordered list of fixtures without match numbers)
  const [fixtures, setFixtures] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_FIXTURES`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Current active fixture ID
  const [currentFixtureId, setCurrentFixtureId] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_CURRENT_ID`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 5. Audit logs
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_LOGS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastSync, setLastSync] = useState(() => new Date().toLocaleTimeString());
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTED");
  const [dbStatus, setDbStatus] = useState("READY");
  const [displayConnected, setDisplayConnected] = useState(true);

  // Cross-tab and window realtime broadcast sync
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === "STATE_UPDATE") {
          const payload = event.data.payload;
          if (payload.datasetMeta !== undefined) setDatasetMeta(payload.datasetMeta);
          if (payload.participants !== undefined) setParticipants(payload.participants);
          if (payload.operatorCategory !== undefined) setOperatorCategoryState(payload.operatorCategory);
          if (payload.fixtures !== undefined) setFixtures(payload.fixtures);
          if (payload.currentFixtureId !== undefined) setCurrentFixtureId(payload.currentFixtureId);
          if (payload.auditLogs !== undefined) setAuditLogs(payload.auditLogs);
          setLastSync(new Date().toLocaleTimeString());
        }
      };
    } catch {
      // Fallback
    }

    // Storage event listener fallback for browsers/iframes
    const handleStorage = (e) => {
      if (!e.key || !e.key.startsWith(STORAGE_KEY)) return;
      try {
        if (e.key === `${STORAGE_KEY}_DATASET_META`) setDatasetMeta(e.newValue ? JSON.parse(e.newValue) : null);
        if (e.key === `${STORAGE_KEY}_PARTICIPANTS`) setParticipants(e.newValue ? JSON.parse(e.newValue) : []);
        if (e.key === `${STORAGE_KEY}_OPERATOR_CATEGORY`) setOperatorCategoryState(e.newValue ? JSON.parse(e.newValue) : DEFAULT_CATEGORY);
        if (e.key === `${STORAGE_KEY}_FIXTURES`) setFixtures(e.newValue ? JSON.parse(e.newValue) : []);
        if (e.key === `${STORAGE_KEY}_CURRENT_ID`) setCurrentFixtureId(e.newValue ? JSON.parse(e.newValue) : null);
        if (e.key === `${STORAGE_KEY}_LOGS`) setAuditLogs(e.newValue ? JSON.parse(e.newValue) : []);
        setLastSync(new Date().toLocaleTimeString());
      } catch {
        // ignore parsing error
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Broadcast state updates to storage and BroadcastChannel
  const broadcast = useCallback((updates) => {
    try {
      if (updates.datasetMeta !== undefined) {
        localStorage.setItem(`${STORAGE_KEY}_DATASET_META`, JSON.stringify(updates.datasetMeta));
      }
      if (updates.participants !== undefined) {
        localStorage.setItem(`${STORAGE_KEY}_PARTICIPANTS`, JSON.stringify(updates.participants));
      }
      if (updates.operatorCategory !== undefined) {
        localStorage.setItem(`${STORAGE_KEY}_OPERATOR_CATEGORY`, JSON.stringify(updates.operatorCategory));
      }
      if (updates.fixtures !== undefined) {
        localStorage.setItem(`${STORAGE_KEY}_FIXTURES`, JSON.stringify(updates.fixtures));
      }
      if (updates.currentFixtureId !== undefined) {
        localStorage.setItem(`${STORAGE_KEY}_CURRENT_ID`, JSON.stringify(updates.currentFixtureId));
      }
      if (updates.auditLogs !== undefined) {
        localStorage.setItem(`${STORAGE_KEY}_LOGS`, JSON.stringify(updates.auditLogs));
      }

      setLastSync(new Date().toLocaleTimeString());

      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({
        type: "STATE_UPDATE",
        payload: updates
      });
      channel.close();
    } catch {
      // LocalStorage or BroadcastChannel error
    }
  }, []);

  // Helper to append an audit log
  const logAction = useCallback((action, description) => {
    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString(),
      action,
      description,
      operator: "Admin Operator (Mat 1)"
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    return updated;
  }, [auditLogs]);

  // Derive Current Fixture
  // If currentFixtureId is valid, find it; otherwise pick first ongoing or first fixture in queue
  const currentFixture = fixtures.find(f => f.id === currentFixtureId) || fixtures[0] || null;

  // Upcoming fixtures (excluding the current one).
  // Strictly preserves the queue order!
  const remainingFixtures = fixtures.filter(
    f => f.id !== currentFixture?.id && (f.status === "PENDING" || f.status === "ONGOING")
  );
  // Next 2 fixtures for the 3-fixture public display
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

  // Add a single participant
  const addParticipant = (newParticipant) => {
    const updated = [newParticipant, ...participants];
    setParticipants(updated);
    if (datasetMeta) {
      const updatedMeta = { ...datasetMeta, recordCount: updated.length };
      setDatasetMeta(updatedMeta);
      broadcast({ participants: updated, datasetMeta: updatedMeta });
    } else {
      broadcast({ participants: updated });
    }
    logAction("PARTICIPANT_ADDED", `Added participant: ${newParticipant.name} (${newParticipant.college})`);
  };

  // Update a single participant
  const updateParticipant = (participant_id, fields) => {
    const updated = participants.map(p => p.participant_id === participant_id ? { ...p, ...fields } : p);
    setParticipants(updated);
    broadcast({ participants: updated });
    logAction("PARTICIPANT_UPDATED", `Updated participant ${participant_id}: ${fields.name || ''}`);
  };

  // Delete a single participant
  const deleteParticipant = (participant_id) => {
    const updated = participants.filter(p => p.participant_id !== participant_id);
    setParticipants(updated);
    if (datasetMeta) {
      const updatedMeta = { ...datasetMeta, recordCount: updated.length };
      setDatasetMeta(updatedMeta);
      broadcast({ participants: updated, datasetMeta: updatedMeta });
    } else {
      broadcast({ participants: updated });
    }
    logAction("PARTICIPANT_DELETED", `Deleted participant ID ${participant_id}`);
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

  // DECLARE WINNER
  // RULE: "Declare Winner" must NEVER automatically advance to the next fixture!
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

  // SHOW NEXT FIXTURE
  // Explicit action required by operator
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
