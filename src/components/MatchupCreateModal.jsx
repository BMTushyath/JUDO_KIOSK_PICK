import React, { useState } from 'react';
import { UserPlus, UserCheck, Plus, X, Layers, AlertCircle } from 'lucide-react';
import ParticipantSearchModal from './ParticipantSearchModal';

export default function MatchupCreateModal({
  isOpen,
  onClose,
  onCreateMatchup,
  onNavigateToDataset,
  participants = []
}) {
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [searchTarget, setSearchTarget] = useState(null); // 'player1' | 'player2' | null
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectParticipant = (selected) => {
    if (searchTarget === 'player1') {
      if (player2 && player2.participant_id === selected.participant_id) {
        setError('Cannot select the same athlete for both Player 1 and Player 2.');
        return;
      }
      setPlayer1(selected);
      setError('');
    } else if (searchTarget === 'player2') {
      if (player1 && player1.participant_id === selected.participant_id) {
        setError('Cannot select the same athlete for both Player 1 and Player 2.');
        return;
      }
      setPlayer2(selected);
      setError('');
    }
  };

  const handleCreate = () => {
    if (!player1) {
      setError('Please add Player 1.');
      return;
    }
    if (!player2) {
      setError('Please add Player 2.');
      return;
    }
    if (player1.participant_id === player2.participant_id) {
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

  return (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="confirm-modal-box" style={{ maxWidth: '680px', width: '94%' }}>
          <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={22} color="#0284c7" />
              <span>Create New Matchup</span>
            </div>
            <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body" style={{ padding: '16px 0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Select both athletes from the active participant dataset. The matchup will be placed into the ordered queue without interrupting any ongoing match.
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Matchup Creation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px' }}>
              {/* Player 1 Box */}
              <div style={{
                border: player1 ? '2px solid #0284c7' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                background: player1 ? '#f8fdfe' : '#f8fafc',
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PLAYER 1 (WHITE / MAT LEFT)
                </div>

                {player1 ? (
                  <div style={{ margin: '12px 0' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-navy-dark)' }}>
                      {player1.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      {player1.college}
                    </div>
                    {player1.participant_id && (
                      <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        {player1.participant_id}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '13px' }}>
                    No athlete selected
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSearchTarget('player1')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: player1 ? '#e0f2fe' : '#0284c7',
                    color: player1 ? '#0369a1' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    width: '100%'
                  }}
                >
                  {player1 ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  <span>{player1 ? 'Change Player 1' : 'Add Player'}</span>
                </button>
              </div>

              {/* VS Badge */}
              <div style={{
                background: 'var(--color-navy-dark)',
                color: '#ffffff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '13px'
              }}>
                VS
              </div>

              {/* Player 2 Box */}
              <div style={{
                border: player2 ? '2px solid #0284c7' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                background: player2 ? '#f8fdfe' : '#f8fafc',
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PLAYER 2 (BLUE / MAT RIGHT)
                </div>

                {player2 ? (
                  <div style={{ margin: '12px 0' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-navy-dark)' }}>
                      {player2.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      {player2.college}
                    </div>
                    {player2.participant_id && (
                      <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        {player2.participant_id}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '13px' }}>
                    No athlete selected
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSearchTarget('player2')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: player2 ? '#e0f2fe' : '#0284c7',
                    color: player2 ? '#0369a1' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    width: '100%'
                  }}
                >
                  {player2 ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  <span>{player2 ? 'Change Player 2' : 'Add Player'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <button className="btn-modal-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="btn-modal-confirm"
              onClick={handleCreate}
              disabled={!player1 || !player2}
              style={{ opacity: player1 && player2 ? 1 : 0.5 }}
            >
              <Plus size={16} /> Queue Matchup
            </button>
          </div>
        </div>
      </div>

      {/* Participant Selection Modal */}
      <ParticipantSearchModal
        isOpen={Boolean(searchTarget)}
        onClose={() => setSearchTarget(null)}
        onSelect={handleSelectParticipant}
        onNavigateToDataset={() => {
          setSearchTarget(null);
          handleClose();
          if (onNavigateToDataset) onNavigateToDataset();
        }}
        participants={participants}
        title={searchTarget === 'player1' ? 'Select Athlete for Player 1' : 'Select Athlete for Player 2'}
      />
    </>
  );
}
