import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheck, FaFileExport, FaCalendar, FaUsers } from 'react-icons/fa';
import './App.css';

const API_BASE_URL = 'http://localhost:3005';
const api = axios.create({ baseURL: API_BASE_URL });

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  registrationCount: number;
  status: string;
}

interface Ticket {
  id: number;
  uuid: string;
  qrCode: string;
  status: string;
  verified: boolean;
  verifiedAt: string | null;
}

interface Registration {
  id: number;
  userName: string;
  userEmail: string;
  registeredAt: string;
  status: string;
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [manualUUID, setManualUUID] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [verifiedTickets, setVerifiedTickets] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
      if (response.data.length > 0 && !selectedEvent) {
        loadEventDetails(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load events', error);
    }
  };

  const loadEventDetails = async (event: Event) => {
    try {
      setSelectedEvent(event);
      setLoading(true);
      
      const [regResponse, ticketResponse] = await Promise.all([
        api.get(`/registrations/events/${event.id}`),
        api.get(`/tickets/events/${event.id}`),
      ]);
      
      setRegistrations(regResponse.data);
      setTickets(ticketResponse.data);
      
      // Track verified tickets
      const verified = new Set(
        ticketResponse.data
          .filter((t: Ticket) => t.verified)
          .map((t: Ticket) => t.id)
      );
      setVerifiedTickets(verified);
    } catch (error) {
      console.error('Failed to load event details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = async () => {
    if (!manualUUID.trim()) {
      alert('⚠️ Please enter a valid ticket UUID to proceed.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/tickets/verify', { uuid: manualUUID.trim() });
      setScanResult({ success: true, data: response.data });
      
      // Add to verified set
      setVerifiedTickets(prev => new Set<number>([...prev, response.data.id]));
      
      setManualUUID('');
      
      // Refresh ticket list
      if (selectedEvent) {
        const ticketResponse = await api.get(`/tickets/events/${selectedEvent.id}`);
        setTickets(ticketResponse.data);
      }

      // Clear result after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    } catch (error: any) {
      setScanResult({ 
        success: false, 
        message: error.response?.data?.message || '❌ Verification failed: Invalid ticket or already checked in.' 
      });
      setTimeout(() => setScanResult(null), 3000);
      setManualUUID('');
    } finally {
      setLoading(false);
    }
  };

  const exportAttendees = () => {
    if (!selectedEvent || registrations.length === 0) {
      alert('📊 No attendee data available to export for this event.');
      return;
    }

    const csv = [
      ['Name', 'Email', 'Registration Time', 'Status', 'Checked In'],
      ...registrations.map((reg, idx) => {
        const ticket = tickets.find(t => t.id === idx + 1);
        return [
          reg.userName,
          reg.userEmail,
          new Date(reg.registeredAt).toLocaleString(),
          reg.status,
          ticket?.verified ? 'Yes' : 'No',
        ];
      }),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendees-${selectedEvent.title.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    link.click();
  };

  const getCheckedInCount = () => {
    return tickets.filter(t => t.verified).length;
  };

  const getRemainingCount = () => {
    return registrations.length - getCheckedInCount();
  };

  const isTicketVerified = (registrationId: number) => {
    const ticket = tickets.find(t => t.id === registrationId);
    return ticket?.verified || false;
  };

  return (
    <div className="organizer-container">
      <header className="organizer-header">
        <div className="header-icon"></div>
        <h1>Organizer Dashboard - Check-In Scanner</h1>
      </header>

      <div className="main-layout">
        {/* Sidebar with Events */}
        <aside className="events-sidebar">
          <h2>Your Events</h2>
          <div className="events-list">
            {events.length === 0 ? (
              <div className="no-events">
                <p>No events available</p>
              </div>
            ) : (
              events.map(event => (
                <div
                  key={event.id}
                  className={`event-card ${selectedEvent?.id === event.id ? 'active' : ''}`}
                  onClick={() => loadEventDetails(event)}
                >
                  <h3>{event.title}</h3>
                  <p className="event-date">
                    <FaCalendar /> {event.date} at {event.time}
                  </p>
                  <div className="event-stats">
                    <span className="checked-count">
                      {selectedEvent?.id === event.id ? getCheckedInCount() : 0}
                    </span>
                    <span className="separator">/</span>
                    <span className="total-count">{event.registrationCount}</span>
                    <span className="label">Checked In</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {selectedEvent ? (
            <>
              {/* Scanner Section */}
              <section className="scanner-section">
                <h2>
                  <span className="section-icon"></span>
                  Ticket Scanner - {selectedEvent.title}
                </h2>

                <div className="scanner-input-group">
                  <input
                    type="text"
                    placeholder="Enter UUID or scan QR code"
                    value={manualUUID}
                    onChange={e => setManualUUID(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') handleManualVerification();
                    }}
                    className="uuid-input"
                    disabled={loading}
                  />
                  <button 
                    onClick={handleManualVerification} 
                    className="btn-verify"
                    disabled={loading || !manualUUID.trim()}
                  >
                    <FaCheck /> Verify Ticket
                  </button>
                </div>

                {scanResult && (
                  <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                    {scanResult.success ? (
                      <div className="result-content">
                        <div className="success-icon">✓</div>
                        <div className="result-text">
                          <h3>Ticket Verified!</h3>
                          <p>Successfully checked in</p>
                        </div>
                      </div>
                    ) : (
                      <div className="result-content">
                        <div className="error-icon">✗</div>
                        <div className="result-text">
                          <h3>Verification Failed</h3>
                          <p>{scanResult.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics Cards */}
                <div className="stats-grid">
                  <div className="stat-card total">
                    <h3>Total Registered</h3>
                    <p className="stat-number">{registrations.length}</p>
                  </div>
                  <div className="stat-card checked">
                    <h3>Checked In</h3>
                    <p className="stat-number highlight">{getCheckedInCount()}</p>
                  </div>
                  <div className="stat-card remaining">
                    <h3>Remaining</h3>
                    <p className="stat-number">{getRemainingCount()}</p>
                  </div>
                </div>
              </section>

              {/* Attendees List */}
              <section className="attendees-section">
                <div className="section-header">
                  <h2>
                    <span className="section-icon">≡</span>
                    Registered Attendees
                  </h2>
                  <button 
                    onClick={exportAttendees} 
                    className="btn-export"
                    disabled={registrations.length === 0}
                  >
                    <FaFileExport /> Export CSV
                  </button>
                </div>

                {loading ? (
                  <div className="loading">Loading attendees...</div>
                ) : registrations.length === 0 ? (
                  <div className="no-attendees">
                    <FaUsers className="empty-icon" />
                    <p>No registrations yet</p>
                  </div>
                ) : (
                  <div className="attendees-list">
                    {registrations.map((reg, idx) => {
                      const ticket = tickets[idx];
                      const verified = ticket?.verified || false;
                      
                      return (
                        <div key={reg.id} className="attendee-card">
                          <div className="attendee-info">
                            <h4>{reg.userName}</h4>
                            <p className="email">{reg.userEmail}</p>
                            <p className="timestamp">
                              {new Date(reg.registeredAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="attendee-status">
                            {verified ? (
                              <span className="status-badge checked">
                                ✓ Checked In
                              </span>
                            ) : (
                              <span className="status-badge pending">
                                ⏳ Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="no-selection">
              <FaCalendar className="empty-icon" />
              <h2>No Event Selected</h2>
              <p>Select an event from the sidebar to view details</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
