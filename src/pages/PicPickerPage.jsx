import React, { useState, useRef, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Search, ShieldCheck, Lock, LogOut } from 'lucide-react';
import DefaultAvatar from '../components/DefaultAvatar';
import { compressImageFile } from '../utils/imageUtils';
import './PicPickerPage.css';

// Configurable Shared Access Code for both PIC PICKER phones
const DEFAULT_PICK_CODE = "1234";
const CONFIGURED_ACCESS_CODE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PICK_ACCESS_CODE)
  ? String(import.meta.env.VITE_PICK_ACCESS_CODE)
  : DEFAULT_PICK_CODE;

export default function PicPickerPage() {
  const {
    fixtures,
    participants,
    currentFixture,
    updateParticipantPhoto,
    isPhotoReady,
    realtimeStatus,
    dbStatus
  } = useTournament();

  // Authentication State (Shared Access Code)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('PICK_AUTH') === 'true' || sessionStorage.getItem('PICK_AUTH') === 'true';
    } catch {
      return false;
    }
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // UI Filters: 'all-fixtures' | 'needs-photo' | 'all-athletes'
  const [activeFilter, setActiveFilter] = useState('all-fixtures');
  const [searchQuery, setSearchQuery] = useState('');

  // Uploading / Retaking status tracked per participantId: 'UPLOADING' | 'RETAKING'
  const [uploadStatusMap, setUploadStatusMap] = useState({});

  // Hidden camera input refs
  const cameraInputRef = useRef(null);
  const activeParticipantIdRef = useRef(null);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (passcode.trim() === CONFIGURED_ACCESS_CODE) {
      try {
        localStorage.setItem('PICK_AUTH', 'true');
        sessionStorage.setItem('PICK_AUTH', 'true');
      } catch {}
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect Access Code. Please enter the 4-digit code.');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('PICK_AUTH');
      sessionStorage.removeItem('PICK_AUTH');
    } catch {}
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Trigger camera capture for a participant
  const handleTriggerCapture = (participantId, isRetake = false) => {
    activeParticipantIdRef.current = String(participantId);
    setUploadStatusMap(prev => ({
      ...prev,
      [participantId]: isRetake ? 'RETAKING' : 'UPLOADING'
    }));

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  // Process captured image from camera/gallery
  const handleCameraFileChange = async (e) => {
    const file = e.target.files?.[0];
    const targetId = activeParticipantIdRef.current;
    if (!file || !targetId) {
      if (targetId) {
        setUploadStatusMap(prev => {
          const copy = { ...prev };
          delete copy[targetId];
          return copy;
        });
      }
      return;
    }

    try {
      setUploadStatusMap(prev => ({ ...prev, [targetId]: 'UPLOADING' }));
      // Compress preserving facial detail for spectator screens
      const compressedDataUrl = await compressImageFile(file, 720, 720, 0.85);

      // Persist across shared multi-tier architecture
      updateParticipantPhoto(targetId, compressedDataUrl);

      setUploadStatusMap(prev => {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      });
    } catch (err) {
      console.error('Camera capture error:', err);
      alert('Could not process photo: ' + (err.message || 'Image processing error'));
      setUploadStatusMap(prev => {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      });
    }
  };

  // Group all fixtures created by Main Operator (ALL upcoming, ongoing, completed)
  // Allows PIC PICKERS to photograph players several fixtures ahead!
  const sortedFixtures = [...fixtures];

  // Helper to find latest participant record from registered dataset
  const getParticipantDetails = (pSummary) => {
    if (!pSummary) return null;
    const pId = String(pSummary.id || pSummary.participant_id);
    const registered = participants.find(p => String(p.participant_id) === pId || String(p.id) === pId);
    return {
      id: pId,
      name: registered?.name || pSummary.name || 'Athlete',
      college: registered?.college || pSummary.college || '',
      photo: registered?.photo || pSummary.photo || null
    };
  };

  // Render Passcode Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="pic-auth-screen">
        <div className="pic-auth-card">
          <div className="pic-auth-badge">
            <ShieldCheck size={14} />
            <span>PICK ACCESS CONTROL</span>
          </div>

          <h1 className="pic-auth-title">PIC PICKER</h1>
          <p className="pic-auth-subtitle">
            VTU Judo Tournament &bull; Mat 1<br />
            Enter shared access code to begin photo collection.
          </p>

          {authError && (
            <div style={{ padding: '8px 12px', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5', fontSize: '12px', marginBottom: '14px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div className="pic-pin-input-wrap">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;"
                className="pic-pin-input"
                autoFocus
                required
              />
            </div>

            <button type="submit" className="pic-btn-unlock">
              <Lock size={18} />
              <span>Unlock PIC Mode</span>
            </button>
          </form>

          <div style={{ marginTop: '18px', fontSize: '11px', color: '#64748b' }}>
            Shared code for both PIC PICKER phones. Default: <code>1234</code>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalAthletes = participants.length;
  const readyAthletes = participants.filter(p => isPhotoReady(p)).length;

  return (
    <div className="pic-picker-layout">
      {/* Hidden Universal Camera Capture Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleCameraFileChange}
      />

      {/* Sticky Header */}
      <header className="pic-header">
        <div className="pic-header-top">
          <div className="pic-brand">
            <span className="pic-brand-pill">MAT 1</span>
            <span className="pic-brand-title">PIC PICKER</span>
          </div>

          <div className="pic-header-actions">
            <div className="pic-status-pill">
              <span className="pic-dot-pulse" />
              <span>SYNC LIVE</span>
            </div>

            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              title="Lock PIC PICKER"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Controls: Search and Filter Pills */}
        <div className="pic-controls-row">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search athlete by name or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pic-search-input"
            />
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div className="pic-filter-pills">
            <button
              className={`pic-filter-btn ${activeFilter === 'all-fixtures' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all-fixtures')}
            >
              Fixture Queue ({sortedFixtures.length})
            </button>
            <button
              className={`pic-filter-btn ${activeFilter === 'needs-photo' ? 'active' : ''}`}
              onClick={() => setActiveFilter('needs-photo')}
            >
              Needs Photo ({Math.max(0, totalAthletes - readyAthletes)})
            </button>
            <button
              className={`pic-filter-btn ${activeFilter === 'all-athletes' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all-athletes')}
            >
              All Athletes ({totalAthletes})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pic-content">
        {/* TAB 1 & 2: FIXTURE QUEUE (ALL FIXTURES CREATED BY OPERATOR) */}
        {activeFilter === 'all-fixtures' && (
          <div>
            {sortedFixtures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: '#1e293b', borderRadius: '12px', color: '#94a3b8', border: '1px dashed #334155' }}>
                <Camera size={36} color="#0284c7" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                  No Fixtures Queued
                </div>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>
                  Waiting for the Main Operator to queue matchups. Switch to &ldquo;All Athletes&rdquo; to take photos early.
                </p>
              </div>
            ) : (
              sortedFixtures.map((fixture, fIdx) => {
                const isCurrent = fixture.id === currentFixture?.id;
                const p1 = getParticipantDetails(fixture.participant1);
                const p2 = getParticipantDetails(fixture.participant2);

                // Check search match
                const q = searchQuery.toLowerCase().trim();
                if (q) {
                  const match1 = p1 && ((p1.name && p1.name.toLowerCase().includes(q)) || (p1.college && p1.college.toLowerCase().includes(q)));
                  const match2 = p2 && ((p2.name && p2.name.toLowerCase().includes(q)) || (p2.college && p2.college.toLowerCase().includes(q)));
                  if (!match1 && !match2) return null;
                }

                return (
                  <div key={fixture.id} className="pic-fixture-group">
                    <div className="pic-fixture-header">
                      <span className={`pic-fixture-tag ${isCurrent ? 'current' : fIdx === 1 ? 'next' : 'queued'}`}>
                        {isCurrent ? '● CURRENT FIXTURE' : fIdx === 1 ? 'NEXT FIXTURE' : `MATCHUP #${fIdx + 1}`}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                        {fixture.status}
                      </span>
                    </div>

                    {/* Participant 1 Card */}
                    {p1 && (
                      <ParticipantPickCard
                        participant={p1}
                        uploadStatus={uploadStatusMap[p1.id]}
                        isReady={isPhotoReady(p1)}
                        onCapture={() => handleTriggerCapture(p1.id, false)}
                        onRetake={() => handleTriggerCapture(p1.id, true)}
                      />
                    )}

                    {/* Participant 2 Card */}
                    {p2 && (
                      <ParticipantPickCard
                        participant={p2}
                        uploadStatus={uploadStatusMap[p2.id]}
                        isReady={isPhotoReady(p2)}
                        onCapture={() => handleTriggerCapture(p2.id, false)}
                        onRetake={() => handleTriggerCapture(p2.id, true)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ATHLETES NEEDING PHOTOS */}
        {activeFilter === 'needs-photo' && (
          <div>
            {participants.filter(p => !isPhotoReady(p)).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: '#1e293b', borderRadius: '12px', color: '#4ade80', border: '1px solid #059669' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                  All Photos Completed!
                </div>
                <p style={{ fontSize: '13px', marginTop: '6px', color: '#94a3b8' }}>
                  Every registered participant currently has a valid photo.
                </p>
              </div>
            ) : (
              participants
                .filter(p => !isPhotoReady(p))
                .filter(p => {
                  const q = searchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.college && p.college.toLowerCase().includes(q))
                  );
                })
                .map(p => (
                  <ParticipantPickCard
                    key={p.participant_id || p.id}
                    participant={p}
                    uploadStatus={uploadStatusMap[p.participant_id || p.id]}
                    isReady={false}
                    onCapture={() => handleTriggerCapture(p.participant_id || p.id, false)}
                    onRetake={() => handleTriggerCapture(p.participant_id || p.id, true)}
                  />
                ))
            )}
          </div>
        )}

        {/* TAB 3: ALL REGISTERED ATHLETES */}
        {activeFilter === 'all-athletes' && (
          <div>
            {participants
              .filter(p => {
                const q = searchQuery.toLowerCase().trim();
                if (!q) return true;
                return (
                  (p.name && p.name.toLowerCase().includes(q)) ||
                  (p.college && p.college.toLowerCase().includes(q))
                );
              })
              .map(p => {
                const ready = isPhotoReady(p);
                const pId = p.participant_id || p.id;
                return (
                  <ParticipantPickCard
                    key={pId}
                    participant={p}
                    uploadStatus={uploadStatusMap[pId]}
                    isReady={ready}
                    onCapture={() => handleTriggerCapture(pId, false)}
                    onRetake={() => handleTriggerCapture(pId, true)}
                  />
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Reusable Participant Card inside PIC PICKER Mode
 */
function ParticipantPickCard({
  participant,
  uploadStatus,
  isReady,
  onCapture,
  onRetake
}) {
  const isUploading = uploadStatus === 'UPLOADING';
  const isRetaking = uploadStatus === 'RETAKING';

  return (
    <div className={`pic-participant-card ${isReady ? 'ready' : ''} ${isUploading ? 'uploading' : ''}`}>
      <div className="pic-p-left">
        <div className={`pic-p-photo-thumb ${isReady ? 'ready' : ''}`}>
          {isReady && participant.photo ? (
            <img src={participant.photo} alt={participant.name} />
          ) : (
            <DefaultAvatar size={58} />
          )}
        </div>

        <div className="pic-p-info">
          <div className="pic-p-name">{participant.name}</div>
          <div className="pic-p-college">{participant.college}</div>

          {/* Photo Status Pill */}
          {isUploading ? (
            <span className="pic-status-text-pill uploading">
              <RefreshCw size={11} className="animate-spin" />
              <span>Uploading Photo...</span>
            </span>
          ) : isRetaking ? (
            <span className="pic-status-text-pill uploading">
              <RefreshCw size={11} className="animate-spin" />
              <span>Retaking...</span>
            </span>
          ) : isReady ? (
            <span className="pic-status-text-pill ready">
              <CheckCircle2 size={12} />
              <span>✓ Photo captured</span>
            </span>
          ) : (
            <span className="pic-status-text-pill missing">
              <AlertCircle size={12} />
              <span>No Photo</span>
            </span>
          )}
        </div>
      </div>

      <div className="pic-action-col">
        {isReady ? (
          <button
            type="button"
            className="pic-btn-retake"
            onClick={onRetake}
            disabled={isUploading}
          >
            <RefreshCw size={13} />
            <span>Retake Photo</span>
          </button>
        ) : (
          <button
            type="button"
            className="pic-btn-capture"
            onClick={onCapture}
            disabled={isUploading}
          >
            <Camera size={15} />
            <span>Take Photo</span>
          </button>
        )}
      </div>
    </div>
  );
}
