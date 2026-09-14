import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  Trophy, 
  Crown, 
  Play, 
  RotateCcw, 
  ArrowRight, 
  ExternalLink, 
  Activity, 
  Database, 
  Radio, 
  Monitor, 
  Clock, 
  FileText, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Plus,
  Upload,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  Check,
  Download
} from 'lucide-react';
import './AdminPage.css';
import * as XLSX from 'xlsx';
import DatasetImportModal from '../components/DatasetImportModal';
import MatchupCreateModal from '../components/MatchupCreateModal';
import ParticipantFormModal from '../components/ParticipantFormModal';

const MEN_WEIGHT_CATEGORIES = ["-60 KG", "-66 KG", "-73 KG", "-81 KG", "-90 KG", "-100 KG", "+100 KG", "OPEN"];
const WOMEN_WEIGHT_CATEGORIES = ["-48 KG", "-52 KG", "-57 KG", "-63 KG", "-70 KG", "-78 KG", "+78 KG", "OPEN"];

export default function AdminPage() {
  const {
    datasetMeta,
    participants,
    operatorCategory,
    setOperatorCategory,
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
    resetDemoState
  } = useTournament();

  const [activeTab, setActiveTab] = useState('match-control');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState(false);
  const [participantFormModal, setParticipantFormModal] = useState({ isOpen: false, data: null });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, participant: null });
  const [confirmWinnerModal, setConfirmWinnerModal] = useState({
    isOpen: false,
    fixtureId: null,
    winnerId: null,
    winnerName: '',
    winnerCollege: ''
  });

  // Participant search filter
  const [searchParticipant, setSearchParticipant] = useState('');
  const [customWeightInput, setCustomWeightInput] = useState('');

  // Open winner declaration modal
  const handleOpenDeclareWinner = (fixtureId, participant) => {
    setConfirmWinnerModal({
      isOpen: true,
      fixtureId,
      winnerId: participant.id,
      winnerName: participant.name,
      winnerCollege: participant.college
    });
  };

  const handleConfirmWinner = () => {
    declareWinner(confirmWinnerModal.fixtureId, confirmWinnerModal.winnerId);
    setConfirmWinnerModal({ isOpen: false, fixtureId: null, winnerId: null, winnerName: '', winnerCollege: '' });
  };

  // Re-ordering queue helpers
  const handleMoveQueueItem = (index, direction) => {
    const newFixtures = [...fixtures];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newFixtures.length) return;

    const temp = newFixtures[index];
    newFixtures[index] = newFixtures[targetIndex];
    newFixtures[targetIndex] = temp;
    reorderMatchups(newFixtures);
  };

  // Download Blank Excel Template
  const handleDownloadTemplate = () => {
    const wsData = [['participant_id', 'name', 'college']];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 38 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, 'vtu_participant_import_template.xlsx');
  };

  const isCompleted = currentFixture?.status === 'COMPLETED';
  const isOngoing = currentFixture?.status === 'ONGOING';
  const winnerId = currentFixture?.winnerId;

  const currentGender = operatorCategory?.gender || 'MEN';
  const currentWeight = operatorCategory?.weightCategory || '-73 KG';

  const filteredAthletes = participants.filter(p =>
    p.name?.toLowerCase().includes(searchParticipant.toLowerCase()) ||
    p.college?.toLowerCase().includes(searchParticipant.toLowerCase()) ||
    p.participant_id?.toLowerCase().includes(searchParticipant.toLowerCase())
  );

  return (
    <div className="admin-layout">
      {/* Top Navbar */}
      <header className="admin-navbar">
        <div className="admin-nav-brand">
          <span className="admin-brand-badge">MAT 1 OPERATOR</span>
          <div>
            <div className="admin-brand-title">
              VTU Judo Tournament Management System
            </div>
            <div className="admin-brand-sub">
              Sambhram Institute of Technology &nbsp;•&nbsp; Production Console
            </div>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="admin-health-bar">
          <div className="health-item" title="PostgreSQL Persistence State">
            <Database size={14} color="#0284c7" />
            <span>DB: <strong style={{ color: '#059669' }}>{dbStatus}</strong></span>
          </div>

          <div className="health-item" title="Realtime Sync Channel">
            <Radio size={14} color="#059669" />
            <span className="health-dot pulse" />
            <span>Realtime: <strong style={{ color: '#059669' }}>{realtimeStatus}</strong></span>
          </div>

          <div className="health-item" title="Spectator Screen Link">
            <Monitor size={14} color="#0284c7" />
            <span>Display: <strong style={{ color: displayConnected ? '#059669' : '#d97706' }}>
              {displayConnected ? 'ONLINE' : 'POLLING'}
            </strong></span>
          </div>

          <div className="health-item">
            <Clock size={14} />
            <span>Sync: <strong>{lastSync}</strong></span>
          </div>
        </div>
      </header>

      {/* Nav Tabs Row */}
      <nav className="admin-tabs-row" aria-label="Admin navigation tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'match-control' ? 'active' : ''}`}
          onClick={() => setActiveTab('match-control')}
        >
          <Activity size={16} />
          Match Control
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'matchups' ? 'active' : ''}`}
          onClick={() => setActiveTab('matchups')}
        >
          <Layers size={16} />
          Matchups Queue ({fixtures.length})
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveTab('participants')}
        >
          <Users size={16} />
          Dataset / Participants ({participants.length})
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <Trophy size={16} />
          Results ({completedFixtures.length})
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} />
          Reports & Export
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Clock size={16} />
          Audit Logs ({auditLogs.length})
        </button>

        {/* Dedicated Link to open /display in new tab */}
        <a 
          href="/display" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="admin-view-display-link"
          title="Open dedicated full spectator screen in new window"
        >
          <ExternalLink size={14} />
          Open Spectator Screen (/display)
        </a>
      </nav>

      {/* Main Workspace Area */}
      <main className="admin-content-area">
        {/* ================================================================
            TAB 1: MATCH CONTROL
        ================================================================ */}
        {activeTab === 'match-control' && (
          <div className="match-control-grid">
            {/* Primary Left Column */}
            <div className="operator-main-col">
              {/* OPERATOR DISPLAY CATEGORY CONTROLS (DECOUPLED FROM DATA) */}
              <div className="operator-category-control-box">
                <div className="op-cat-header">
                  <div className="op-cat-title">
                    <span>Display Category Controls (Spectator Screen Overlay)</span>
                  </div>
                  <span className="op-cat-sync-badge">
                    Live Display: {currentGender} • {currentWeight}
                  </span>
                </div>

                <div className="op-cat-grid">
                  {/* Gender Toggle Row */}
                  <div className="op-cat-row">
                    <span className="op-cat-label">Gender:</span>
                    <div className="gender-toggle-group">
                      <button
                        className={`gender-btn ${currentGender === 'MEN' ? 'active' : ''}`}
                        onClick={() => setOperatorCategory({ gender: 'MEN' })}
                      >
                        MEN
                      </button>
                      <button
                        className={`gender-btn ${currentGender === 'WOMEN' ? 'active' : ''}`}
                        onClick={() => setOperatorCategory({ gender: 'WOMEN' })}
                      >
                        WOMEN
                      </button>
                    </div>
                  </div>

                  {/* Weight Category Row */}
                  <div className="op-cat-row">
                    <span className="op-cat-label">Weight:</span>
                    <div className="weight-buttons-wrap">
                      {(currentGender === 'MEN' ? MEN_WEIGHT_CATEGORIES : WOMEN_WEIGHT_CATEGORIES).map((wt) => (
                        <button
                          key={wt}
                          className={`weight-pill-btn ${currentWeight === wt ? 'active' : ''}`}
                          onClick={() => setOperatorCategory({ weightCategory: wt })}
                        >
                          {wt}
                        </button>
                      ))}

                      {/* Custom weight input */}
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                        <input
                          type="text"
                          placeholder="Custom weight..."
                          value={customWeightInput}
                          onChange={(e) => setCustomWeightInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customWeightInput.trim()) {
                              setOperatorCategory({ weightCategory: customWeightInput.trim() });
                              setCustomWeightInput('');
                            }
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            width: '120px'
                          }}
                        />
                        {customWeightInput.trim() && (
                          <button
                            className="btn-undo-result"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => {
                              setOperatorCategory({ weightCategory: customWeightInput.trim() });
                              setCustomWeightInput('');
                            }}
                          >
                            Set
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CURRENT FIXTURE CARD (NO MATCH NUMBERS) */}
              <div className="operator-card">
                <div className="operator-card-header">
                  <div className="op-badge-row">
                    <span className="mat-tag">MAT 1</span>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-navy-dark)' }}>
                      CURRENT FIXTURE
                    </span>
                    <span className="category-badge">{currentGender} • {currentWeight}</span>
                  </div>

                  <div className={`status-badge ${currentFixture?.status?.toLowerCase() || 'ongoing'}`}>
                    {currentFixture?.status === 'ONGOING' && <span className="live-pulse-dot" style={{ marginRight: '6px' }} />}
                    {currentFixture?.status || 'ONGOING'}
                  </div>
                </div>

                {currentFixture ? (
                  <>
                    {/* Contestants Action Box */}
                    <div className="contestant-actions-grid">
                      {/* Participant 1 */}
                      <div className={`contestant-op-box ${winnerId === currentFixture?.participant1?.id ? 'is-winner' : ''}`}>
                        <div className="contestant-op-header">
                          <span className="participant-id-chip">{currentFixture?.participant1?.id}</span>
                          {winnerId === currentFixture?.participant1?.id && (
                            <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800 }}>
                              <Crown size={16} color="#f59e0b" /> WINNER
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="p-name-main">{currentFixture?.participant1?.name}</div>
                          <div className="p-college-sub">{currentFixture?.participant1?.college}</div>
                        </div>

                        {isCompleted ? (
                          winnerId === currentFixture?.participant1?.id ? (
                            <div className="btn-winner-declared-badge">
                              <Crown size={18} /> Declared Winner
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', padding: '10px' }}>
                              Defeated
                            </div>
                          )
                        ) : (
                          <button 
                            className="btn-declare-winner"
                            onClick={() => handleOpenDeclareWinner(currentFixture.id, currentFixture.participant1)}
                            disabled={isCompleted}
                          >
                            <Crown size={18} />
                            Declare {currentFixture?.participant1?.name.split(' ')[0]} Winner
                          </button>
                        )}
                      </div>

                      {/* VS Indicator */}
                      <div style={{ textAlign: 'center', fontWeight: 900, color: '#64748b', fontSize: '16px' }}>
                        VS
                      </div>

                      {/* Participant 2 */}
                      <div className={`contestant-op-box ${winnerId === currentFixture?.participant2?.id ? 'is-winner' : ''}`}>
                        <div className="contestant-op-header">
                          <span className="participant-id-chip">{currentFixture?.participant2?.id}</span>
                          {winnerId === currentFixture?.participant2?.id && (
                            <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800 }}>
                              <Crown size={16} color="#f59e0b" /> WINNER
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="p-name-main">{currentFixture?.participant2?.name}</div>
                          <div className="p-college-sub">{currentFixture?.participant2?.college}</div>
                        </div>

                        {isCompleted ? (
                          winnerId === currentFixture?.participant2?.id ? (
                            <div className="btn-winner-declared-badge">
                              <Crown size={18} /> Declared Winner
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', padding: '10px' }}>
                              Defeated
                            </div>
                          )
                        ) : (
                          <button 
                            className="btn-declare-winner"
                            onClick={() => handleOpenDeclareWinner(currentFixture.id, currentFixture.participant2)}
                            disabled={isCompleted}
                          >
                            <Crown size={18} />
                            Declare {currentFixture?.participant2?.name.split(' ')[0]} Winner
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Match Progression & Correction Banner */}
                    <div className="flow-action-banner">
                      <div className="flow-instruction">
                        <div className="flow-title">
                          {isCompleted ? (
                            <>
                              <CheckCircle2 size={16} color="#d97706" />
                              Match Completed & Screen Locked on Winner
                            </>
                          ) : (
                            <>
                              <Play size={16} color="#059669" />
                              Match in Progress
                            </>
                          )}
                        </div>
                        <div className="flow-subtitle">
                          {isCompleted 
                            ? 'Winner crown is visible on spectator screen. Click "Show Next Fixture" when ready to advance.' 
                            : 'Declare winner upon conclusion. Display will keep showing the match until manually advanced.'}
                        </div>
                      </div>

                      <div className="flow-buttons-group">
                        {/* SAFE RESULT CORRECTION / UNDO */}
                        {isCompleted && (
                          <button 
                            className="btn-undo-result"
                            onClick={() => undoWinner(currentFixture.id)}
                            title="Revert result back to ONGOING in case of scoring error"
                          >
                            <RotateCcw size={15} />
                            Undo Result
                          </button>
                        )}

                        {/* SHOW NEXT FIXTURE (STRICT MANUAL CONTROL) */}
                        <button 
                          className="btn-show-next"
                          onClick={showNextFixture}
                          disabled={remainingFixtures.length === 0}
                          title={remainingFixtures.length === 0 ? "No more fixtures in queue" : "Advance to the next scheduled match in queue"}
                        >
                          <span>Show Next Fixture</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Layers size={36} color="#0284c7" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      No Active Fixture
                    </div>
                    <p style={{ fontSize: '13px', marginTop: '4px', marginBottom: '16px' }}>
                      Queue matchups to begin match control on Mat 1.
                    </p>
                    <button
                      className="btn-primary-action"
                      onClick={() => setIsMatchupModalOpen(true)}
                    >
                      <Plus size={16} /> Create First Matchup
                    </button>
                  </div>
                )}
              </div>

              {/* UPCOMING FIXTURES QUEUE DRAWER */}
              <div className="fixtures-drawer-section">
                <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Up Next on Mat 1 (Queue Order)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      {remainingFixtures.length} upcoming
                    </span>
                    <button
                      className="btn-primary-action"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => setIsMatchupModalOpen(true)}
                    >
                      <Plus size={13} /> Queue Matchup
                    </button>
                  </div>
                </div>

                {remainingFixtures.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                    No upcoming fixtures currently queued
                  </div>
                ) : (
                  remainingFixtures.map((f, idx) => (
                    <div key={f.id} className="admin-fixture-card">
                      <div className="admin-fixture-left">
                        <div className="fixture-match-badge">
                          <span className={`queue-order-tag ${idx === 0 ? 'next' : 'queued'}`}>
                            {idx === 0 ? 'NEXT UP' : idx === 1 ? 'ON DECK' : `IN QUEUE`}
                          </span>
                        </div>
                        <div className="fixture-players-line">
                          {f.participant1?.name} &nbsp;<span style={{ color: '#64748b' }}>vs</span>&nbsp; {f.participant2?.name}
                        </div>
                        <div className="fixture-colleges-line">
                          {f.participant1?.college} &nbsp;•&nbsp; {f.participant2?.college}
                        </div>
                      </div>

                      <button
                        className="btn-undo-result"
                        style={{ fontSize: '12px', padding: '6px 12px', flexShrink: 0 }}
                        onClick={() => selectFixture(f.id)}
                      >
                        Make Active
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar Column: Live /display Mini-Preview & Quick Stats */}
            <div className="operator-side-col">
              {/* Mini Portrait Preview of /display */}
              <div className="display-mini-preview-container">
                <div className="preview-header-bar">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={14} color="#0284c7" />
                    LIVE SPECTATOR PREVIEW
                  </span>
                  <span style={{ color: '#059669', fontSize: '11px', fontWeight: 800 }}>● 1:1 SYNC</span>
                </div>

                <div className="display-iframe-wrapper">
                  <iframe 
                    src="/display" 
                    title="Live Spectator Screen Preview" 
                  />
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                  Scaled 9:16 portrait standing display simulation
                </div>
              </div>

              {/* SESSION PROGRESS */}
              <div className="operator-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-navy-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  SESSION QUEUE STATUS
                </div>

                {/* Live stat pills */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 4px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>{completedFixtures.length}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>DONE</div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 4px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#0284c7' }}>
                      {currentFixture?.status === 'ONGOING' ? 1 : 0}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>LIVE</div>
                  </div>
                  <div style={{ background: '#f8fdfe', border: '1px solid #b2ebf2', padding: '8px 4px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#475569' }}>{remainingFixtures.length}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>QUEUED</div>
                  </div>
                </div>

                {/* Reset State Button */}
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={() => {
                      if (window.confirm("Reset tournament state to empty? This will clear active fixtures and reset demo state.")) {
                        resetDemoState();
                      }
                    }}
                    style={{ width: '100%', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
                  >
                    Reset Tournament State
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 2: MATCHUPS QUEUE (Create & Reorder)
        ================================================================ */}
        {activeTab === 'matchups' && (
          <div className="operator-card">
            <div className="queue-control-header">
              <div>
                <h2>Ordered Matchup Queue</h2>
                <p style={{ color: 'var(--color-navy-muted)', fontSize: '14px', marginTop: '4px' }}>
                  Queue determines the tournament fixture order. Create matchups before or during the live competition.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-primary-action"
                  onClick={() => setIsMatchupModalOpen(true)}
                >
                  <Plus size={16} /> Create New Matchup
                </button>
              </div>
            </div>

            {fixtures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fdfe', border: '2px dashed #b2ebf2', borderRadius: '12px' }}>
                <Layers size={40} color="#0284c7" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  No Matchups Queued Yet
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', marginBottom: '18px' }}>
                  {participants.length === 0 
                    ? "First import your participant dataset, then click below to create matchups."
                    : "Add matchups to the queue. Athletes will be selected from the active dataset."}
                </p>
                <button
                  className="btn-primary-action"
                  onClick={() => setIsMatchupModalOpen(true)}
                >
                  <Plus size={16} /> Create First Matchup
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {fixtures.map((f, index) => {
                  const isCurrent = f.id === currentFixture?.id;
                  const isDone = f.status === 'COMPLETED';
                  const winner = f.winnerId === f.participant1?.id ? f.participant1 : f.participant2;

                  return (
                    <div
                      key={f.id}
                      className="admin-fixture-card"
                      style={{
                        borderLeft: isCurrent ? '4px solid #0284c7' : isDone ? '4px solid #10b981' : '1px solid rgba(178, 235, 242, 0.8)',
                        background: isCurrent ? 'rgba(2, 132, 199, 0.04)' : '#ffffff'
                      }}
                    >
                      <div className="admin-fixture-left" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`queue-order-tag ${isCurrent ? 'active' : isDone ? 'done' : 'queued'}`}>
                            {isCurrent ? '● CURRENT' : isDone ? '✓ COMPLETED' : `QUEUE #${index + 1}`}
                          </span>
                          <span className={`status-badge ${f.status.toLowerCase()}`}>
                            {f.status}
                          </span>
                        </div>

                        <div className="fixture-players-line" style={{ marginTop: '4px' }}>
                          <span style={{ fontWeight: 800 }}>{f.participant1?.name}</span>
                          <span style={{ color: '#64748b', fontSize: '13px', margin: '0 8px' }}>vs</span>
                          <span style={{ fontWeight: 800 }}>{f.participant2?.name}</span>
                          {isDone && winner && (
                            <span style={{ marginLeft: '10px', color: '#b45309', fontSize: '13px', fontWeight: 800 }}>
                              (👑 Winner: {winner.name})
                            </span>
                          )}
                        </div>

                        <div className="fixture-colleges-line">
                          {f.participant1?.college} &nbsp;•&nbsp; {f.participant2?.college}
                        </div>
                      </div>

                      {/* Queue Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Move Up/Down */}
                        <button
                          className="btn-undo-result"
                          style={{ padding: '6px 8px' }}
                          disabled={index === 0}
                          onClick={() => handleMoveQueueItem(index, -1)}
                          title="Move up in queue order"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="btn-undo-result"
                          style={{ padding: '6px 8px' }}
                          disabled={index === fixtures.length - 1}
                          onClick={() => handleMoveQueueItem(index, 1)}
                          title="Move down in queue order"
                        >
                          <ArrowDown size={14} />
                        </button>

                        {!isCurrent && (
                          <button
                            className="btn-undo-result"
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                            onClick={() => {
                              selectFixture(f.id);
                              setActiveTab('match-control');
                            }}
                          >
                            Make Active
                          </button>
                        )}

                        <button
                          className="btn-undo-result"
                          style={{ padding: '6px 8px', color: '#ef4444' }}
                          onClick={() => {
                            if (window.confirm("Remove this matchup from queue?")) {
                              deleteMatchup(f.id);
                            }
                          }}
                          title="Remove from queue"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB 3: PARTICIPANTS / DATASET MANAGEMENT
        ================================================================ */}
        {activeTab === 'participants' && (
          <div className="operator-card">
            {/* Active Dataset Banner or Empty State */}
            {datasetMeta ? (
              <div className="dataset-banner">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={20} color="#0284c7" />
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      Active Dataset: {datasetMeta.fileName}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                    Imported: {datasetMeta.uploadedAt} &nbsp;•&nbsp; <strong>{participants.length}</strong> registered participants
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-undo-result"
                    onClick={handleDownloadTemplate}
                    title="Download official blank Excel participant import template"
                  >
                    <Download size={14} /> Download Excel Template
                  </button>
                  <button
                    className="btn-undo-result"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <Upload size={14} /> Replace Dataset
                  </button>
                  <button
                    className="btn-undo-result"
                    style={{ color: '#ef4444' }}
                    onClick={() => {
                      if (window.confirm("Clear the active dataset? Matchups referencing these athletes will remain.")) {
                        clearDataset();
                      }
                    }}
                  >
                    <Trash2 size={14} /> Clear Dataset
                  </button>
                </div>
              </div>
            ) : (
              <div className="dataset-empty-state">
                <FileSpreadsheet size={44} color="#0284c7" style={{ margin: '0 auto' }} />
                <div className="dataset-empty-title">
                  No participant dataset loaded.
                </div>
                <div className="dataset-empty-desc">
                  Upload XLSX/CSV to begin creating fixtures and running the competition.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    className="btn-primary-action"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <Upload size={16} /> Upload XLSX / CSV
                  </button>
                  <button
                    className="btn-undo-result"
                    onClick={handleDownloadTemplate}
                  >
                    <Download size={14} /> Download Excel Template
                  </button>
                </div>
              </div>
            )}

            {/* Participants Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Search athlete by name, college, or ID..."
                value={searchParticipant}
                onChange={(e) => setSearchParticipant(e.target.value)}
                style={{
                  flex: 1,
                  background: '#f8fdfe',
                  border: '1px solid #b2ebf2',
                  color: 'var(--color-navy-dark)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-primary-action"
                  onClick={() => setParticipantFormModal({ isOpen: true, data: null })}
                >
                  <Plus size={16} /> Add Participant
                </button>
              </div>
            </div>

            {/* Participants Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#f0fdf4', color: 'var(--color-navy-dark)', textAlign: 'left', borderBottom: '2px solid #b2ebf2' }}>
                    <th style={{ padding: '10px 12px' }}>ID</th>
                    <th style={{ padding: '10px 12px' }}>Athlete Name</th>
                    <th style={{ padding: '10px 12px' }}>College / Institution</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAthletes.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        {participants.length === 0 ? "No participants in active dataset." : "No participants match search."}
                      </td>
                    </tr>
                  ) : (
                    filteredAthletes.slice(0, 100).map((p, i) => (
                      <tr key={p.participant_id || i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'transparent' : '#f8fafc' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 700 }}>
                          {p.participant_id}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-navy-muted)' }}>
                          {p.college}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn-undo-result"
                              style={{ padding: '4px 8px' }}
                              onClick={() => setParticipantFormModal({ isOpen: true, data: p })}
                              title="Edit participant"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn-undo-result"
                              style={{ padding: '4px 8px', color: '#ef4444' }}
                              onClick={() => setDeleteConfirmModal({ isOpen: true, participant: p })}
                              title="Delete participant"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredAthletes.length > 100 && (
                <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: '#64748b' }}>
                  Showing first 100 of {filteredAthletes.length} matching participants.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 4: RESULTS (NO MATCH NUMBERS)
        ================================================================ */}
        {activeTab === 'results' && (
          <div className="operator-card">
            <h2 style={{ marginBottom: '16px' }}>Official Match Results</h2>
            {completedFixtures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No matches completed yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedFixtures.map((f) => {
                  const winner = f.winnerId === f.participant1?.id ? f.participant1 : f.participant2;
                  const loser = f.winnerId === f.participant1?.id ? f.participant2 : f.participant1;

                  return (
                    <div key={f.id} className="admin-fixture-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                      <div className="admin-fixture-left">
                        <div className="fixture-match-badge">
                          <span className="queue-order-tag done">COMPLETED</span>
                          <span>•</span>
                          <span>{currentGender} • {currentWeight}</span>
                        </div>
                        <div className="fixture-players-line" style={{ color: '#b45309' }}>
                          👑 {winner?.name} ({winner?.college})
                        </div>
                        <div className="fixture-colleges-line">
                          Defeated {loser?.name} ({loser?.college})
                        </div>
                      </div>

                      <div>
                        <button 
                          className="btn-undo-result"
                          onClick={() => undoWinner(f.id)}
                        >
                          <RotateCcw size={14} /> Correct / Undo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB 5: REPORTS & EXPORT
        ================================================================ */}
        {activeTab === 'reports' && (
          <div className="operator-card">
            <h2>Tournament Reports & Official Summaries</h2>
            <p style={{ color: 'var(--color-navy-muted)', fontSize: '14px', marginTop: '6px', marginBottom: '20px' }}>
              Export official signed score sheets and results for VTU University Sports Board.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f8fdfe', padding: '20px', borderRadius: '10px', border: '1px solid #b2ebf2' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--color-navy-dark)', marginBottom: '8px' }}>Official Session Results PDF</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-navy-muted)', marginBottom: '16px' }}>
                  Printable score report with completed bouts, winners, and timestamps.
                </p>
                <button 
                  className="btn-show-next"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => alert("Session Results generated successfully for printing.")}
                >
                  Generate Official Report
                </button>
              </div>

              <div style={{ background: '#f8fdfe', padding: '20px', borderRadius: '10px', border: '1px solid #b2ebf2' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--color-navy-dark)', marginBottom: '8px' }}>Active Participant Roster</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-navy-muted)', marginBottom: '16px' }}>
                  Download CSV export of currently active participants ({participants.length} registered).
                </p>
                <button 
                  className="btn-undo-result"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet(participants);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Participants");
                    XLSX.writeFile(wb, "vtu_judo_participants_roster.xlsx");
                  }}
                >
                  Export Participants XLSX
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 6: AUDIT TRAIL
        ================================================================ */}
        {activeTab === 'audit' && (
          <div className="operator-card">
            <h2 style={{ marginBottom: '16px' }}>Match Operations Audit Trail</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No audit logs recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} style={{
                    background: '#f8fdfe',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #b2ebf2',
                    borderLeft: '4px solid #0284c7',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)', fontSize: '14px' }}>
                        {log.description}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-navy-muted)', marginTop: '4px' }}>
                        {log.operator} • Action: <strong style={{ color: '#0284c7' }}>{log.action}</strong>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748b' }}>
                      {log.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* WINNER DECLARATION CONFIRMATION MODAL */}
      {confirmWinnerModal.isOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal-box">
            <div className="modal-title">
              <Crown size={22} color="#f59e0b" />
              Confirm Winner Declaration
            </div>

            <div className="modal-body">
              Are you sure you want to declare this competitor as the official winner?
              
              <div className="winner-highlight-banner">
                <div className="winner-highlight-name">{confirmWinnerModal.winnerName}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{confirmWinnerModal.winnerCollege}</div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--color-navy-muted)', marginTop: '16px', lineHeight: 1.4 }}>
                Note: Declaring a winner completes this match and displays the 👑 on the spectator screen, but will <strong>NEVER</strong> automatically advance to the next fixture until you explicitly click "Show Next Fixture".
              </p>
            </div>

            <div className="modal-actions-row">
              <button 
                className="btn-modal-cancel"
                onClick={() => setConfirmWinnerModal({ isOpen: false, fixtureId: null, winnerId: null, winnerName: '', winnerCollege: '' })}
              >
                Cancel
              </button>
              <button 
                className="btn-modal-confirm"
                onClick={handleConfirmWinner}
              >
                <Crown size={16} /> Confirm & Declare Winner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PARTICIPANT CONFIRMATION MODAL */}
      {deleteConfirmModal.isOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal-box">
            <div className="modal-title">
              <Trash2 size={20} color="#ef4444" />
              Confirm Delete Participant
            </div>
            <div className="modal-body">
              Are you sure you want to delete <strong>{deleteConfirmModal.participant?.name}</strong> ({deleteConfirmModal.participant?.college})?
            </div>
            <div className="modal-actions-row">
              <button 
                className="btn-modal-cancel"
                onClick={() => setDeleteConfirmModal({ isOpen: false, participant: null })}
              >
                Cancel
              </button>
              <button 
                className="btn-modal-confirm"
                style={{ background: '#ef4444' }}
                onClick={() => {
                  deleteParticipant(deleteConfirmModal.participant?.participant_id);
                  setDeleteConfirmModal({ isOpen: false, participant: null });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DATASET IMPORT */}
      <DatasetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(newParticipants, meta) => importDataset(newParticipants, meta)}
      />

      {/* MODAL: MATCHUP CREATE */}
      <MatchupCreateModal
        isOpen={isMatchupModalOpen}
        onClose={() => setIsMatchupModalOpen(false)}
        onCreateMatchup={(p1, p2) => createMatchup(p1, p2)}
        participants={participants}
      />

      {/* MODAL: PARTICIPANT FORM (ADD / EDIT) */}
      <ParticipantFormModal
        isOpen={participantFormModal.isOpen}
        initialData={participantFormModal.data}
        onClose={() => setParticipantFormModal({ isOpen: false, data: null })}
        onSave={(data) => {
          if (participantFormModal.data) {
            updateParticipant(participantFormModal.data.participant_id, data);
          } else {
            addParticipant(data);
          }
        }}
      />
    </div>
  );
}
