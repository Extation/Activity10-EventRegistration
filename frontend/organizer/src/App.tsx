import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlus, FaQrcode, FaCheck, FaList, FaCamera } from 'react-icons/fa';
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
  const [isScanning, setIsScanning] = useState(false);
  const [manualUUID, setManualUUID] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [checkedIn, setCheckedIn] = useState<number[]>([]);
  const cameraRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      alert('Failed to load events');
    }
  };

  const loadEventDetails = async (event: Event) => {
    try {
      setSelectedEvent(event);
      const [regResponse, ticketResponse] = await Promise.all([
        api.get(`/registrations/events/${event.id}`),
        api.get(`/tickets/events/${event.id}`),
      ]);
      setRegistrations(regResponse.data);
      setTickets(ticketResponse.data);
      setCheckedIn(ticketResponse.data.filter((t: Ticket) => t.verified).map((t: Ticket) => t.id));
    } catch (error) {
      alert('Failed to load event details');
    }
  };

  const handleManualVerification = async () => {
    if (!manualUUID.trim()) {
      alert('Please enter a UUID or scan a QR code');
      return;
    }

    try {
      const response = await api.post('/tickets/verify', { uuid: manualUUID });
      setScanResult(response.data);
      setCheckedIn([...checkedIn, response.data.id]);
      setManualUUID('');
      
      // Refresh ticket list
      if (selectedEvent) {
        const ticketResponse = await api.get(`/tickets/events/${selectedEvent.id}`);
        setTickets(ticketResponse.data);
      }

      // Clear result after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Invalid ticket or already checked in');
      setManualUUID('');
    }
  };

  const exportAttendees = () => {
    if (!selectedEvent || registrations.length === 0) {
      alert('No attendees to export');
      return;
    }

    const csv = [
      ['Name', 'Email', 'Registration Time', 'Status', 'Checked In'],
      ...registrations.map(reg => [
        reg.userName,
        reg.userEmail,
        new Date(reg.registeredAt).toLocaleString(),
        reg.status,
        checkedIn.length > 0 ? 'Yes' : 'No',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendees-${selectedEvent.id}.csv`;
    link.click();
  };

  return (
    <div className="organizer-container">
      <header className="organizer-header">
        <h1>📊 Organizer Dashboard - Check-In Scanner</h1>
      </header>

      <div className="main-content">
        <div className="events-panel">
          <h2>Your Events</h2>
          <div className="events-list">
            {events.length === 0 ? (
              <p>No events created yet.</p>
            ) : (
              events.map(event => (
                <div
                  key={event.id}
                  className={`event-item ${selectedEvent?.id === event.id ? 'active' : ''}`}
                  onClick={() => loadEventDetails(event)}
                >
                  <h3>{event.title}</h3>
                  <p className="date">{event.date} at {event.time}</p>
                  <div className="attendance-stat">
                    <span className="checked">{checkedIn.length}</span> / {event.registrationCount}
                    <span className="label">Checked In</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedEvent && (
          <div className="organizer-content">
            <div className="scanner-section">
              <h2>🎫 Ticket Scanner - {selectedEvent.title}</h2>

              <div className="scanner-input">
                <input
                  type="text"
                  placeholder="Enter UUID or scan QR code"
                  value={manualUUID}
                  onChange={e => setManualUUID(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') handleManualVerification();
                  }}
                  className="uuid-input"
                />
                <button onClick={handleManualVerification} className="btn-scan">
                  <FaCheck /> Verify Ticket
                </button>
              </div>

              {scanResult && (
                <div className={`scan-result ${scanResult.verified ? 'success' : 'error'}`}>
                  <div className="result-content">
                    {scanResult.verified ? (
                      <>
                        <FaCheck className="result-icon" />
                        <h3>✓ Ticket Verified!</h3>
                        <p>UUID: {scanResult.uuid.substring(0, 8)}...</p>
                      </>
                    ) : (
                      <p>Failed to verify ticket</p>
                    )}
                  </div>
                </div>
              )}

              <div className="attendance-summary">
                <div className="summary-stat">
                  <h3>Total Registered</h3>
                  <p className="big-number">{registrations.length}</p>
                </div>
                <div className="summary-stat">
                  <h3>Checked In</h3>
                  <p className="big-number highlight">{checkedIn.length}</p>
                </div>
                <div className="summary-stat">
                  <h3>Remaining</h3>
                  <p className="big-number">{registrations.length - checkedIn.length}</p>
                </div>
              </div>
            </div>

            <div className="attendees-section">
              <div className="section-header">
                <h2><FaList /> Registered Attendees</h2>
                <button onClick={exportAttendees} className="btn-export">
                  Export CSV
                </button>
              </div>

              {registrations.length === 0 ? (
                <p>No registrations yet.</p>
              ) : (
                <div className="attendees-list">
                  {registrations.map((reg, idx) => (
                    <div key={reg.id} className="attendee-item">
                      <div className="attendee-info">
                        <h4>{reg.userName}</h4>
                        <p>{reg.userEmail}</p>
                        <p className="time">{new Date(reg.registeredAt).toLocaleString()}</p>
                      </div>
                      <div className="attendee-status">
                        {checkedIn.includes(idx + 1) ? (
                          <span className="badge-checked">✓ Checked In</span>
                        ) : (
                          <span className="badge-pending">⏳ Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
