import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { VtuLogo, SambhramLogoGroup, JudoGrapplersIcon, BlackBeltBanner } from '../assets/logos';
import { Clock } from 'lucide-react';
import ConfettiCelebration from '../components/ConfettiCelebration';
import DefaultAvatar from '../components/DefaultAvatar';
import './DisplayPage.css';

export default function DisplayPage() {
  const {
    operatorCategory,
    currentFixture,
    nextFixtures,
    fixtures
  } = useTournament();

  // Live global real-time clock (updates every second)
  const [clock, setClock] = useState(() => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      });
    };
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const isCompleted = currentFixture?.status === 'COMPLETED';
  const isOngoing = currentFixture?.status === 'ONGOING';
  const winnerId = currentFixture?.winnerId;

  const isP1Winner = isCompleted && winnerId === currentFixture?.participant1?.id;
  const isP2Winner = isCompleted && winnerId === currentFixture?.participant2?.id;
  const winningParticipant = isP1Winner ? currentFixture?.participant1 : isP2Winner ? currentFixture?.participant2 : null;

  // Active category from operator control (Displayed ONLY for the Current Fixture)
  const displayGender = operatorCategory?.gender || "MEN";
  const displayWeight = operatorCategory?.weightCategory || "-73 KG";

  const hasFixtures = fixtures && fixtures.length > 0;

  // FULL-SCREEN WINNER CELEBRATION ACTIVE:
  // After operator declares winner, switch /display to full-screen winner celebration
  // Showing ONLY the winner with continuous confetti until operator clicks "SHOW NEXT FIXTURE"
  const showWinnerCelebration = hasFixtures && isCompleted && Boolean(winningParticipant);

  return (
    <div className="display-viewport" id="spectator-display-root">
      {/* Subtle Tatami rings watermark */}
      <div className="display-bg-rings" />
      <div className="display-bg-rings-left" />

      {/* CONTINUOUS LOOPING WINNER CELEBRATION CONFETTI (Active entire time celebration is displayed) */}
      {showWinnerCelebration && <ConfettiCelebration />}

      <main className="display-container">
        {/* Header Branding with Solid Black Logo Container */}
        <header className="display-header">
          <div className="display-black-logo-header">
            <div className="logo-box left">
              <VtuLogo height={82} />
            </div>
            <div className="display-black-logo-divider" />
            <div className="logo-box right">
              <SambhramLogoGroup height={82} />
            </div>
          </div>

          <div className="display-titles">
            <h1 className="display-main-title">
              VTU Intercollegiate State Level Judo Competition - 2026-27
            </h1>
            <div className="display-sub-title">SAMBHRAM INSTITUTE OF TECHNOLOGY</div>
          </div>

          {/* Real-Time Global Clock Capsule */}
          <div className="display-time-capsule" aria-label="Current real-time date and time">
            <Clock size={16} className="time-part" />
            <span className="time-part">{clock.time}</span>
            <span className="divider-dot">|</span>
            <span>{clock.date}</span>
          </div>
        </header>

        {/* 1. FULL-SCREEN WINNER CELEBRATION VIEW (SHOWS ONLY THE WINNER) */}
        {showWinnerCelebration ? (
          <section className="winner-celebration-screen" aria-label="Winner Celebration Screen">
            <div className="winner-celebration-badge">
              <span>👑</span>
              <span>MATCH WINNER</span>
              <span>👑</span>
            </div>

            {/* LARGE WINNER PHOTO */}
            <div className="winner-photo-large-frame">
              {winningParticipant?.photo ? (
                <img
                  src={winningParticipant.photo}
                  alt={winningParticipant.name}
                  className="winner-photo-large-img"
                />
              ) : (
                <DefaultAvatar size={110} />
              )}
            </div>

            {/* 👑 WINNER NAME */}
            <div className="winner-celebration-name">
              <span>👑</span>
              <span>{winningParticipant?.name}</span>
            </div>

            {/* COLLEGE NAME */}
            <div className="winner-celebration-college">
              {winningParticipant?.college}
            </div>

            {/* Category / Mat Pill Group */}
            <div className="winner-celebration-meta">
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>{displayGender}</span>
              <span>•</span>
              <span style={{ color: '#fbbf24', fontWeight: 800 }}>{displayWeight}</span>
              <span>•</span>
              <span style={{ color: '#ffffff', fontWeight: 800 }}>MAT 1</span>
            </div>
          </section>
        ) : hasFixtures && currentFixture ? (
          /* 2. STANDARD FIXTURE DISPLAY: CURRENT FIXTURE WITH PHOTOS ABOVE NAMES */
          <section className="current-match-card" aria-label="Current Judo Match">
            <div className="current-match-header">
              <div className="current-match-badge-title">
                CURRENT FIXTURE
              </div>

              <div className={`current-match-status-pill ${currentFixture?.status?.toLowerCase() || 'ongoing'}`}>
                {isOngoing && <span className="live-pulse-dot" />}
                {currentFixture?.status || 'ONGOING'}
              </div>
            </div>

            <div className="current-match-body">
              {/* Operator-controlled Category Bar: DISPLAYED ONLY ON CURRENT FIXTURE */}
              <div className="current-match-meta-bar">
                <div className="operator-category-pill-group">
                  <span className="category-gender-tag">{displayGender}</span>
                  <span className="category-weight-tag">{displayWeight}</span>
                </div>
                <div className="mat-pill">MAT 1</div>
              </div>

              {/* Contestants Split Box: PHOTO STRICTLY ABOVE NAME */}
              <div className="contestants-container">
                {/* Participant 1 */}
                <div className="contestant-card">
                  {/* [ PARTICIPANT PHOTO ] */}
                  <div className="contestant-photo-frame">
                    {currentFixture?.participant1?.photo ? (
                      <img
                        src={currentFixture.participant1.photo}
                        alt={currentFixture.participant1.name}
                        className="contestant-photo-img"
                      />
                    ) : (
                      <DefaultAvatar size={72} />
                    )}
                  </div>

                  {/* [ PARTICIPANT NAME ] */}
                  <div className="contestant-name">
                    {currentFixture?.participant1?.name || "Participant 1"}
                  </div>

                  {/* [ COLLEGE NAME ] */}
                  <div className="contestant-college">
                    {currentFixture?.participant1?.college || "College / Institution"}
                  </div>
                </div>

                {/* VS Badge */}
                <div className="vs-badge">VS</div>

                {/* Participant 2 */}
                <div className="contestant-card">
                  {/* [ PARTICIPANT PHOTO ] */}
                  <div className="contestant-photo-frame">
                    {currentFixture?.participant2?.photo ? (
                      <img
                        src={currentFixture.participant2.photo}
                        alt={currentFixture.participant2.name}
                        className="contestant-photo-img"
                      />
                    ) : (
                      <DefaultAvatar size={72} />
                    )}
                  </div>

                  {/* [ PARTICIPANT NAME ] */}
                  <div className="contestant-name">
                    {currentFixture?.participant2?.name || "Participant 2"}
                  </div>

                  {/* [ COLLEGE NAME ] */}
                  <div className="contestant-college">
                    {currentFixture?.participant2?.college || "College / Institution"}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Match Footer Banner */}
            <div className="current-match-footer">
              <div className="match-action-label">
                {isOngoing ? "Match in Progress" : "Match Scheduled"}
              </div>
              <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
                MAT 1 • RING 1
              </div>
            </div>
          </section>
        ) : (
          <section className="current-match-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase' }}>
              SESSION STANDBY
            </div>
            <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '15px' }}>
              Waiting for operator to queue matchups. Matches will appear here live.
            </p>
          </section>
        )}

        {/* 3-FIXTURE SYSTEM: UPCOMING FIXTURES (HIDDEN DURING WINNER CELEBRATION TO SHOW ONLY THE WINNER) */}
        {!showWinnerCelebration && (
          <section className="next-matches-section" aria-label="Upcoming Judo Matches">
            <div className="next-matches-title">
              UPCOMING FIXTURES
            </div>

            {nextFixtures && nextFixtures.length > 0 ? (
              <>
                {nextFixtures.map((fixture, idx) => (
                  <article key={fixture.id} className="next-match-card">
                    <div className="next-match-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="next-queue-order-badge">
                          {idx === 0 ? "NEXT" : "NEXT + 1"}
                        </span>
                      </div>
                      <span className="next-match-status">{fixture.status}</span>
                    </div>

                    <div className="next-match-participants">
                      {/* Upcoming Participant 1 */}
                      <div className="next-p-box">
                        <div className="next-p-photo-frame">
                          {fixture.participant1?.photo ? (
                            <img src={fixture.participant1.photo} alt={fixture.participant1.name} className="next-p-photo-img" />
                          ) : (
                            <DefaultAvatar size={34} />
                          )}
                        </div>
                        <div className="next-p-text-col">
                          <span className="next-p-name">{fixture.participant1?.name}</span>
                          <span className="next-p-college">{fixture.participant1?.college}</span>
                        </div>
                      </div>

                      <div className="next-vs-badge">VS</div>

                      {/* Upcoming Participant 2 */}
                      <div className="next-p-box right">
                        <div className="next-p-text-col right">
                          <span className="next-p-name">{fixture.participant2?.name}</span>
                          <span className="next-p-college">{fixture.participant2?.college}</span>
                        </div>
                        <div className="next-p-photo-frame">
                          {fixture.participant2?.photo ? (
                            <img src={fixture.participant2.photo} alt={fixture.participant2.name} className="next-p-photo-img" />
                          ) : (
                            <DefaultAvatar size={34} />
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                {/* If only 1 upcoming match exists, display next+1 placeholder */}
                {nextFixtures.length === 1 && (
                  <div className="next-match-card placeholder">
                    <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                      Awaiting next fixture in queue...
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="next-match-card" style={{ textAlign: 'center', padding: '18px', color: '#334e68' }}>
                {hasFixtures ? "Final fixture of the active queue" : "No upcoming fixtures queued"}
              </div>
            )}
          </section>
        )}

        {/* Footer with Black Belt Crest */}
        <footer className="display-footer">
          <BlackBeltBanner />
        </footer>
      </main>
    </div>
  );
}
