import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaFileExport } from 'react-icons/fa';
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
  organizerId: number;
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: 0,
    organizerId: 1,
  });
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadEventDetails = async (event: Event) => {
    try {
      setSelectedEvent(event);
      const response = await api.get(`/registrations/events/${event.id}`);
      setRegistrations(response.data);
    } catch (error) {
      alert('Failed to load event details');
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.date) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await api.post('/events', formData);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        capacity: 0,
        organizerId: 1,
      });
      setIsCreating(false);
      loadEvents();
    } catch (error) {
      alert('Failed to create event');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/events/${id}`);
        loadEvents();
        setSelectedEvent(null);
        setRegistrations([]);
      } catch (error) {
        alert('Failed to delete event');
      }
    }
  };

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

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🎯 Event Management Dashboard (Admin)</h1>
        <button onClick={() => setIsCreating(!isCreating)} className="btn-primary">
          <FaPlus /> {isCreating ? 'Cancel' : 'Create Event'}
        </button>
      </header>

      {isCreating && (
        <div className="form-container">
          <h2>Create New Event</h2>
          <input
            type="text"
            placeholder="Event Title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <input
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
          />
          <input
            type="time"
            value={formData.time}
            onChange={e => setFormData({ ...formData, time: e.target.value })}
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={e =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={e =>
              setFormData({ ...formData, capacity: parseInt(e.target.value) })
            }
          />
          <button onClick={handleCreateEvent} className="btn-primary">
            Create Event
          </button>
        </div>
      )}

      <div className="main-content">
        <div className="events-list">
          <h2>All Events ({events.length})</h2>
          {loading ? (
            <p>Loading events...</p>
          ) : events.length === 0 ? (
            <p>No events created yet.</p>
          ) : (
            <div className="event-cards">
              {events.map(event => (
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
                <button
                  onClick={exportRegistrations}
                  className="btn-secondary"
                >
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
    </div>
  );
}

export default App;
