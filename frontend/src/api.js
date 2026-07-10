const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) return res.json();
  return res;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  getAirports: () => request('/airports'),
  getAirport: (id) => request(`/airports/${id}`),
  updateAirport: (id, data) => request(`/airports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLiveFlights: (iata = '') => request(`/live-flights${iata ? '?iata=' + iata : ''}`),
  getAPLiveCounts: () => request('/ap-live-counts'),
  getForecasts: (airportId) => request(`/forecasts/${airportId}`),
  getAllForecasts: () => request('/forecasts'),
  updateForecast: (airportId, year, data) => request(`/forecasts/${airportId}/${year}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPorts: () => request('/ports'),
  getPort: (id) => request(`/ports/${id}`),
  getPortForecasts: (portId) => request(`/port-forecasts/${portId}`),
  getAllPortForecasts: () => request('/port-forecasts'),
  getRoutes: () => request('/routes'),
  getRoutesByAirport: (airportId) => request(`/routes/${airportId}`),
  updateRoute: (id, data) => request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDatasets: () => request('/datasets'),
  syncDataset: (id) => request(`/datasets/${id}/sync`, { method: 'POST' }),
  getOverview: () => request('/overview'),
  getOverviewTrend: () => request('/overview/trend'),
  getOverviewAirportsTable: () => request('/overview/airports-table'),
  getLogs: () => request('/logs'),
  getUsers: () => request('/users'),
  exportReport: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/export?${qs}`);
  },
  getAirQuality: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/air-quality${qs ? '?' + qs : ''}`);
  },
  getDemandForecast: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/forecast/demand${qs ? '?' + qs : ''}`);
  },
  getCargoForecast: () => request('/forecast/cargo'),
  getCapacityThresholds: () => request('/capacity/thresholds'),
  simulateScenario: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/scenario/simulate?${qs}`);
  },
  getCorridors: () => request('/corridors'),
  getODFlows: () => request('/od-flows'),
  getInfrastructureGaps: () => request('/infrastructure/gaps'),
  getRouteRecommendations: () => request('/route-recommendations'),
  // Feedback
  getFeedback: () => request('/feedback'),
  submitFeedback: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  updateFeedback: (id, data) => request(`/feedback/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  // Queries
  getQueries: () => request('/queries'),
  submitQuery: (data) => request('/queries', { method: 'POST', body: JSON.stringify(data) }),
  updateQuery: (id, data) => request(`/queries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuery: (id) => request(`/queries/${id}`, { method: 'DELETE' }),
};
