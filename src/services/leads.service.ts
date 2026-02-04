import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { Lead } from '@/types/models';
import { clientsService } from './clients.service';

export const leadsService = {
  getAllLeads: (): Lead[] => {
    return storage.get<Lead[]>(STORAGE_KEYS.LEADS) || [];
  },

  getLeadById: (id: string): Lead | null => {
    const leads = leadsService.getAllLeads();
    return leads.find((l) => l.id === id) || null;
  },

  getLeadsByStatus: (status: Lead['status']): Lead[] => {
    const leads = leadsService.getAllLeads();
    return leads.filter((l) => l.status === status).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  createLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): Lead => {
    const newLead: Lead = {
      ...lead,
      id: `LEAD-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    const leads = leadsService.getAllLeads();
    storage.set(STORAGE_KEYS.LEADS, [...leads, newLead]);
    return newLead;
  },

  updateLead: (id: string, updates: Partial<Lead>): Lead | null => {
    const leads = leadsService.getAllLeads();
    const index = leads.findIndex((l) => l.id === id);
    
    if (index === -1) return null;

    const updatedLead = {
      ...leads[index],
      ...updates,
    };

    leads[index] = updatedLead;
    storage.set(STORAGE_KEYS.LEADS, leads);
    return updatedLead;
  },

  convertToClient: (leadId: string): string | null => {
    const lead = leadsService.getLeadById(leadId);
    if (!lead) return null;

    const client = clientsService.create({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      status: 'INACTIVE',
    });

    leadsService.updateLead(leadId, { status: 'converted' });

    return client.id;
  },

  deleteLead: (id: string): boolean => {
    const leads = leadsService.getAllLeads();
    const filtered = leads.filter((l) => l.id !== id);
    
    if (filtered.length === leads.length) return false;

    storage.set(STORAGE_KEYS.LEADS, filtered);
    return true;
  },
};
