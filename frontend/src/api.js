const API_BASE = '/api';

export const api = {
  // Shop Settings & Branding
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch shop settings');
    return res.json();
  },
  updateSettings: async (settingsData) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
    });
    if (!res.ok) throw new Error('Failed to update shop settings');
    return res.json();
  },
  resetShopData: async (clearMenu = false) => {
    const res = await fetch(`${API_BASE}/settings/reset-data?clear_menu=${clearMenu}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset shop data');
    return res.json();
  },

  // Staff Management
  getStaff: async (activeOnly = true) => {
    const res = await fetch(`${API_BASE}/staff?active_only=${activeOnly}`);
    if (!res.ok) throw new Error('Failed to fetch staff');
    return res.json();
  },
  createStaff: async (staffData) => {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData),
    });
    if (!res.ok) throw new Error('Failed to create staff');
    return res.json();
  },
  updateStaff: async (id, staffData) => {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData),
    });
    if (!res.ok) throw new Error('Failed to update staff');
    return res.json();
  },
  deleteStaff: async (id) => {
    const res = await fetch(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete staff');
    return res.json();
  },

  // Batch Recipe Templates
  getBatchTemplates: async () => {
    const res = await fetch(`${API_BASE}/batch-templates`);
    if (!res.ok) throw new Error('Failed to fetch batch templates');
    return res.json();
  },
  createBatchTemplate: async (tplData) => {
    const res = await fetch(`${API_BASE}/batch-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tplData),
    });
    if (!res.ok) throw new Error('Failed to create recipe template');
    return res.json();
  },
  deleteBatchTemplate: async (id) => {
    const res = await fetch(`${API_BASE}/batch-templates/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete recipe template');
    return res.json();
  },

  // Menu Items
  getMenu: async (activeOnly = true) => {
    const res = await fetch(`${API_BASE}/menu?active_only=${activeOnly}`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  },
  createMenuItem: async (item) => {
    const res = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create menu item');
    return res.json();
  },
  updateMenuItem: async (id, item) => {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update menu item');
    return res.json();
  },
  deleteMenuItem: async (id) => {
    const res = await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete menu item');
    return res.json();
  },

  // Orders
  getOrders: async (limit = 50, status = null) => {
    const url = status ? `${API_BASE}/orders?limit=${limit}&status_filter=${status}` : `${API_BASE}/orders?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },
  createOrder: async (orderData) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create order' }));
      throw new Error(err.detail || 'Failed to create order');
    }
    return res.json();
  },
  cancelOrder: async (orderId) => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel order');
    return res.json();
  },

  // Batches
  getBatches: async () => {
    const res = await fetch(`${API_BASE}/batches`);
    if (!res.ok) throw new Error('Failed to fetch batches');
    return res.json();
  },
  createBatch: async (batchData) => {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData),
    });
    if (!res.ok) throw new Error('Failed to create batch');
    return res.json();
  },
  updateBatch: async (id, updateData) => {
    const res = await fetch(`${API_BASE}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update batch');
    return res.json();
  },
  deleteBatch: async (id) => {
    const res = await fetch(`${API_BASE}/batches/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete batch');
    return res.json();
  },

  // Expenses
  getExpenses: async () => {
    const res = await fetch(`${API_BASE}/expenses`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },
  createExpense: async (expenseData) => {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },
  deleteExpense: async (id) => {
    const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
  },

  // Analytics
  getPnL: async (period = 'today') => {
    const res = await fetch(`${API_BASE}/analytics/pnl?period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch P&L');
    return res.json();
  },
  getPlateBreakdown: async () => {
    const res = await fetch(`${API_BASE}/analytics/plate-breakdown`);
    if (!res.ok) throw new Error('Failed to fetch plate breakdown');
    return res.json();
  },
};
