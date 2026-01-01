
import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Supreme Beef Burger',
    price: 450,
    category: 'Burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300',
    description: 'Juicy double patty with caramelized onions and secret sauce.',
    rating: 4.8
  },
  {
    id: '2',
    name: 'Pepperoni Feast Pizza',
    price: 1200,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&h=300',
    description: 'Loaded with premium pepperoni and extra mozzarella.',
    rating: 4.9
  },
  {
    id: '3',
    name: 'Spicy Chicken Biryani',
    price: 300,
    category: 'Asian',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&h=300',
    description: 'Traditional aromatic rice cooked with tender spicy chicken.',
    rating: 4.7
  },
  {
    id: '4',
    name: 'Classic Margherita',
    price: 900,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?auto=format&fit=crop&w=400&h=300',
    description: 'The Italian classic with fresh basil and tomatoes.',
    rating: 4.5
  },
  {
    id: '5',
    name: 'Truffle Mushroom Burger',
    price: 550,
    category: 'Burger',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&h=300',
    description: 'Gourmet mushroom burger with real truffle oil.',
    rating: 4.9
  },
  {
    id: '6',
    name: 'Caramel Macchiato',
    price: 350,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=400&h=300',
    description: 'Freshly brewed coffee with sweet vanilla and caramel.',
    rating: 4.6
  },
  {
    id: '7',
    name: 'Molten Lava Cake',
    price: 450,
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=400&h=300',
    description: 'Warm chocolate cake with a gooey center served with vanilla ice cream.',
    rating: 5.0
  },
  {
    id: '8',
    name: 'Prawn Pad Thai',
    price: 850,
    category: 'Asian',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&h=300',
    description: 'Classic Thai stir-fry noodles with shrimp, tofu, and sprouts.',
    rating: 4.8
  }
];

export const CATEGORIES = ['All', 'Burger', 'Pizza', 'Asian', 'Dessert', 'Drinks'];

export const CUSTOMER_REVIEWS = [
  {
    id: 1,
    name: 'Sara J.',
    rating: 5,
    comment: 'The AI recommendations are scary accurate! Best Burger I have ever had.',
    avatar: 'https://i.pravatar.cc/150?u=sara',
    location: 'Karachi'
  },
  {
    id: 2,
    name: 'Daniyal K.',
    rating: 5,
    comment: 'Blazing fast delivery. The rider map feature kept me updated every minute.',
    avatar: 'https://i.pravatar.cc/150?u=daniyal',
    location: 'Lahore'
  },
  {
    id: 3,
    name: 'Zoe M.',
    rating: 4,
    comment: 'Love the variety. The Asian selection is authentic and fresh!',
    avatar: 'https://i.pravatar.cc/150?u=zoe',
    location: 'Islamabad'
  }
];
