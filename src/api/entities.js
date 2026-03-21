import { apiGet, apiPost, apiPatch } from './client';

export const StatusReport = {
  filter: (filters = {}, sort, limit) =>
    apiGet('/status-reports', { ...filters, sort, limit }),
  create: (data) => apiPost('/status-reports', data),
  update: (id, data) => apiPatch(`/status-reports/${id}`, data),
};

export const ReportComment = {
  filter: (filters = {}, sort, limit) =>
    apiGet('/comments', { ...filters, sort, limit }),
  create: (data) => apiPost('/comments', data),
  update: (id, data) => apiPatch(`/comments/${id}`, data),
};

export const SystemMessage = {
  filter: (filters = {}, sort, limit) =>
    apiGet('/system-messages', { ...filters, sort, limit }),
  create: (data) => apiPost('/system-messages', data),
  update: (id, data) => apiPatch(`/system-messages/${id}`, data),
};

export const User = {
  me: async () => {
    return apiGet('/auth/me');
  }
};
