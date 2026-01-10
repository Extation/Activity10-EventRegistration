import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaFileExport, FaSignOutAlt, FaTicketAlt, FaUserShield } from 'react-icons/fa';
import './App.css';

const API_BASE_URL = 'http://localhost:3005';

// Create axios instance with interceptor
const api = axios.create({ baseURL: API_BASE_URL });

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
  createdAt: string;
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
  organizerId: number;
}

interface Registration {
  id: number;
  eventId: number;
  userId: number;
  userEmail: string;
  userName: string;
  status: string;
  registeredAt: string;
}

interface Ticket {
  id: number;
  uuid: string;
  qrCode: string;
  status: string;
  verified: boolean;
  event: Event;
}

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });

  // Main app state
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'tickets'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: 0,
    organizerId: 1,
  });
  
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'attendee',
  });

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userStr));
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    await Promise.all([loadEvents(), loadUsers()]);
  };

  // Authentication functions
  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', loginForm);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
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
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setEvents([]);
    setUsers([]);
    setMyTickets([]);
  };

  // Data loading functions
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('❌ [Admin] Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('❌ [Admin] Failed to load users:', error);
    }
  };

  const loadMyTickets = async () => {
    if (!currentUser) return;
    try {
      const response = await api.get(`/registrations/users/${currentUser.id}`);
      const registrations = response.data;
      
      const ticketsPromises = registrations.map((reg: Registration) =>
        api.get(`/tickets/registration/${reg.id}`).catch(() => null)
      );
      
      const ticketsResponses = await Promise.all(ticketsPromises);
      const tickets = ticketsResponses
        .filter(res => res !== null)
        .map(res => res!.data);
      
      setMyTickets(tickets);
    } catch (error) {
      console.error('❌ [Admin] Failed to load tickets:', error);
    }
  };

  const loadEventDetails = async (event: Event) => {
    try {
      setSelectedEvent(event);
      const response = await api.get(`/registrations/events/${event.id}`);
      setRegistrations(response.data);
    } catch (error) {
      alert('❌ Unable to load event details. Please try again.');
    }
  };

  // Event management functions
  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await api.post('/events', eventForm);
      setEventForm({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        capacity: 0,
        organizerId: currentUser?.id || 1,
      });
      setIsCreating(false);
      await loadEvents();
    } catch (error) {
      alert('❌ Unable to create event. Please check your input and try again.');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/events/${id}`);
        await loadEvents();
        setSelectedEvent(null);
        setRegistrations([]);
      } catch (error) {
        alert('❌ Unable to delete event. Please try again.');
      }
    }
  };

  // User management functions
  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.name) {
      alert('⚠️ Please fill in all required fields (name, email, and password).');
      return;
    }

    try {
      await api.post('/auth/register', userForm);
      setUserForm({ email: '', password: '', name: '', role: 'attendee' });
      setIsEditingUser(false);
      await loadUsers();
      alert('✅ User account created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || '❌ Unable to create user. Please check your input and try again.');
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      await loadUsers();
      alert('✅ User role updated successfully!');
    } catch (error) {
      alert('❌ Unable to update user role. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        await loadUsers();
        alert('✅ User deleted successfully!');
      } catch (error) {
        alert('❌ Unable to delete user. Please try again.');
      }
    }
  };

  // Export function
  const exportRegistrations = () => {
    if (!selectedEvent || registrations.length === 0) {
      alert('No registrations to export');
      return;
    }

    const csv = [
      ['Registration ID', 'User Email', 'User Name', 'Registered At', 'Status'],
      ...registrations.map(r => [
        r.id,
        r.userEmail,
        r.userName,
        new Date(r.registeredAt).toLocaleString(),
        r.status,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registrations-${selectedEvent.id}.csv`;
    link.click();
  };

  const downloadTicket = (ticket: Ticket) => {
    const link = document.createElement('a');
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.uuid}.png`;
    link.click();
  };

  // Filter functions
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Login/Register UI
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Admin Dashboard</h1>
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
                Test Account: admin@test.com / admin123
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
    <div className="admin-container">
      <header className="admin-header">
        <h1>Event Management Dashboard</h1>
        <div className="header-actions">
          <span className="user-info">
            <FaUserShield /> {currentUser?.name} ({currentUser?.role})
          </span>
          <button onClick={handleLogout} className="btn-secondary">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => {
            setActiveTab('events');
            setSearchTerm('');
          }}
        >
          <FaUsers /> Events
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => {
            setActiveTab('users');
            setSearchTerm('');
          }}
        >
          <FaUserShield /> Users
        </button>
        <button
          className={activeTab === 'tickets' ? 'active' : ''}
          onClick={() => {
            setActiveTab('tickets');
            loadMyTickets();
          }}
        >
          <FaTicketAlt /> My Tickets
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <>
          <div className="toolbar">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={() => setIsCreating(!isCreating)} className="btn-primary">
              <FaPlus /> {isCreating ? 'Cancel' : 'Create Event'}
            </button>
          </div>

          {isCreating && (
            <div className="form-container">
              <h2>Create New Event</h2>
              <input
                type="text"
                placeholder="Event Title *"
                value={eventForm.title}
                onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={eventForm.description}
                onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
              />
              <input
                type="date"
                value={eventForm.date}
                onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
              />
              <input
                type="time"
                value={eventForm.time}
                onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
              />
              <input
                type="text"
                placeholder="Location"
                value={eventForm.location}
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
              />
              <input
                type="number"
                placeholder="Capacity"
                value={eventForm.capacity}
                onChange={e => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) })}
              />
              <button onClick={handleCreateEvent} className="btn-primary">
                Create Event
              </button>
            </div>
          )}

          <div className="main-content">
            <div className="events-list">
              <h2>All Events ({filteredEvents.length})</h2>
              {loading ? (
                <p>Loading events...</p>
              ) : filteredEvents.length === 0 ? (
                <p>No events found.</p>
              ) : (
                <div className="event-cards">
                  {filteredEvents.map(event => (
                    <div
                      key={event.id}
                      className={`event-card ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                      onClick={() => loadEventDetails(event)}
                    >
                      <h3>{event.title}</h3>
                      <p>{event.date} at {event.time}</p>
                      <p className="location">{event.location}</p>
                      <div className="event-stats">
                        <span>
                          <FaUsers /> {event.registrationCount}/{event.capacity}
                        </span>
                        <span className="status">{event.status}</span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        className="btn-danger"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEvent && (
              <div className="event-details">
                <h2>{selectedEvent.title}</h2>
                <div className="details-grid">
                  <div>
                    <strong>Date & Time:</strong>
                    <p>{selectedEvent.date} at {selectedEvent.time}</p>
                  </div>
                  <div>
                    <strong>Location:</strong>
                    <p>{selectedEvent.location}</p>
                  </div>
                  <div>
                    <strong>Capacity:</strong>
                    <p>
                      {selectedEvent.registrationCount}/{selectedEvent.capacity}
                    </p>
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <p>{selectedEvent.status}</p>
                  </div>
                </div>

                <div className="registrations-section">
                  <div className="section-header">
                    <h3>Registrations ({registrations.length})</h3>
                    <button onClick={exportRegistrations} className="btn-secondary">
                      <FaFileExport /> Export CSV
                    </button>
                  </div>

                  {registrations.length === 0 ? (
                    <p>No registrations yet.</p>
                  ) : (
                    <table className="registrations-table">
                      <thead>
                        <tr>
                          <th>User Email</th>
                          <th>User Name</th>
                          <th>Registered At</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map(reg => (
                          <tr key={reg.id}>
                            <td>{reg.userEmail}</td>
                            <td>{reg.userName}</td>
                            <td>{new Date(reg.registeredAt).toLocaleString()}</td>
                            <td>
                              <span className="badge">{reg.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <div className="toolbar">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={() => setIsEditingUser(!isEditingUser)} className="btn-primary">
              <FaPlus /> {isEditingUser ? 'Cancel' : 'Create User'}
            </button>
          </div>

          {isEditingUser && (
            <div className="form-container">
              <h2>Create New User</h2>
              <input
                type="text"
                placeholder="Full Name *"
                value={userForm.name}
                onChange={e => setUserForm({ ...userForm, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email *"
                value={userForm.email}
                onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password *"
                value={userForm.password}
                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
              />
              <select
                value={userForm.role}
                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="attendee">Attendee</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={handleCreateUser} className="btn-primary">
                Create User
              </button>
            </div>
          )}

          <div className="users-list">
            <h2>All Users ({filteredUsers.length})</h2>
            {filteredUsers.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={e => handleUpdateUserRole(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="attendee">Attendee</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn-danger-small"
                          disabled={user.id === currentUser?.id}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* My Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="tickets-container">
          <h2>My Tickets ({myTickets.length})</h2>
          {myTickets.length === 0 ? (
            <p>You don't have any tickets yet.</p>
          ) : (
            <div className="tickets-grid">
              {myTickets.map(ticket => (
                <div key={ticket.id} className="ticket-card">
                  <h3>{ticket.event.title}</h3>
                  <p>{ticket.event.date} at {ticket.event.time}</p>
                  <p className="location">{ticket.event.location}</p>
                  <div className="qr-container">
                    <img src={ticket.qrCode} alt="QR Code" className="qr-code" />
                    <p className="ticket-uuid">{ticket.uuid.substring(0, 12)}...</p>
                  </div>
                  <div className="ticket-status">
                    <span className={`badge ${ticket.verified ? 'verified' : 'active'}`}>
                      {ticket.verified ? '✓ Checked In' : 'Active'}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadTicket(ticket)}
                    className="btn-secondary"
                  >
                    Download QR Code
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
