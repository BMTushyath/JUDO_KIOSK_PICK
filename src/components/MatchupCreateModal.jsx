import React, { useState } from 'react';
import { Layers, X, Search, GripVertical, AlertCircle, Check, ArrowRight, UserPlus } from 'lucide-react';
import DefaultAvatar from './DefaultAvatar';
import PhotoUploadArea from './PhotoUploadArea';

export default function MatchupCreateModal({
  isOpen,
  onClose,
  onCreateMatchup,
  onNavigateToDataset,
  participants = []
}) {
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [dragOverTarget, setDragOverTarget] = useState(null); // 'player1' | 'player2' | null

  if (!isOpen) return null;

  // Filter participants by name or college
  const filteredParticipants = participants.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.college && p.college.toLowerCase().includes(q))
    );
  });

  // Drag start from right panel
  const handleDragStart = (e, participant) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(participant));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Drop onto Player 1
  const handleDropP1 = (e) => {
    e.preventDefault();
    setDragOverTarget(null);
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (!data) return;
      const participant = JSON.parse(data);
      if (player2 && (player2.participant_id === participant.participant_id || player2.id === participant.id)) {
        setError('Cannot select the same athlete for both Player 1 and Player 2.');
        return;
      }
      setPlayer1(participant);
      setError('');
    } catch (err) {
      console.error('Drag drop error:', err);
    }
  };

  // Drop onto Player 2
  const handleDropP2 = (e) => {
    e.preventDefault();
    setDragOverTarget(null);
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (!data) return;
      const participant = JSON.parse(data);
      if (player1 && (player1.participant_id === participant.participant_id || player1.id === participant.id)) {
        setError('Cannot select the same athlete for both Player 1 and Player 2.');
        return;
      }
      setPlayer2(participant);
      setError('');
    } catch (err) {
      console.error('Drag drop error:', err);
    }
  };

  const handleSelectP1 = (participant) => {
    if (player2 && (player2.participant_id === participant.participant_id || player2.id === participant.id)) {
      setError('Cannot select the same athlete for both Player 1 and Player 2.');
      return;
    }
    setPlayer1(participant);
    setError('');
  };

  const handleSelectP2 = (participant) => {
    if (player1 && (player1.participant_id === participant.participant_id || player1.id === participant.id)) {
      setError('Cannot select the same athlete for both Player 1 and Player 2.');
      return;
    }
    setPlayer2(participant);
    setError('');
  };

  const handleCreate = () => {
    if (!player1) {
      setError('Please assign Player 1 (drag an athlete or click + P1).');
      return;
    }
    if (!player2) {
      setError('Please assign Player 2 (drag an athlete or click + P2).');
      return;
    }
    const p1Id = player1.participant_id || player1.id;
    const p2Id = player2.participant_id || player2.id;
    if (p1Id === p2Id) {
      setError('Player 1 and Player 2 must be different participants.');
      return;
    }

    onCreateMatchup(player1, player2);
    setPlayer1(null);
    setPlayer2(null);
    setError('');
    onClose();
  };

  const handleClose = () => {
    setPlayer1(null);
    setPlayer2(null);
    setError('');
    onClose();
  };

  const isReady = player1 && player2 && (player1.id !== player2.id);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal-box" style={{ maxWidth: '920px', width: '96%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Header */}
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} color="#0284c7" />
            <span>Create Matchup &bull; Drag & Drop</span>
          </div>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '10px 0', padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Split: Matchup Drop Zones (Left) | Participant Panel (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', margin: '14px 0', flex: 1, overflow: 'hidden' }}>
          {/* ================= LEFT: MATCHUP SLOTS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Drag an athlete from the right panel into <strong>Player 1</strong> or <strong>Player 2</strong>. Photos can also be dropped or pasted directly here.
            </div>

            {/* PLAYER 1 DROP ZONE */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverTarget('player1'); }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={handleDropP1}
              style={{
                border: dragOverTarget === 'player1'
                  ? '3px dashed #0284c7'
                  : player1
                  ? '2px solid #0284c7'
                  : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '14px',
                background: dragOverTarget === 'player1' ? '#eff6ff' : player1 ? '#f8fdfe' : '#f8fafc',
                transition: 'all 0.18s ease-in-out',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PLAYER 1 (MAT LEFT)
                </span>
                {player1 && (
                  <button
                    onClick={() => setPlayer1(null)}
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {player1 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <PhotoUploadArea
                    photo={player1.photo}
                    onPhotoChange={(newPhoto) => setPlayer1(prev => ({ ...prev, photo: newPhoto }))}
                    size={64}
                    shape="circle"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-navy-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player1.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player1.college}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                    Drop Player 1 Here
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: '#94a3b8' }}>
                    or click &ldquo;+ P1&rdquo; on an athlete from the list
                  </div>
                </div>
              )}
            </div>

            {/* VS DIVIDER */}
            <div style={{ textAlign: 'center', fontWeight: 900, color: '#94a3b8', fontSize: '14px', letterSpacing: '2px' }}>
              &mdash; VS &mdash;
            </div>

            {/* PLAYER 2 DROP ZONE */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverTarget('player2'); }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={handleDropP2}
              style={{
                border: dragOverTarget === 'player2'
                  ? '3px dashed #0284c7'
                  : player2
                  ? '2px solid #0284c7'
                  : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '14px',
                background: dragOverTarget === 'player2' ? '#eff6ff' : player2 ? '#f8fdfe' : '#f8fafc',
                transition: 'all 0.18s ease-in-out',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PLAYER 2 (MAT RIGHT)
                </span>
                {player2 && (
                  <button
                    onClick={() => setPlayer2(null)}
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {player2 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <PhotoUploadArea
                    photo={player2.photo}
                    onPhotoChange={(newPhoto) => setPlayer2(prev => ({ ...prev, photo: newPhoto }))}
                    size={64}
                    shape="circle"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-navy-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player2.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player2.college}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                    Drop Player 2 Here
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: '#94a3b8' }}>
                    or click &ldquo;+ P2&rdquo; on an athlete from the list
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT: PARTICIPANT LIST & SEARCH ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#334e68', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Athletes ({participants.length})
              </span>
              {onNavigateToDataset && (
                <button
                  type="button"
                  onClick={() => { onClose(); onNavigateToDataset(); }}
                  style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <UserPlus size={13} />
                  <span>+ New Athlete</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Search athlete by name or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Participant Cards Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
              {filteredParticipants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
                  {participants.length === 0
                    ? 'No registered participants yet. Add athletes in the Dataset tab.'
                    : 'No matching athletes found.'}
                </div>
              ) : (
                filteredParticipants.map((p) => {
                  const pId = p.participant_id || p.id;
                  const isP1 = player1 && (player1.participant_id === pId || player1.id === pId);
                  const isP2 = player2 && (player2.participant_id === pId || player2.id === pId);

                  return (
                    <div
                      key={pId}
                      draggable={!isP1 && !isP2}
                      onDragStart={(e) => handleDragStart(e, p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        background: (isP1 || isP2) ? '#f1f5f9' : '#ffffff',
                        border: (isP1 || isP2) ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: (isP1 || isP2) ? 'not-allowed' : 'grab',
                        opacity: (isP1 || isP2) ? 0.6 : 1,
                        transition: 'all 0.12s ease-in-out'
                      }}
                      title="Drag into Player 1 or Player 2"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <GripVertical size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                        {p.photo ? (
                          <img
                            src={p.photo}
                            alt={p.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          />
                        ) : (
                          <DefaultAvatar size={32} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-navy-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.college}
                          </div>
                        </div>
                      </div>

                      {/* Quick Assign Buttons */}
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '6px', flexShrink: 0 }}>
                        {isP1 ? (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', padding: '2px 6px' }}>
                            P1 ✓
                          </span>
                        ) : isP2 ? (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', padding: '2px 6px' }}>
                            P2 ✓
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSelectP1(p)}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#0284c7',
                                cursor: 'pointer'
                              }}
                              title="Assign to Player 1"
                            >
                              + P1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectP2(p)}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#0284c7',
                                cursor: 'pointer'
                              }}
                              title="Assign to Player 2"
                            >
                              + P2
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Queue order determines match sequence. No match numbers required.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary-action"
              onClick={handleCreate}
              disabled={!isReady}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isReady ? 1 : 0.5,
                cursor: isReady ? 'pointer' : 'not-allowed'
              }}
            >
              <span>Add to Fixture Queue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
