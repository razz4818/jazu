import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string;
}

interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  restaurant: RestaurantInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>({
    id: 'rest_demokitchen_001',
    name: 'Demo Kitchen',
    slug: 'demo-kitchen'
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('safekitchen_token');
    if (token) {
      api.getMe()
        .then(res => {
          setUser(res.user);
          setRestaurant(res.restaurant);
          localStorage.setItem('safekitchen_tenant_id', res.user.restaurantId);
        })
        .catch(() => {
          localStorage.removeItem('safekitchen_token');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('safekitchen_token', res.token);
    localStorage.setItem('safekitchen_tenant_id', res.user.restaurantId);
    setUser(res.user);
    setRestaurant(res.restaurant);
  };

  const logout = () => {
    localStorage.removeItem('safekitchen_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setRestaurant(res.restaurant);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
