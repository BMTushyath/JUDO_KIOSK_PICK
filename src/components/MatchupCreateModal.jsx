import React, { useState, useRef } from 'react';
import { UserPlus, UserCheck, Plus, X, Layers, AlertCircle, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import ParticipantSearchModal from './ParticipantSearchModal';
import { compressImageFile } from '../utils/imageUtils';

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
  const [compressing, setCompressing] = useState(false);

  const fileInputP1Ref = useRef(null);
  const fileInputP2Ref = useRef(null);

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

  const handlePhotoUpload = async (playerKey, file) => {
    if (!file) return;
    try {
      setCompressing(true);
      setError('');
      const compressedUrl = await compressImageFile(file, 480, 480, 0.82);
      if (playerKey === 'player1') {
        setPlayer1(prev => prev ? { ...prev, photo: compressedUrl } : null);
      } else {
        setPlayer2(prev => prev ? { ...prev, photo: compressedUrl } : null);
      }
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('Could not process photo: ' + (err.message || 'Invalid image file'));
    } finally {
      setCompressing(false);
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
    if (!player1.photo) {
      setError('Participant photo is REQUIRED for Player 1.');
      return;
    }
    if (!player2.photo) {
      setError('Participant photo is REQUIRED for Player 2.');
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

  const isReady = player1 && player2 && player1.photo && player2.photo;

  return (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="confirm-modal-box" style={{ maxWidth: '740px', width: '95%' }}>
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
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: '1.4' }}>
              Select both athletes from the participant dataset. <strong>Participant photo is REQUIRED</strong> for each athlete before the matchup can proceed to an ongoing fixture.
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Matchup Creation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch', gap: '16px' }}>
              {/* Player 1 Box */}
              <div style={{
                border: player1 ? (player1.photo ? '2px solid #0284c7' : '2px solid #f59e0b') : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                background: player1 ? '#f8fdfe' : '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      PLAYER 1 (MAT LEFT)
                    </span>
                    {player1 && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: player1.photo ? '#dcfce7' : '#fef3c7',
                        color: player1.photo ? '#166534' : '#92400e'
                      }}>
                        {player1.photo ? 'PHOTO READY' : 'PHOTO REQUIRED'}
                      </span>
                    )}
                  </div>

                  {player1 ? (
                    <div>
                      {/* Photo Preview & Upload Section */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{
                          width: '76px',
                          height: '88px',
                          borderRadius: '8px',
                          backgroundColor: '#e2e8f0',
                          border: player1.photo ? '2px solid #0284c7' : '2px dashed #f59e0b',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          {player1.photo ? (
                            <img
                              src={player1.photo}
                              alt={player1.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center', color: '#f59e0b', padding: '4px' }}>
                              <Camera size={24} style={{ margin: '0 auto 2px' }} />
                              <span style={{ fontSize: '10px', fontWeight: 800, display: 'block' }}>NO PHOTO</span>
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputP1Ref}
                            style={{ display: 'none' }}
                            onChange={(e) => handlePhotoUpload('player1', e.target.files?.[0])}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputP1Ref.current?.click()}
                            disabled={compressing}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: player1.photo ? '#f1f5f9' : '#f59e0b',
                              color: player1.photo ? '#0f172a' : '#ffffff',
                              border: player1.photo ? '1px solid #cbd5e1' : 'none',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Upload size={13} />
                            <span>{player1.photo ? 'Replace Photo' : 'Select Photo *'}</span>
                          </button>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            {player1.photo ? 'Photo attached' : 'Required from laptop file picker'}
                          </div>
                        </div>
                      </div>

                      {/* Participant Details */}
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--color-navy-dark)', lineHeight: '1.2' }}>
                          {player1.name}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                          {player1.college}
                        </div>
                        {player1.participant_id && (
                          <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                            ID: {player1.participant_id}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', margin: '30px 0', color: '#94a3b8', fontSize: '13px' }}>
                      <ImageIcon size={32} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                      <div>No athlete selected</div>
                    </div>
                  )}
                </div>

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
                    width: '100%',
                    marginTop: '16px'
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
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '14px',
                alignSelf: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}>
                VS
              </div>

              {/* Player 2 Box */}
              <div style={{
                border: player2 ? (player2.photo ? '2px solid #0284c7' : '2px solid #f59e0b') : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                background: player2 ? '#f8fdfe' : '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      PLAYER 2 (MAT RIGHT)
                    </span>
                    {player2 && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: player2.photo ? '#dcfce7' : '#fef3c7',
                        color: player2.photo ? '#166534' : '#92400e'
                      }}>
                        {player2.photo ? 'PHOTO READY' : 'PHOTO REQUIRED'}
                      </span>
                    )}
                  </div>

                  {player2 ? (
                    <div>
                      {/* Photo Preview & Upload Section */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{
                          width: '76px',
                          height: '88px',
                          borderRadius: '8px',
                          backgroundColor: '#e2e8f0',
                          border: player2.photo ? '2px solid #0284c7' : '2px dashed #f59e0b',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          {player2.photo ? (
                            <img
                              src={player2.photo}
                              alt={player2.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center', color: '#f59e0b', padding: '4px' }}>
                              <Camera size={24} style={{ margin: '0 auto 2px' }} />
                              <span style={{ fontSize: '10px', fontWeight: 800, display: 'block' }}>NO PHOTO</span>
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputP2Ref}
                            style={{ display: 'none' }}
                            onChange={(e) => handlePhotoUpload('player2', e.target.files?.[0])}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputP2Ref.current?.click()}
                            disabled={compressing}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: player2.photo ? '#f1f5f9' : '#f59e0b',
                              color: player2.photo ? '#0f172a' : '#ffffff',
                              border: player2.photo ? '1px solid #cbd5e1' : 'none',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Upload size={13} />
                            <span>{player2.photo ? 'Replace Photo' : 'Select Photo *'}</span>
                          </button>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            {player2.photo ? 'Photo attached' : 'Required from laptop file picker'}
                          </div>
                        </div>
                      </div>

                      {/* Participant Details */}
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--color-navy-dark)', lineHeight: '1.2' }}>
                          {player2.name}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                          {player2.college}
                        </div>
                        {player2.participant_id && (
                          <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                            ID: {player2.participant_id}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', margin: '30px 0', color: '#94a3b8', fontSize: '13px' }}>
                      <ImageIcon size={32} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                      <div>No athlete selected</div>
                    </div>
                  )}
                </div>

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
                    width: '100%',
                    marginTop: '16px'
                  }}
                >
                  {player2 ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  <span>{player2 ? 'Change Player 2' : 'Add Player'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontSize: '12.5px', color: isReady ? '#16a34a' : '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isReady ? (
                <span>✓ Both athlete photos attached. Ready to queue.</span>
              ) : (
                <span>* Both athletes and their photos are strictly required.</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-modal-cancel" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="btn-modal-confirm"
                onClick={handleCreate}
                disabled={!isReady || compressing}
                style={{
                  opacity: isReady && !compressing ? 1 : 0.5,
                  cursor: isReady && !compressing ? 'pointer' : 'not-allowed'
                }}
              >
                <Plus size={16} /> Queue Matchup
              </button>
            </div>
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
