import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const designsApi = {
  list: () => client.get('/designs').then(r => r.data),
  get: (id) => client.get(`/designs/${id}`).then(r => r.data),
  create: (data) => client.post('/designs', data).then(r => r.data),
  update: (id, data) => client.put(`/designs/${id}`, data).then(r => r.data),
  remove: (id) => client.delete(`/designs/${id}`).then(r => r.data),
};

export const projectionsApi = {
  list: () => client.get('/projections').then(r => r.data),
  create: (data) => client.post('/projections', data).then(r => r.data),
  remove: (id) => client.delete(`/projections/${id}`).then(r => r.data),
};

export const roomPhotosApi = {
  list: () => client.get('/room-photos').then(r => r.data),
  get: (id) => client.get(`/room-photos/${id}`).then(r => r.data),
  create: (data) => client.post('/room-photos', data).then(r => r.data),
  remove: (id) => client.delete(`/room-photos/${id}`).then(r => r.data),
};
