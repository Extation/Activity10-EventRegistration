import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaTicketAlt, FaDownload, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import './App.css';

const API_BASE_URL = 'http://localhost:3005';

// Create axios instance with interceptor
const api = axios.create({ baseURL: API_BASE_URL });

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('attendeeToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('attendeeToken');
      localStorage.removeItem('attendeeUser');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

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
  userName: string;
  userEmail: string;
}

interface Ticket {
  id: number;
  uuid: string;
  qrCode: string;
  status: string;
  verified: boolean;
  verifiedAt: string;
}

interface RegistrationFormData {
  name: string;
  email: string;
  company: string;
}

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });

  // Main app state
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [myTickets, setMyTickets] = useState<Map<number, Ticket>>(new Map());
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationFormData, setRegistrationFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    company: '',
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('attendeeToken');
    const userStr = localStorage.getItem('attendeeUser');
    if (token && userStr) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userStr));
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    await Promise.all([loadEvents(), loadMyRegistrations()]);
  };

  // Authentication functions
  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', loginForm);
      const { access_token, user } = response.data;
      
      localStorage.setItem('attendeeToken', access_token);
      localStorage.setItem('attendeeUser', JSON.stringify(user));
      
      setIsAuthenticated(true);
      setCurrentUser(user);
      setLoginForm({ email: '', password: '' });
      
      await loadInitialData();
    } catch (error: any) {
      alert(error.response?.data?.message || '❌ Authentication failed. Please verify your credentials.');
    }
  };

  const handleRegister = async () => {
    try {
      await api.post('/auth/register', registerForm);
      alert('Registration successful! Please login.');
      setShowLogin(true);
      setRegisterForm({ email: '', password: '', name: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || '❌ Registration failed. Please try again later.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('attendeeToken');
    localStorage.removeItem('attendeeUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAllEvents([]);
    setMyRegistrations([]);
    setMyTickets(new Map());
  };

  // Data loading functions
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setAllEvents(response.data);
    } catch (error) {
      console.error('Failed to load events', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistrations = async () => {
    if (!currentUser) return;
    try {
      const response = await api.get(`/registrations/users/${currentUser.id}`);
      setMyRegistrations(response.data);

      // Load tickets for each registration
      const ticketMap = new Map();
      for (const reg of response.data) {
        try {
          const ticketResponse = await api.get(`/tickets/registration/${reg.id}`);
          ticketMap.set(reg.id, ticketResponse.data);
        } catch (error) {
          // Ticket might not exist yet
        }
      }
      setMyTickets(ticketMap);
    } catch (error) {
      console.error('Failed to load registrations', error);
    }
  };

  // Registration functions
  const openRegistrationModal = (event: Event) => {
    setSelectedEvent(event);
    setRegistrationFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      company: '',
    });
    setShowRegistrationModal(true);
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setSelectedEvent(null);
    setRegistrationFormData({ name: '', email: '', company: '' });
  };

  const handleSubmitRegistration = async () => {
    if (!selectedEvent || !currentUser) return;

    if (!registrationFormData.name || !registrationFormData.email) {
      alert('📝 Please provide both your name and email address to complete registration.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationFormData.email)) {
      alert('✉️ Please provide a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/registrations/events/${selectedEvent.id}/register`,
        {
          userId: currentUser.id,
          userEmail: registrationFormData.email,
          userName: registrationFormData.name,
        }
      );

      // Generate ticket
      await api.post('/tickets/generate', {
        eventId: selectedEvent.id,
        registrationId: response.data.id,
      });

      alert(`🎉 Success! You've been registered for ${selectedEvent.title}. Check your tickets!`);
      closeRegistrationModal();
      await loadEvents();
      await loadMyRegistrations();
      setActiveTab('mytickets');
    } catch (error: any) {
      alert(error.response?.data?.message || '❌ Unable to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: number, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) {
      return;
    }

    try {
      await api.delete(`/registrations/${registrationId}`);
      alert('✅ Your registration has been cancelled successfully.');
      await loadEvents();
      await loadMyRegistrations();
    } catch (error: any) {
      alert(error.response?.data?.message || '❌ Unable to cancel registration. Please try again.');
    }
  };

  const isRegisteredForEvent = (eventId: number) => {
    return myRegistrations.some(reg => reg.eventId === eventId);
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

  // Filter events
  const filteredEvents = allEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Login/Register UI
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Event Ticketing Portal</h1>
          <div className="auth-tabs">
            <button
              className={showLogin ? 'active' : ''}
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
            <button
              className={!showLogin ? 'active' : ''}
              onClick={() => setShowLogin(false)}
            >
              Register
            </button>
          </div>

          {showLogin ? (
            <div className="auth-form">
              <h2>Login</h2>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button onClick={handleLogin} className="btn-primary">
                Login
              </button>
              <p className="auth-hint">
                Don't have an account? Click Register above.
              </p>
            </div>
          ) : (
            <div className="auth-form">
              <h2>Register</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={registerForm.name}
                onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
              />
              <button onClick={handleRegister} className="btn-primary">
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main App UI
  return (
    <div className="attendee-container">
      <header className="attendee-header">
        <div className="header-content">
          <h1>Event Ticketing Portal</h1>
          <div className="user-info">
            <p>Welcome, <strong>{currentUser?.name}</strong></p>
            <p>{currentUser?.email}</p>
            <button onClick={handleLogout} className="btn-logout">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('browse');
            setSearchTerm('');
          }}
        >
          Browse Events
        </button>
        <button
          className={`tab ${activeTab === 'mytickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('mytickets')}
        >
          My Tickets ({myRegistrations.length})
        </button>
      </nav>

      <div className="content">
        {activeTab === 'browse' && (
          <div className="browse-section">
            <div className="browse-header">
              <h2>Upcoming Events</h2>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {loading ? (
              <p>Loading events...</p>
            ) : filteredEvents.length === 0 ? (
              <p>No events found.</p>
            ) : (
              <div className="events-grid">
                {filteredEvents.map(event => (
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
                        onClick={() => openRegistrationModal(event)}
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
                            <p><strong>Name:</strong> {reg.userName}</p>
                            <p><strong>Email:</strong> {reg.userEmail}</p>
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
                          <div className="ticket-actions">
                            <button
                              className="btn-download"
                              onClick={() => downloadTicket(ticket)}
                            >
                              <FaDownload /> Download
                            </button>
                            {!ticket.verified && (
                              <button
                                className="btn-cancel"
                                onClick={() => handleCancelRegistration(reg.id, event?.title || 'Event')}
                              >
                                <FaTimes /> Cancel Registration
                              </button>
                            )}
                          </div>
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

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeRegistrationModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register for Event</h2>
              <button className="modal-close" onClick={closeRegistrationModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <h3>{selectedEvent.title}</h3>
              <p className="event-info">
                <FaCalendar /> {selectedEvent.date} at {selectedEvent.time}
              </p>
              <p className="event-info">
                <FaMapMarkerAlt /> {selectedEvent.location}
              </p>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={registrationFormData.name}
                  onChange={e => setRegistrationFormData({ ...registrationFormData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={registrationFormData.email}
                  onChange={e => setRegistrationFormData({ ...registrationFormData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Company (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter your company name"
                  value={registrationFormData.company}
                  onChange={e => setRegistrationFormData({ ...registrationFormData, company: e.target.value })}
                />
              </div>

              <p className="form-note">* Required fields</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeRegistrationModal}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitRegistration}
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
