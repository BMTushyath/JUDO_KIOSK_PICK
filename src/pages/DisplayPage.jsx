import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { VtuLogo, SambhramLogoGroup, JudoGrapplersIcon, BlackBeltBanner } from '../assets/logos';
import { Clock } from 'lucide-react';
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

  // Active category from operator control (Displayed ONLY for the Current Fixture)
  const displayGender = operatorCategory?.gender || "MEN";
  const displayWeight = operatorCategory?.weightCategory || "-73 KG";

  const hasFixtures = fixtures && fixtures.length > 0;

  return (
    <div className="display-viewport" id="spectator-display-root">
      {/* Subtle Tatami rings watermark */}
      <div className="display-bg-rings" />
      <div className="display-bg-rings-left" />

      <main className="display-container">
        {/* Header Branding with Solid Black Logo Container */}
        <header className="display-header">
          <div className="display-black-logo-header">
            <div className="logo-box left">
              <VtuLogo height={72} />
            </div>
            <div className="display-black-logo-divider" />
            <div className="logo-box right">
              <SambhramLogoGroup height={46} />
            </div>
          </div>

          <div className="display-titles">
            <h1 className="display-main-title">
              VTU Intercollegiate State Level Judo Competition and Selection Trials- 2026-27
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

        {/* DOMINANT HERO: CURRENT FIXTURE ONLY GETS GENDER + WEIGHT */}
        {hasFixtures && currentFixture ? (
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

              {/* Contestants Split Box */}
              <div className="contestants-container">
                {/* Participant 1 */}
                <div className={`contestant-card ${isP1Winner ? 'winner' : ''}`}>
                  {isP1Winner && (
                    <div className="winner-crown-badge">
                      <span>👑</span>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase' }}>WINNER</span>
                    </div>
                  )}
                  <div className="contestant-name">
                    {currentFixture?.participant1?.name || "Participant 1"}
                  </div>
                  <div className="contestant-college">
                    {currentFixture?.participant1?.college || "College / Institution"}
                  </div>
                  <div className="contestant-icon">
                    <JudoGrapplersIcon color="#0A192F" size={54} />
                  </div>
                </div>

                {/* VS Badge */}
                <div className="vs-badge">VS</div>

                {/* Participant 2 */}
                <div className={`contestant-card ${isP2Winner ? 'winner' : ''}`}>
                  {isP2Winner && (
                    <div className="winner-crown-badge">
                      <span>👑</span>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase' }}>WINNER</span>
                    </div>
                  )}
                  <div className="contestant-name">
                    {currentFixture?.participant2?.name || "Participant 2"}
                  </div>
                  <div className="contestant-college">
                    {currentFixture?.participant2?.college || "College / Institution"}
                  </div>
                  <div className="contestant-icon">
                    <JudoGrapplersIcon color="#0A192F" size={54} />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Match Footer Banner */}
            <div className="current-match-footer">
              {isOngoing ? (
                <div className="match-action-label">
                  Match in Progress
                </div>
              ) : isCompleted ? (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="match-winner-highlight">
                    Winner: {isP1Winner ? currentFixture?.participant1?.name : currentFixture?.participant2?.name}
                  </div>
                  <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px' }}>
                    MATCH COMPLETED
                  </div>
                </div>
              ) : (
                <div className="match-action-label">
                  Match Scheduled
                </div>
              )}
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

        {/* 3-FIXTURE SYSTEM: NEXT TWO FIXTURES (DO NOT INHERIT GENDER / WEIGHT) */}
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
                    <div className="next-p-box">
                      <span className="next-p-name">{fixture.participant1?.name}</span>
                      <span className="next-p-college">{fixture.participant1?.college}</span>
                    </div>
                    <div className="next-vs-badge">VS</div>
                    <div className="next-p-box right">
                      <span className="next-p-name">{fixture.participant2?.name}</span>
                      <span className="next-p-college">{fixture.participant2?.college}</span>
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

        {/* Footer with Black Belt Crest */}
        <footer className="display-footer">
          <BlackBeltBanner />
        </footer>
      </main>
    </div>
  );
}
