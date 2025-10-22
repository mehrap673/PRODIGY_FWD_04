import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;

// Generic API request function (for backward compatibility)
export async function apiRequest(endpoint: string, options?: any) {
  try {
    const response = await api(endpoint, options);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
}

// ==================== AUTH API ====================
export const authAPI = {
  // Register new user
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  // Login user
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  // Logout user
  logout: () =>
    api.post('/auth/logout'),

  // Get current authenticated user - THIS WAS MISSING
  getMe: () =>
    api.get('/auth/me'),
};

// ==================== USER API ====================
export const userAPI = {
  // Get current user profile (alternative endpoint)
  getMe: () =>
    api.get('/users/me'),

  // Update user profile (name, avatar)
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/users/me', data),

  // Update user avatar with file upload
  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);  // Must match multer field name

    console.log('FormData contents:', formData.get('avatar'));

    return api.put('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Change password
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/me/password', { currentPassword, newPassword }),

  // Delete user account
  deleteAccount: () =>
    api.delete('/users/me'),

  // Get user by ID
  getUserById: (userId: string) =>
    api.get(`/users/${userId}`),
};

// ==================== CONTACT API ====================
export const contactAPI = {
  // Get all contacts
  getContacts: () =>
    api.get('/contacts'),

  // Search users by name or email
  searchUsers: (query: string) =>
    api.get(`/contacts/search?query=${query}`),

  // Get pending contact requests
  getPendingRequests: () =>
    api.get('/contacts/requests/pending'),

  // Get sent contact requests
  getSentRequests: () =>
    api.get('/contacts/requests/sent'),

  // Send contact request
  sendRequest: (userId: string) =>
    api.post('/contacts/request', { userId }),

  // Accept contact request
  acceptRequest: (requestId: string) =>
    api.put(`/contacts/request/${requestId}/accept`),

  // Reject contact request
  rejectRequest: (requestId: string) =>
    api.put(`/contacts/request/${requestId}/reject`),

  // Remove/delete contact
  removeContact: (contactId: string) =>
    api.delete(`/contacts/${contactId}`),
};

// ==================== MESSAGE API ====================
export const messageAPI = {
  // Get chat history with a user
  getChatHistory: (userId: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    return api.get(`/messages/chat/${userId}${queryString ? `?${queryString}` : ''}`);
  },

  // Send text message (via Socket.IO typically, but can use REST as fallback)
  sendMessage: (data: { receiverId: string; content: string; type?: string }) =>
    api.post('/messages/send', data),

  // Upload and send image message
  uploadImage: (file: File, receiverId: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('receiverId', receiverId);
    return api.post('/messages/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Upload and send audio message
  uploadAudio: (file: File, receiverId: string) => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('receiverId', receiverId);
    return api.post('/messages/upload/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get unread message count
  getUnreadCount: () =>
    api.get('/messages/unread/count'),

  // Mark message as read
  markAsRead: (messageId: string) =>
    api.put(`/messages/${messageId}/read`),

  // Edit message
  editMessage: (messageId: string, content: string) =>
    api.put(`/messages/${messageId}/edit`, { content }),

  // Delete message
  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),

  // Toggle reaction on message
  toggleReaction: (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/reaction`, { emoji }),
};

// ==================== TYPES ====================
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  unreadCount?: number;
}

export interface ContactRequest {
  _id: string;
  from: User;
  to: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  type: 'text' | 'image' | 'audio' | 'file';
  url?: string;
  isRead: boolean;
  isEdited: boolean;
  reactions?: { emoji: string; users: string[] }[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pages: number;
    hasMore: boolean;
  };
}
