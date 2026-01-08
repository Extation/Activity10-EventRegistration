import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaTicketAlt, FaDownload } from 'react-icons/fa';
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

interface Registration {
  id: number;
  eventId: number;
  status: string;
  registeredAt: string;
}

interface Ticket {
  id: number;
  uuid: string;
  qrCode: string;
  status: string;
  verified: boolean;
  verifiedAt: string;
}

function App() {
  const [userId] = useState(Math.floor(Math.random() * 1000) + 1);
  const [userEmail] = useState(`user${userId}@example.com`);
  const [userName] = useState(`User ${userId}`);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [myTickets, setMyTickets] = useState<Map<number, Ticket>>(new Map());
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationForm, setRegistrationForm] = useState({ eventId: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
    loadMyRegistrations();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setAllEvents(response.data);
    } catch (error) {
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistrations = async () => {
    try {
      const response = await api.get(`/registrations/users/${userId}`);
      setMyRegistrations(response.data);

      // Load tickets for each registration
      const ticketMap = new Map();
      for (const reg of response.data) {
        try {
          const ticketResponse = await api.get(
            `/tickets/registration/${reg.id}`
          );
          ticketMap.set(reg.id, ticketResponse.data);
        } catch (error) {
          // Ticket might not exist yet
        }
      }
      setMyTickets(ticketMap);
    } catch (error) {
      // User might not have any registrations
    }
  };

  const handleRegisterForEvent = async () => {
    if (!selectedEvent) {
      alert('Please select an event');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/registrations/events/${selectedEvent.id}/register`,
        {
          userId,
          userEmail,
          userName,
        }
      );

      // Generate ticket
      await api.post('/tickets/generate', {
        eventId: selectedEvent.id,
        registrationId: response.data.id,
      });

      setSelectedEvent(null);
      loadEvents();
      loadMyRegistrations();
      setActiveTab('mytickets');
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          'Failed to register for event'
      );
    } finally {
      setLoading(false);
    }
  };

  const isRegisteredForEvent = (eventId: number) => {
    return myRegistrations.some(reg => reg.eventId === eventId);
  };

  const getRegistrationStatus = (eventId: number) => {
    const reg = myRegistrations.find(r => r.eventId === eventId);
    return reg?.status || 'not-registered';
  };

  const downloadTicket = (ticket: Ticket) => {
    const link = document.createElement('a');
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.uuid}.png`;
    link.click();
  };

  const getAvailableSeats = (event: Event) => {
    return event.capacity - event.registrationCount;
  };

  return (
    <div className="attendee-container">
      <header className="attendee-header">
        <div className="header-content">
          <h1>🎪 Event Ticketing Portal</h1>
          <div className="user-info">
            <p>Logged in as: <strong>{userName}</strong></p>
            <p>{userEmail}</p>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          📅 Browse Events
        </button>
        <button
          className={`tab ${activeTab === 'mytickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('mytickets')}
        >
          🎫 My Tickets ({myRegistrations.length})
        </button>
      </nav>

      <div className="content">
        {activeTab === 'browse' && (
          <div className="browse-section">
            <h2>Upcoming Events</h2>
            {loading ? (
              <p>Loading events...</p>
            ) : allEvents.length === 0 ? (
              <p>No events available.</p>
            ) : (
              <div className="events-grid">
                {allEvents.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <h3>{event.title}</h3>
                      {isRegisteredForEvent(event.id) && (
                        <span className="registered-badge">✓ Registered</span>
                      )}
                    </div>
                    <p className="description">{event.description}</p>

                    <div className="event-details">
                      <div className="detail-item">
                        <FaCalendar /> {event.date} at {event.time}
                      </div>
                      <div className="detail-item">
                        <FaMapMarkerAlt /> {event.location}
                      </div>
                      <div className="detail-item">
                        <FaUsers /> {getAvailableSeats(event)} seats available
                      </div>
                    </div>

                    <div className="capacity-bar">
                      <div
                        className="capacity-fill"
                        style={{
                          width: `${(event.registrationCount / event.capacity) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="capacity-text">
                      {event.registrationCount}/{event.capacity} registered
                    </p>

                    {isRegisteredForEvent(event.id) ? (
                      <button className="btn-registered" disabled>
                        ✓ Already Registered
                      </button>
                    ) : getAvailableSeats(event) <= 0 ? (
                      <button className="btn-disabled" disabled>
                        Event Full
                      </button>
                    ) : (
                      <button
                        className="btn-register"
                        onClick={() => {
                          setSelectedEvent(event);
                          handleRegisterForEvent();
                        }}
                        disabled={loading}
                      >
                        <FaTicketAlt /> Register Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mytickets' && (
          <div className="tickets-section">
            <h2>My Event Tickets</h2>
            {myRegistrations.length === 0 ? (
              <div className="empty-state">
                <FaTicketAlt className="empty-icon" />
                <p>You haven't registered for any events yet.</p>
                <p>Browse events and register to get your tickets!</p>
              </div>
            ) : (
              <div className="tickets-list">
                {myRegistrations.map(reg => {
                  const event = allEvents.find(e => e.id === reg.eventId);
                  const ticket = myTickets.get(reg.id);

                  return (
                    <div key={reg.id} className="ticket-card">
                      <div className="ticket-main">
                        <div className="ticket-info">
                          <h3>{event?.title || 'Event'}</h3>
                          <div className="ticket-details">
                            <p>
                              <FaCalendar /> {event?.date} at {event?.time}
                            </p>
                            <p>
                              <FaMapMarkerAlt /> {event?.location}
                            </p>
                            <p>Registered: {new Date(reg.registeredAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="ticket-status">
                          <span className={`status-badge ${reg.status}`}>
                            {reg.status.toUpperCase()}
                          </span>
                          {ticket?.verified && (
                            <span className="verified-badge">✓ Checked In</span>
                          )}
                        </div>
                      </div>

                      {ticket && (
                        <div className="qr-section">
                          <div className="qr-container">
                            <img
                              src={ticket.qrCode}
                              alt="QR Code"
                              className="qr-code"
                            />
                            <p className="ticket-uuid">{ticket.uuid.substring(0, 12)}...</p>
                          </div>
                          <button
                            className="btn-download"
                            onClick={() => downloadTicket(ticket)}
                          >
                            <FaDownload /> Download
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
