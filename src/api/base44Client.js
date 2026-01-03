// SHARED STORAGE - All users see same data
export const base44 = {
  auth: {
    login: async (email, password) => {
      const users = JSON.parse(localStorage.getItem('all_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        localStorage.setItem('current_user', JSON.stringify(user));
        return { success: true };
      }
      throw new Error('Invalid credentials');
    },
    
    signup: async (email, password, fullName, role = 'user') => {
      const users = JSON.parse(localStorage.getItem('all_users') || '[]');
      
      if (users.find(u => u.email === email)) {
        throw new Error('Email already exists');
      }
      
      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        full_name: fullName,
        role,
        created_date: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('all_users', JSON.stringify(users));
      localStorage.setItem('current_user', JSON.stringify(newUser));
      return newUser;
    },
    
    me: async () => {
      const user = localStorage.getItem('current_user');
      if (!user) throw new Error('Not logged in');
      return JSON.parse(user);
    },
    
    logout: (url) => {
      localStorage.removeItem('current_user');
      window.location.href = url;
    }
  },
  
  entities: {
    Product: {
      list: async (sort) => {
        const products = JSON.parse(localStorage.getItem('shared_products') || '[]');
        return products;
      },
      
      create: async (data) => {
        const products = JSON.parse(localStorage.getItem('shared_products') || '[]');
        const newProduct = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };
        products.push(newProduct);
        localStorage.setItem('shared_products', JSON.stringify(products));
        return newProduct;
      },
      
      update: async (id, data) => {
        const products = JSON.parse(localStorage.getItem('shared_products') || '[]');
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
          products[index] = { 
            ...products[index], 
            ...data, 
            updated_date: new Date().toISOString() 
          };
          localStorage.setItem('shared_products', JSON.stringify(products));
        }
        return products[index];
      },
      
      delete: async (id) => {
        const products = JSON.parse(localStorage.getItem('shared_products') || '[]');
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem('shared_products', JSON.stringify(filtered));
        return { success: true };
      },
      
      filter: async (filters, sort) => {
        const products = JSON.parse(localStorage.getItem('shared_products') || '[]');
        return products;
      }
    },
    
    Alert: {
      create: async (data) => {
        const alerts = JSON.parse(localStorage.getItem('shared_alerts') || '[]');
        const newAlert = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString()
        };
        alerts.push(newAlert);
        localStorage.setItem('shared_alerts', JSON.stringify(alerts));
        return newAlert;
      },
      
      filter: async (filters, sort) => {
        const alerts = JSON.parse(localStorage.getItem('shared_alerts') || '[]');
        if (filters.is_resolved !== undefined) {
          return alerts.filter(a => a.is_resolved === filters.is_resolved);
        }
        return alerts;
      },
      
      update: async (id, data) => {
        const alerts = JSON.parse(localStorage.getItem('shared_alerts') || '[]');
        const index = alerts.findIndex(a => a.id === id);
        if (index !== -1) {
          alerts[index] = { ...alerts[index], ...data };
          localStorage.setItem('shared_alerts', JSON.stringify(alerts));
        }
        return alerts[index];
      }
    },
    
    User: {
      list: async () => {
        return JSON.parse(localStorage.getItem('all_users') || '[]');
      }
    },
  
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        return { file_url: URL.createObjectURL(file) };
      }
    }
  }
}}