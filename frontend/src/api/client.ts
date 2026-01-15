import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import i18n from '../i18n';
import { isNetworkError, getErrorMessage } from '../utils/errorUtils';
import type {
  Property,
  PropertyCreate,
  Credit,
  CreditCreate,
  Transaction,
  TransactionCreate,
  Document,
  PropertySummary
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor - set Accept-Language header for i18n
api.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language;
  return config;
});

// Response interceptor - handle errors centrally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network errors - show toast
    if (isNetworkError(error)) {
      toast.error(i18n.t('errors.networkError'));
      return Promise.reject(error);
    }

    // Server errors (500) - show toast
    if (error.response?.status === 500) {
      const message = getErrorMessage(error, i18n.t('errors.serverError'));
      toast.error(message);
    }

    // 404, 400, 422 - re-throw for component handling (inline errors)
    return Promise.reject(error);
  }
);

// Properties
export const getProperties = async (): Promise<Property[]> => {
  const { data } = await api.get('/properties/');
  return data;
};

export const getProperty = async (id: string): Promise<Property> => {
  const { data } = await api.get(`/properties/${id}`);
  return data;
};

export const getPropertySummary = async (id: string): Promise<PropertySummary> => {
  const { data } = await api.get(`/properties/${id}/summary`);
  return data;
};

export const createProperty = async (property: PropertyCreate): Promise<Property> => {
  const { data } = await api.post('/properties/', property);
  return data;
};

export const updateProperty = async (id: string, property: Partial<PropertyCreate>): Promise<Property> => {
  const { data } = await api.put(`/properties/${id}`, property);
  return data;
};

export const deleteProperty = async (id: string): Promise<void> => {
  await api.delete(`/properties/${id}`);
};

// Credits
export const getCredits = async (propertyId?: string): Promise<Credit[]> => {
  const params = propertyId ? { property_id: propertyId } : {};
  const { data } = await api.get('/credits/', { params });
  return data;
};

export const createCredit = async (credit: CreditCreate): Promise<Credit> => {
  const { data } = await api.post('/credits/', credit);
  return data;
};

export const deleteCredit = async (id: string): Promise<void> => {
  await api.delete(`/credits/${id}`);
};

// Transactions
export const getTransactions = async (propertyId?: string): Promise<Transaction[]> => {
  const params = propertyId ? { property_id: propertyId } : {};
  const { data } = await api.get('/transactions/', { params });
  return data;
};

export const createTransaction = async (transaction: TransactionCreate): Promise<Transaction> => {
  const { data } = await api.post('/transactions/', transaction);
  return data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await api.delete(`/transactions/${id}`);
};

// Documents
export const getDocuments = async (propertyId?: string): Promise<Document[]> => {
  const params = propertyId ? { property_id: propertyId } : {};
  const { data } = await api.get('/documents/', { params });
  return data;
};

export const uploadDocument = async (formData: FormData): Promise<Document> => {
  const { data } = await api.post('/documents/', formData);
  return data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

export const getDocumentDownloadUrl = (id: string): string => {
  return `/api/documents/${id}/download`;
};

export default api;
