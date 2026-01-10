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

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '', general: '' });
  const [registerErrors, setRegisterErrors] = useState({ name: '', email: '', password: '', general: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('attendeeToken');
    const userStr = localStorage.getItem('attendeeUser');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      setIsAuthenticated(true);
      setCurrentUser(user);
      loadInitialData(user);
    }
  }, []);

  const loadInitialData = async (user: User) => {
    await loadEvents();
    await loadMyRegistrations(user);
  };

  // Authentication functions
  const handleLogin = async () => {
    // Clear previous errors
    setLoginErrors({ email: '', password: '', general: '' });
    
    let hasError = false;
    const newErrors = { email: '', password: '', general: '' };

    // Email validation
    if (!loginForm.email) {
      newErrors.email = 'Email address is required';
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginForm.email)) {
        newErrors.email = 'Please provide a valid email address';
        hasError = true;
      }
    }

    // Password validation
    if (!loginForm.password) {
      newErrors.password = 'Password is required';
      hasError = true;
    }

    if (hasError) {
      setLoginErrors(newErrors);
      return;
    }

    try {
      setIsLoggingIn(true);
      const response = await api.post('/auth/login', loginForm);
      const { access_token, user } = response.data;
      
      localStorage.setItem('attendeeToken', access_token);
      localStorage.setItem('attendeeUser', JSON.stringify(user));
      
      setIsAuthenticated(true);
      setCurrentUser(user);
      setLoginForm({ email: '', password: '' });
      setLoginErrors({ email: '', password: '', general: '' });
      
      await loadInitialData(user);
    } catch (error: any) {
      if (error.response?.status === 401) {
        newErrors.general = '❌ Invalid credentials. Please check your email and password.';
      } else if (error.response?.status === 404) {
        newErrors.general = '🔍 Account not found. Please create an account first.';
      } else if (error.response?.data?.message) {
        newErrors.general = error.response.data.message;
      } else if (error.message === 'Network Error') {
        newErrors.general = '🌐 Unable to connect to the server. Please verify the backend service is running.';
      } else {
        newErrors.general = '⚠️ Login failed. Please try again later.';
      }
      setLoginErrors(newErrors);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async () => {
    // Clear previous errors
    setRegisterErrors({ name: '', email: '', password: '', general: '' });
    
    let hasError = false;
    const newErrors = { name: '', email: '', password: '', general: '' };

    // Name validation
    if (!registerForm.name) {
      newErrors.name = 'Full name is required';
      hasError = true;
    } else if (registerForm.name.trim().length < 2) {
      newErrors.name = 'Name must contain at least 2 characters';
      hasError = true;
    }

    // Email validation
    if (!registerForm.email) {
      newErrors.email = 'Email address is required';
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        newErrors.email = 'Please provide a valid email address';
        hasError = true;
      }
    }

    // Password validation
    if (!registerForm.password) {
      newErrors.password = 'Password is required';
      hasError = true;
    } else if (registerForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasError = true;
    }

    if (hasError) {
      setRegisterErrors(newErrors);
      return;
    }

    try {
      setIsRegistering(true);
      await api.post('/auth/register', registerForm);
      
      // Success - switch to login
      setShowLogin(true);
      setRegisterForm({ email: '', password: '', name: '' });
      setRegisterErrors({ name: '', email: '', password: '', general: '' });
      setLoginErrors({ email: '', password: '', general: '✅ Registration successful! Please login with your credentials.' });
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
        newErrors.email = '📧 This email address is already registered';
        newErrors.general = '💡 Please sign in with your existing account or use a different email.';
      } else if (error.response?.data?.message) {
        newErrors.general = error.response.data.message;
      } else if (error.message === 'Network Error') {
        newErrors.general = '🌐 Unable to connect to the server. Please verify the backend service is running.';
      } else {
        newErrors.general = '⚠️ Registration failed. Please try again later.';
      }
      setRegisterErrors(newErrors);
    } finally {
      setIsRegistering(false);
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
      console.error('❌ [Attendee] Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistrations = async (user?: User) => {
    const userToUse = user || currentUser;
    if (!userToUse) return;
    try {
      const response = await api.get(`/registrations/users/${userToUse.id}`);
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
      console.error('❌ [Attendee] Failed to load user registrations:', error);
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
      showToast('📝 Please provide both your name and email address to complete registration.', 'warning');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationFormData.email)) {
      showToast('✉️ Please provide a valid email address.', 'warning');
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

      showToast(`🎉 Success! You've been registered for ${selectedEvent.title}. Check your tickets!`, 'success');
      closeRegistrationModal();
      await loadEvents();
      await loadMyRegistrations();
      setActiveTab('mytickets');
    } catch (error: any) {
      showToast(error.response?.data?.message || '❌ Unable to complete registration. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: number, eventTitle: string) => {
    setConfirmDialogData({
      title: 'Cancel Registration',
      message: `Are you sure you want to cancel your registration for "${eventTitle}"?`,
      onConfirm: async () => {
        setShowConfirmDialog(false);
        try {
          await api.delete(`/registrations/${registrationId}`);
          showToast('✅ Your registration has been cancelled successfully.', 'success');
          await loadEvents();
          await loadMyRegistrations();
        } catch (error: any) {
          showToast(error.response?.data?.message || '❌ Unable to cancel registration. Please try again.', 'error');
        }
      }
    });
    setShowConfirmDialog(true);
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
              
              {loginErrors.general && (
                <div className={`error-message-general ${loginErrors.general.startsWith('✅') ? 'success-message' : ''}`}>
                  {loginErrors.general}
                </div>
              )}
              
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={e => {
                    setLoginForm({ ...loginForm, email: e.target.value });
                    setLoginErrors({ ...loginErrors, email: '', general: '' });
                  }}
                  onKeyPress={e => e.key === 'Enter' && handleLogin()}
                  disabled={isLoggingIn}
                  className={loginErrors.email ? 'input-error' : ''}
                />
                {loginErrors.email && (
                  <span className="field-error">{loginErrors.email}</span>
                )}
              </div>

              <div className="input-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={e => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    setLoginErrors({ ...loginErrors, password: '', general: '' });
                  }}
                  onKeyPress={e => e.key === 'Enter' && handleLogin()}
                  disabled={isLoggingIn}
                  className={loginErrors.password ? 'input-error' : ''}
                />
                {loginErrors.password && (
                  <span className="field-error">{loginErrors.password}</span>
                )}
              </div>

              <button 
                onClick={handleLogin} 
                className="btn-primary"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
              <p className="auth-hint">
                Don't have an account? Click Register above.
              </p>
            </div>
          ) : (
            <div className="auth-form">
              <h2>Register</h2>
              
              {registerErrors.general && (
                <div className="error-message-general">
                  {registerErrors.general}
                </div>
              )}
              
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={registerForm.name}
                  onChange={e => {
                    setRegisterForm({ ...registerForm, name: e.target.value });
                    setRegisterErrors({ ...registerErrors, name: '', general: '' });
                  }}
                  disabled={isRegistering}
                  className={registerErrors.name ? 'input-error' : ''}
                />
                {registerErrors.name && (
                  <span className="field-error">{registerErrors.name}</span>
                )}
              </div>

              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={e => {
                    setRegisterForm({ ...registerForm, email: e.target.value });
                    setRegisterErrors({ ...registerErrors, email: '', general: '' });
                  }}
                  disabled={isRegistering}
                  className={registerErrors.email ? 'input-error' : ''}
                />
                {registerErrors.email && (
                  <span className="field-error">{registerErrors.email}</span>
                )}
              </div>

              <div className="input-group">
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={registerForm.password}
                  onChange={e => {
                    setRegisterForm({ ...registerForm, password: e.target.value });
                    setRegisterErrors({ ...registerErrors, password: '', general: '' });
                  }}
                  onKeyPress={e => e.key === 'Enter' && handleRegister()}
                  disabled={isRegistering}
                  className={registerErrors.password ? 'input-error' : ''}
                />
                {registerErrors.password && (
                  <span className="field-error">{registerErrors.password}</span>
                )}
              </div>

              <button 
                onClick={handleRegister} 
                className="btn-primary"
                disabled={isRegistering}
              >
                {isRegistering ? 'Creating Account...' : 'Register'}
              </button>
              <p className="auth-hint">
                Already have an account? Click Login above.
              </p>
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
                            <p className="ticket-uuid" title={ticket.uuid}>{ticket.uuid.substring(0, 12)}...</p>
                          </div>
                          <div className="ticket-actions">
                            <button
                              className="btn-download"
                              onClick={() => {
                                navigator.clipboard.writeText(ticket.uuid);
                                alert('UUID copied to clipboard!\n\n' + ticket.uuid);
                              }}
                            >
                              📋 Copy UUID
                            </button>
                            <button
                              className="btn-download"
                              onClick={() => downloadTicket(ticket)}
                            >
                              <FaDownload /> Download QR
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmDialogData && (
        <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>{confirmDialogData.title}</h2>
              <button className="modal-close" onClick={() => setShowConfirmDialog(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
                {confirmDialogData.message}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </button>
              <button
                className="btn-cancel"
                onClick={confirmDialogData.onConfirm}
              >
                Yes, Cancel Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <span className="toast-icon">
                {toast.type === 'success' && '✅'}
                {toast.type === 'error' && '❌'}
                {toast.type === 'warning' && '⚠️'}
                {toast.type === 'info' && 'ℹ️'}
              </span>
              <span className="toast-message">{toast.message}</span>
            </div>
            <button 
              className="toast-close" 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
