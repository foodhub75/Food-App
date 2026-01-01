
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Burger' | 'Pizza' | 'Asian' | 'Dessert' | 'Drinks';
  image: string;
  description: string;
  rating: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'shipped' | 'delivered';
  paymentMethod: string;
  timestamp: string;
}

export interface AppState {
  cart: OrderItem[];
  user: User | null;
  currentStep: 'login' | 'home' | 'restaurant' | 'map' | 'payment' | 'admin';
}

export type Modality = 'AUDIO' | 'TEXT';
