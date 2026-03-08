import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string; deviceFingerprint: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  googleLogin: (token: string) =>
    api.post('/auth/google', { token }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Signals
export const signalsAPI = {
  getActive: () => api.get('/signals/active'),
  getHistory: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/signals/history', { params }),
  getById: (id: string) => api.get(`/signals/${id}`),
  getStats: () => api.get('/signals/stats'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getDailyAnalysis: () => api.get('/dashboard/daily-analysis'),
  getEquityCurve: () => api.get('/dashboard/equity-curve'),
};

// Journal
export const journalAPI = {
  getEntries: (params?: { page?: number; limit?: number }) =>
    api.get('/journal', { params }),
  createEntry: (data: any) => api.post('/journal', data),
  updateEntry: (id: string, data: any) => api.put(`/journal/${id}`, data),
  getStats: () => api.get('/journal/stats'),
};

// Preferences
export const preferencesAPI = {
  get: () => api.get('/users/preferences'),
  update: (data: any) => api.put('/users/preferences', data),
  linkWhatsApp: (phoneNumber: string) => api.put('/users/whatsapp', { phoneNumber }),
};

// Public testimonials
export const testimonialsAPI = {
  getAll: () => api.get('/testimonials'),
};

// Subscriptions
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  create: (data: { plan: string; paymentMethod: string; txHash?: string }) =>
    api.post('/subscriptions', data),
  cancel: () => api.post('/subscriptions/cancel'),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: { page?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  banUser: (userId: string) => api.post(`/admin/users/${userId}/ban`),
  unbanUser: (userId: string) => api.post(`/admin/users/${userId}/unban`),
  getSubscriptions: () => api.get('/admin/subscriptions'),
  createManualSignal: (data: any) => api.post('/admin/signals', data),
  sendAnnouncement: (data: { title: string; message: string }) =>
    api.post('/admin/announcements', data),
  // Plan management
  getPlans: () => api.get('/admin/plans'),
  updatePlan: (planId: string, data: any) => api.put(`/admin/plans/${planId}`, data),
  // Testimonials management
  getTestimonials: () => api.get('/admin/testimonials'),
  createTestimonial: (data: any) => api.post('/admin/testimonials', data),
  updateTestimonial: (id: string, data: any) => api.put(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id: string) => api.delete(`/admin/testimonials/${id}`),
  // Client plan management
  updateUserPlan: (userId: string, data: { plan: string; duration?: number }) =>
    api.put(`/admin/users/${userId}/plan`, data),
  // Site config
  getSiteConfig: () => api.get('/admin/site-config'),
  updateSiteConfig: (data: { platformName?: string; logoUrl?: string }) =>
    api.put('/admin/site-config', data),
};

// Notifications
export const notificationsAPI = {
  getRecent: () => api.get('/notifications/recent'),
};

export default api;
