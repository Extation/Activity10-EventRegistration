import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const eventAPI = {
  getAll: () => api.get('/events'),
  getById: (id: number) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: number, data: any) => api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
  getCapacity: (id: number) => api.get(`/events/${id}/capacity`),
};

export const registrationAPI = {
  register: (eventId: number, data: any) =>
    api.post(`/registrations/events/${eventId}/register`, data),
  getByEvent: (eventId: number) =>
    api.get(`/registrations/events/${eventId}`),
  getByUser: (userId: number) => api.get(`/registrations/users/${userId}`),
  getById: (id: number) => api.get(`/registrations/${id}`),
  cancel: (id: number) => api.delete(`/registrations/${id}`),
  getCount: (eventId: number) =>
    api.get(`/registrations/events/${eventId}/count`),
};

export const ticketAPI = {
  generate: (eventId: number, registrationId: number) =>
    api.post('/tickets/generate', { eventId, registrationId }),
  getByUuid: (uuid: string) => api.get(`/tickets/uuid/${uuid}`),
  getByRegistration: (registrationId: number) =>
    api.get(`/tickets/registration/${registrationId}`),
  getByEvent: (eventId: number) => api.get(`/tickets/events/${eventId}`),
  verify: (uuid: string) => api.post('/tickets/verify', { uuid }),
};

export default api;
