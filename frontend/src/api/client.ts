import axios from 'axios';
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
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  const { data } = await api.post('/documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

export const getDocumentDownloadUrl = (id: string): string => {
  return `/api/documents/${id}/download`;
};

export default api;
