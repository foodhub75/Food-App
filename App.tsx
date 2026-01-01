
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogIn, ShoppingCart, User as UserIcon, LogOut, 
  Search, Filter, Star, Sparkles, MapPin, 
  CreditCard, CheckCircle, ChevronRight, Menu as MenuIcon,
  Facebook, Twitter, Instagram, Youtube, Github, LayoutDashboard,
  Wallet, Banknote, Smartphone, ShieldCheck, Phone, Plus, Trash2, X,
  UserPlus, Mail, Lock, UserCheck, Clock, Truck, UtensilsCrossed,
  MessageCircle, Quote, Send, PenLine, Wand2, History, Map as MapIcon,
  ExternalLink, Loader2, Pizza, Sandwich, Soup, CakeSlice, Coffee, LayoutGrid,
  Tag, Percent, ChevronLeft
} from 'lucide-react';
import { MENU_ITEMS, CATEGORIES, CUSTOMER_REVIEWS } from './constants';
import { MenuItem, OrderItem, User, Order } from './types';
import { Cart } from './components/Cart';
import { MapView } from './components/MapView';
import { AdminPanel } from './components/AdminPanel';
import { getFoodInsights, polishReview, checkDeliveryLocation } from './services/geminiService';

// Fix: Moved categoryIconMap outside of the App component to avoid redeclaration errors and improve performance
const categoryIconMap: Record<string, { icon: any, color: string, bg: string }> = {
  'All': { icon: LayoutGrid, color: 'text-slate-600', bg: 'bg-slate-100' },
  'Burger': { icon: Sandwich, color: 'text-orange-600', bg: 'bg-orange-100' },
  'Pizza': { icon: Pizza, color: 'text-red-600', bg: 'bg-red-100' },
  'Asian': { icon: Soup, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'Dessert': { icon: CakeSlice, color: 'text-pink-600', bg: 'bg-pink-100' },
  'Drinks': { icon: Coffee, color: 'text-blue-600', bg: 'bg-blue-100' },
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'login' | 'home' | 'restaurant' | 'map' | 'payment' | 'admin'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInsight, setAiInsight] = useState<{description: string, funFact: string} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'wallet' | 'cod'>('card');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  
  // Reviews State
  const [allReviews, setAllReviews] = useState(CUSTOMER_REVIEWS);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewContext, setReviewContext] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', name: '' });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isPolishing, setIsPolishing] = useState(false);

  // Footer Location State
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResult, setLocationResult] = useState<{text: string, links: {title: string, uri: string}[]} | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  // Auth State
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([
    {
      id: 'admin-1',
      name: 'Restaurant Admin',
      email: 'admin@quickbite.ai',
      avatar: 'https://i.pravatar.cc/150?u=admin',
      role: 'admin'
    }
  ]);
  
  const [authFields, setAuthFields] = useState({ 
    name: '', 
    email: 'Admin', 
    password: '123', 
    role: 'user' as 'user' | 'admin' 
  });
  const [authError, setAuthError] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<MenuItem[]>(MENU_ITEMS);

  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, inventory]);

  const userActiveOrders = useMemo(() => {
    return orders.filter(o => o.userId === user?.id && o.status !== 'delivered');
  }, [orders, user]);

  const userDeliveredOrders = useMemo(() => {
    return orders.filter(o => o.userId === user?.id && o.status === 'delivered');
  }, [orders, user]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (isSignUp) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: authFields.name || 'New User',
        email: authFields.email,
        avatar: `https://i.pravatar.cc/150?u=${authFields.email}`,
        role: authFields.role
      };
      setRegisteredUsers(prev => [...prev, newUser]);
      setUser(newUser);
      setCurrentStep('home');
    } else {
      const isRequestedAdmin = (authFields.email.toLowerCase() === 'admin' || authFields.email === 'admin@quickbite.ai') && authFields.password === '123';
      if (isRequestedAdmin) {
        const adminUser = registeredUsers.find(u => u.role === 'admin') || registeredUsers[0];
        setUser(adminUser);
        setCurrentStep('home');
        return;
      }
      const foundUser = registeredUsers.find(u => u.email === authFields.email);
      if (foundUser) {
        setUser(foundUser);
        setCurrentStep('home');
      } else {
        setAuthError('Invalid credentials. Use Admin / 123');
      }
    }
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const comment = reviewContext ? `[${reviewContext}] ${newReview.comment}` : newReview.comment;
    const reviewToAdd = {
      id: Date.now(),
      name: user?.name || newReview.name || 'Guest User',
      rating: newReview.rating,
      comment: comment,
      avatar: user?.avatar || `https://i.pravatar.cc/150?u=${newReview.name}`,
      location: 'Just Now'
    };
    setAllReviews([reviewToAdd, ...allReviews]);
    setIsReviewModalOpen(false);
    setNewReview({ rating: 5, comment: '', name: '' });
    setReviewContext(null);
  };

  const handlePolishReview = async () => {
    if (!newReview.comment) return;
    setIsPolishing(true);
    const polished = await polishReview(newReview.comment);
    setNewReview({ ...newReview, comment: polished });
    setIsPolishing(false);
  };

  const handleLocationCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    setIsCheckingLocation(true);
    const result = await checkDeliveryLocation(locationQuery);
    setLocationResult(result);
    setIsCheckingLocation(false);
  };

  const handleShowInsight = async (item: MenuItem) => {
    setAiLoading(true);
    const insight = await getFoodInsights(item.name);
    setAiInsight(insight);
    setAiLoading(false);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const deleteMenuItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  const addMenuItem = (item: Omit<MenuItem, 'id' | 'rating'>) => {
    const newItem: MenuItem = { ...item, id: Math.random().toString(36).substr(2, 9), rating: 5.0 };
    setInventory(prev => [...prev, newItem]);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const openReviewModal = (context: string | null = null) => {
    setReviewContext(context);
    setIsReviewModalOpen(true);
  };

  const navigateToCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentStep('restaurant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TopPromoBanner = () => (
    <div className="bg-slate-900 text-white py-3 px-6 flex items-center justify-center gap-4 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-rose-600/20 to-orange-600/20 animate-shimmer pointer-events-none" />
      <Sparkles size={16} className="text-orange-400 relative z-10 animate-pulse" />
      <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] relative z-10 text-center">
        Limited Time: Use code <span className="text-orange-500 underline decoration-2 underline-offset-4">AI-FEAST</span> for 50% Off your first order!
      </p>
      <Percent size={14} className="text-rose-400 relative z-10 hidden sm:block" />
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-white">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-12 border border-white animate-scale-up">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-orange-600 p-4 rounded-[1.5rem] text-white shadow-xl mb-6 rotate-3"><Sparkles size={40} /></div>
          <h1 className="text-4xl font-black font-poppins text-slate-900 tracking-tight">Welcome to QuickBite</h1>
          <p className="text-slate-500 font-bold mt-2">AI-Powered Gourmet Delivery</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" required placeholder="Zaman Baba" value={authFields.name} onChange={e => setAuthFields({...authFields, name: e.target.value})} className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-orange-100 outline-none font-bold text-lg" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email / Username</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" required placeholder="admin" value={authFields.email} onChange={e => setAuthFields({...authFields, email: e.target.value})} className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-orange-100 outline-none font-bold text-lg" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="password" required placeholder="••••••••" value={authFields.password} onChange={e => setAuthFields({...authFields, password: e.target.value})} className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-orange-100 outline-none font-bold text-lg" />
            </div>
          </div>
          {authError && <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-xl border border-red-100">{authError}</p>}
          <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xl hover:bg-orange-700 shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95">{isSignUp ? 'Create Account' : 'Sign In'} <ChevronRight size={24} /></button>
        </form>
        <div className="mt-10 pt-10 border-t border-slate-100 text-center">
          <p className="text-slate-500 font-bold mb-4">{isSignUp ? 'Already have an account?' : "Don't have an account?"}</p>
          <button onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }} className="text-orange-600 font-black text-lg hover:underline">{isSignUp ? 'Sign In Instead' : 'Create One Now'}</button>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16 animate-fade-in">
      {/* Visual Food Banner Section (Enhanced Hero) */}
      <section className="bg-slate-900 rounded-[3.5rem] p-4 text-white relative overflow-hidden shadow-2xl group min-h-[450px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&h=600&q=80" 
            alt="Delicious Food" 
            className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-[2s]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-xl pl-12">
          <div className="inline-flex items-center gap-2 bg-orange-600 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 animate-bounce">
            <Tag size={14} /> Flash Sale
          </div>
          <h2 className="text-6xl font-black mb-6 font-poppins leading-[1.1] tracking-tight">
            The Feast <br/> 
            <span className="text-orange-500">You Deserve.</span>
          </h2>
          <p className="text-slate-300 text-xl mb-10 leading-relaxed font-medium">
            Discover hand-crafted meals curated by our AI, delivered hot to your doorstep in minutes.
          </p>
          <div className="flex flex-wrap gap-5">
            <button onClick={() => setCurrentStep('restaurant')} className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-orange-700 transition-all shadow-2xl shadow-orange-900/40 hover:-translate-y-1">Start Ordering</button>
            <button onClick={() => { if(userActiveOrders.length > 0) { setSelectedTrackingOrder(userActiveOrders[0]); setCurrentStep('map'); } else { setCurrentStep('restaurant'); } }} className="bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-5 rounded-2xl font-black text-xl flex items-center gap-3 hover:bg-white/20 transition-all"><MapPin size={22} className="text-orange-500" /> Track Order</button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden lg:block rotate-12 animate-float">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 shadow-3xl">
            <div className="w-48 h-48 bg-orange-500/20 rounded-[2rem] flex items-center justify-center">
              <UtensilsCrossed size={80} className="text-orange-500" />
            </div>
            <div className="mt-4 text-center">
              <p className="font-black text-white text-lg">Top Rated</p>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Gourmet Choice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Categories Section */}
      <section className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black font-poppins text-slate-900 tracking-tight">Explore Categories</h3>
            <p className="text-slate-500 font-bold mt-1">Discover your next favorite meal</p>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const config = categoryIconMap[cat] || categoryIconMap['All'];
            const Icon = config.icon;
            return (
              <button 
                key={cat} 
                onClick={() => navigateToCategory(cat)}
                className="group flex flex-col items-center gap-4 min-w-[140px]"
              >
                <div className={`w-28 h-28 ${config.bg} rounded-[2.5rem] flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-500 border border-white/50 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Icon size={40} className={`${config.color} group-hover:scale-110 transition-transform duration-500`} />
                </div>
                <span className={`font-black text-sm uppercase tracking-widest ${selectedCategory === cat ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-800'} transition-colors`}>{cat}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Delivered Orders Review Prompt */}
      {userDeliveredOrders.length > 0 && (
        <section className="animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><History size={24} /></div>
             <h3 className="text-2xl font-black font-poppins text-slate-800">Rate Your Recent Feasts</h3>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
             {userDeliveredOrders.map(order => (
               <div key={order.id} className="min-w-[300px] bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><UtensilsCrossed size={32} /></div>
                  <div className="flex-1">
                    <p className="font-black text-slate-800 line-clamp-1">#QB-{order.id.slice(0, 6)}</p>
                    <p className="text-xs text-slate-500 font-bold mb-3">{order.items.length} items • Rs {order.total}</p>
                    <button onClick={() => openReviewModal(`Order #${order.id.slice(0, 6)}`)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all">Write Review</button>
                  </div>
               </div>
             ))}
          </div>
        </section>
      )}

      {/* Recommended Items */}
      <section>
        <div className="flex justify-between items-end mb-10">
          <div><h3 className="text-3xl font-black font-poppins text-slate-900 tracking-tight">Recommended for You</h3><p className="text-slate-500 font-bold mt-2">AI-picked based on your recent searches</p></div>
          <button onClick={() => setCurrentStep('restaurant')} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2 group">View Full Menu <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {inventory.slice(0, 4).map(item => (
            <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50 hover:shadow-2xl transition-all group p-5">
              <div className="relative h-56 rounded-[1.75rem] overflow-hidden mb-6">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Star size={12} className="text-orange-500 fill-orange-500" />
                  <span className="text-xs font-black">{item.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="px-2">
                <h4 className="font-black text-2xl text-slate-800 mb-2 line-clamp-1">{item.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-black text-orange-600">Rs {item.price}</span>
                  <button onClick={() => addToCart(item)} className="bg-slate-900 text-white p-4 rounded-[1.25rem] hover:bg-orange-600 transition-all shadow-lg hover:scale-110 active:scale-95"><Plus size={24} strokeWidth={3} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="animate-fade-in py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-4xl font-black font-poppins text-slate-900 tracking-tight">Voices of Our Foodies</h3>
            <p className="text-slate-500 font-bold mt-2 text-lg">Real experiences from our community members.</p>
          </div>
          <button onClick={() => openReviewModal()} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl hover:scale-105 active:scale-95 group"><PenLine size={22} className="group-hover:rotate-12 transition-transform" /> Write a Review</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {allReviews.map(review => (
            <div key={review.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity"><Quote size={80} /></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <img src={review.avatar} alt={review.name} className="w-16 h-16 rounded-[1.5rem] object-cover ring-4 ring-orange-50" />
                  {review.location === 'Just Now' && <div className="absolute -top-1 -right-1 bg-orange-500 w-4 h-4 rounded-full border-2 border-white animate-pulse" />}
                </div>
                <div><h4 className="font-black text-slate-900 text-lg">{review.name}</h4><p className="text-xs font-black text-slate-400 uppercase tracking-widest">{review.location}</p></div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (<Star key={i} size={16} className={`${i < review.rating ? 'text-orange-500 fill-orange-500' : 'text-slate-200'}`} />))}
              </div>
              <p className="text-slate-600 font-medium italic leading-relaxed text-lg">"{review.comment}"</p>
              <div className="mt-8 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${review.location === 'Just Now' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{review.location === 'Just Now' ? 'New Review' : 'Verified Order'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] max-w-lg w-full p-10 shadow-2xl relative animate-scale-up border border-white">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
            <div className="bg-orange-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 rotate-3 shadow-inner"><PenLine className="text-orange-600 w-10 h-10" /></div>
            <h3 className="text-3xl font-black mb-1 font-poppins tracking-tight text-slate-900">Share Your Experience</h3>
            {reviewContext && <p className="text-orange-600 font-black text-xs uppercase tracking-widest mb-6">Reviewing: {reviewContext}</p>}
            
            <form onSubmit={submitReview} className="space-y-6">
              {!user && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Name</label>
                  <input type="text" required placeholder="E.g. Zaman Baba" value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-orange-100 outline-none font-bold text-lg" />
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setNewReview({...newReview, rating: star})} className="transition-all hover:scale-125">
                      <Star size={32} className={`${(hoveredStar || newReview.rating) >= star ? 'text-orange-500 fill-orange-500' : 'text-slate-200'}`} strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Thoughts</label>
                <textarea required rows={4} placeholder="Tell us what you loved..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-orange-100 outline-none font-bold text-lg resize-none" />
                <button 
                  type="button" 
                  onClick={handlePolishReview}
                  disabled={isPolishing || !newReview.comment}
                  className="absolute bottom-4 right-4 bg-orange-100 text-orange-600 p-2.5 rounded-xl hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 text-xs font-black"
                >
                  {isPolishing ? <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent animate-spin rounded-full" /> : <Wand2 size={16} />}
                  AI Polish
                </button>
              </div>
              <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xl hover:bg-orange-700 shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95">Post Review <Send size={20} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderRestaurant = () => (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6 mb-12">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input type="text" placeholder="What are you craving today?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-16 pr-6 py-5 rounded-[1.5rem] bg-white border border-slate-100 focus:ring-4 focus:ring-orange-100 outline-none shadow-sm text-lg font-semibold" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-5 rounded-[1.25rem] font-bold whitespace-nowrap transition-all text-lg shadow-sm border ${selectedCategory === cat ? 'bg-orange-600 text-white border-orange-600 shadow-xl' : 'bg-white text-slate-600 border-slate-100 hover:border-orange-200'}`}>{cat}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl transition-all group flex flex-col p-4">
            <div className="relative h-56 rounded-[1.75rem] overflow-hidden mb-6">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md"><Star size={14} className="text-orange-500 fill-orange-500" /><span className="text-sm font-black">{item.rating.toFixed(1)}</span></div>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button onClick={() => handleShowInsight(item)} className="bg-orange-600 text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all" title="AI Insight"><Sparkles size={18} /></button>
                <button onClick={() => openReviewModal(item.name)} className="bg-white text-slate-900 p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border border-slate-100" title="Review Item"><PenLine size={18} /></button>
              </div>
            </div>
            <div className="px-2 flex-grow flex flex-col">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-2">{item.name}</h4>
              <p className="text-slate-500 font-medium mb-6 line-clamp-2 leading-relaxed flex-grow">{item.description}</p>
              <div className="flex justify-between items-center mt-auto pb-2">
                <span className="text-3xl font-black text-orange-600">Rs {item.price}</span>
                <button onClick={() => addToCart(item)} className="bg-slate-900 text-white px-6 py-3.5 rounded-[1.25rem] font-black text-lg hover:bg-orange-600 transition-all shadow-lg flex items-center gap-2"><Plus size={20} strokeWidth={3} /> Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-6 mb-10">
        <button onClick={() => { setSelectedTrackingOrder(null); setCurrentStep('home'); }} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-4xl font-black font-poppins text-slate-900 tracking-tight">Track Your Feast</h2>
          <p className="text-slate-500 font-medium">{selectedTrackingOrder ? `Order #QB-${selectedTrackingOrder.id.slice(0, 8)} • ${selectedTrackingOrder.status}` : 'Rider is arriving soon'}</p>
        </div>
      </div>
      <MapView />
    </div>
  );

  const renderPayment = () => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const deliveryFee = 80;
    const grandTotal = subtotal + tax + deliveryFee;
    const processPayment = () => {
      setPaymentStatus('processing');
      setTimeout(() => {
        const newOrder: Order = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), userId: user?.id || 'guest', userName: user?.name || 'Guest User', items: [...cart], total: grandTotal, status: 'pending', paymentMethod: selectedPaymentMethod, timestamp: new Date().toISOString() };
        setOrders(prev => [newOrder, ...prev]);
        setPaymentStatus('success');
        setCart([]);
      }, 2500);
    };
    return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
       <div className="flex items-center gap-6 mb-10">
         <button onClick={() => setCurrentStep('home')} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
           <ChevronLeft size={24} />
         </button>
         <h2 className="text-4xl font-black font-poppins text-slate-900 tracking-tight">Checkout Securely</h2>
       </div>
      {paymentStatus === 'success' ? (
        <div className="bg-white rounded-[3rem] p-16 text-center shadow-2xl border border-emerald-50 space-y-8 animate-scale-up">
          <div className="bg-emerald-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce shadow-inner"><CheckCircle size={80} strokeWidth={2.5} /></div>
          <h3 className="text-4xl font-black font-poppins text-slate-900 mb-4">Order Placed!</h3>
          <p className="text-slate-500 text-xl max-w-md mx-auto leading-relaxed">Your feast is on its way. You can track your order status from your dashboard.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button onClick={() => { setPaymentStatus('idle'); setCurrentStep('home'); }} className="bg-orange-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-xl shadow-xl flex items-center justify-center gap-2">Track Order <ChevronRight size={24} /></button>
            <button onClick={() => { setPaymentStatus('idle'); setCurrentStep('home'); }} className="bg-slate-100 text-slate-700 px-10 py-5 rounded-[1.5rem] font-black text-xl hover:bg-slate-200 transition-all">Back to Home</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7"><div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100"><h3 className="text-2xl font-black mb-8 font-poppins text-slate-800">Payment Method</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <button onClick={() => setSelectedPaymentMethod('card')} className={`flex flex-col items-center gap-4 p-8 rounded-[2rem] border-2 transition-all ${selectedPaymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-slate-50 hover:border-orange-200 bg-slate-50'}`}><div className={`p-4 rounded-2xl ${selectedPaymentMethod === 'card' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}><CreditCard size={32} /></div><span className={`font-black text-sm uppercase tracking-widest ${selectedPaymentMethod === 'card' ? 'text-orange-900' : 'text-slate-400'}`}>Card</span></button>
            <button onClick={() => setSelectedPaymentMethod('wallet')} className={`flex flex-col items-center gap-4 p-8 rounded-[2rem] border-2 transition-all ${selectedPaymentMethod === 'wallet' ? 'border-orange-500 bg-orange-50' : 'border-slate-50 hover:border-orange-200 bg-slate-50'}`}><div className={`p-4 rounded-2xl ${selectedPaymentMethod === 'wallet' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}><Smartphone size={32} /></div><span className={`font-black text-sm uppercase tracking-widest ${selectedPaymentMethod === 'wallet' ? 'text-orange-900' : 'text-slate-400'}`}>Wallet</span></button>
            <button onClick={() => setSelectedPaymentMethod('cod')} className={`flex flex-col items-center gap-4 p-8 rounded-[2rem] border-2 transition-all ${selectedPaymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-slate-50 hover:border-orange-200 bg-slate-50'}`}><div className={`p-4 rounded-2xl ${selectedPaymentMethod === 'cod' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}><Banknote size={32} /></div><span className={`font-black text-sm uppercase tracking-widest ${selectedPaymentMethod === 'cod' ? 'text-orange-900' : 'text-slate-400'}`}>Cash</span></button>
          </div></div></div>
          <div className="lg:col-span-5"><div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-50 sticky top-28"><h3 className="text-2xl font-black mb-8 font-poppins text-slate-800">Your Order</h3><div className="space-y-6 mb-10">
            {cart.map(item => (<div key={item.id} className="flex justify-between items-center group"><div className="flex gap-4 items-center"><div className="w-12 h-12 rounded-[1rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-black text-slate-800 shadow-inner">{item.quantity}x</div><div><span className="text-slate-900 font-black text-lg block group-hover:text-orange-600 transition-colors">{item.name}</span><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.category}</span></div></div><span className="font-black text-xl text-slate-900">Rs {item.price * item.quantity}</span></div>))}
            <div className="h-px bg-slate-100 w-full my-8" /><div className="space-y-4 text-slate-500 font-bold"><div className="flex justify-between"><span>Subtotal</span><span className="text-slate-900">Rs {subtotal}</span></div><div className="flex justify-between"><span>Delivery</span><span className="text-emerald-600">Rs 80</span></div><div className="flex justify-between"><span>VAT (5%)</span><span className="text-slate-900">Rs {tax}</span></div></div>
            <div className="pt-8 mt-8 border-t-4 border-dashed border-slate-50"><div className="flex justify-between items-center"><span className="text-2xl font-black text-slate-900">Total</span><span className="text-4xl font-black text-orange-600">Rs {grandTotal}</span></div></div>
          </div><button onClick={processPayment} disabled={paymentStatus === 'processing' || cart.length === 0} className="w-full py-6 bg-orange-600 text-white rounded-[1.5rem] font-black text-2xl shadow-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-4 disabled:bg-slate-200">{paymentStatus === 'processing' ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" /> : 'Order Now'}</button></div></div>
        </div>
      )}
    </div>
    );
  };

  const Footer = () => (
    <footer className="bg-white border-t border-slate-100 mt-32 pt-24 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-2.5 rounded-[1rem] text-white shadow-lg rotate-3"><Sparkles size={28} /></div>
              <span className="text-3xl font-black font-poppins text-slate-900 tracking-tight">QuickBite AI</span>
            </div>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">Redefining food delivery with AI intelligence and a customer-first approach.</p>
            <div className="flex gap-5">
              {[ { Icon: Facebook, link: '#' }, { Icon: Twitter, link: '#' }, { Icon: Instagram, link: '#' }, { Icon: MessageCircle, link: 'https://wa.me/1234567890', color: 'hover:text-emerald-500 hover:bg-emerald-50' }, { Icon: Youtube, link: '#' } ].map(({ Icon, link, color }, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={`p-3 bg-slate-50 rounded-2xl text-slate-400 ${color || 'hover:text-orange-600 hover:bg-orange-50'} hover:scale-110 transition-all shadow-sm`}><Icon size={24} /></a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-black mb-6 font-poppins text-slate-400 uppercase tracking-widest">Explore</h4>
              <ul className="space-y-4">
                <li><button onClick={() => setCurrentStep('home')} className="text-slate-600 font-bold hover:text-orange-600 transition-all">Home</button></li>
                <li><button onClick={() => setCurrentStep('restaurant')} className="text-slate-600 font-bold hover:text-orange-600 transition-all">Menu</button></li>
                <li>{user?.role === 'admin' && <button onClick={() => setCurrentStep('admin')} className="text-orange-600 font-black hover:underline">Admin Deck</button>}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black mb-6 font-poppins text-slate-400 uppercase tracking-widest">Support</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-600 font-bold hover:text-orange-600 transition-all">Help Center</a></li>
                <li><a href="https://wa.me/1234567890" target="_blank" className="text-emerald-600 font-black hover:underline">WhatsApp</a></li>
                {/* User Address Integration */}
                <li className="flex items-start gap-2 pt-2 group">
                  <MapPin size={18} className="text-orange-600 flex-shrink-0 group-hover:animate-bounce" />
                  <span className="text-sm font-bold text-slate-600 leading-tight">
                    St.16 Ashraf Town<br/>
                    Chakwal
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <h4 className="text-sm font-black font-poppins text-slate-400 uppercase tracking-widest">Find Delivery Availability</h4>
            <form onSubmit={handleLocationCheck} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter your city/area" 
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button 
                type="submit"
                disabled={isCheckingLocation}
                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
              >
                {isCheckingLocation ? <Loader2 size={20} className="animate-spin" /> : <MapIcon size={20} />}
              </button>
            </form>

            {locationResult && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 animate-fade-in">
                <p className="text-sm text-slate-600 font-medium mb-3 leading-relaxed">{locationResult.text}</p>
                {locationResult.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {locationResult.links.map((link, i) => (
                      <a 
                        key={i} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 transition-all shadow-sm"
                      >
                        <MapIcon size={12} /> {link.title} <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Decorative Mini Map Preview */}
            {!locationResult && (
              <div className="h-32 bg-slate-100 rounded-2xl relative overflow-hidden group border border-slate-100">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&h=200&q=40')] bg-cover opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-xl flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-ping"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Live Service Maps</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-400 font-bold text-sm">© {new Date().getFullYear()} QuickBite AI Inc. Registered at Chakwal.</p>
        </div>
      </div>
    </footer>
  );

  if (currentStep === 'login') return renderLogin();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopPromoBanner />
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div onClick={() => setCurrentStep('home')} className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-orange-600 p-2.5 rounded-[1rem] text-white shadow-lg group-hover:rotate-12 transition-transform"><Sparkles size={28} /></div>
            <span className="text-3xl font-black font-poppins text-slate-900 hidden sm:inline tracking-tight">QuickBite AI</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-10 mr-10">
              <button onClick={() => setCurrentStep('home')} className={`text-lg font-black ${currentStep === 'home' ? 'text-orange-600' : 'text-slate-400 hover:text-orange-600'}`}>Home</button>
              <button onClick={() => setCurrentStep('restaurant')} className={`text-lg font-black ${currentStep === 'restaurant' ? 'text-orange-600' : 'text-slate-400 hover:text-orange-600'}`}>Menu</button>
              {user?.role === 'admin' && <button onClick={() => setCurrentStep('admin')} className={`text-lg font-black ${currentStep === 'admin' ? 'text-orange-600' : 'text-slate-400 hover:text-orange-600'}`}>Admin</button>}
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsCartOpen(true)} className="relative bg-slate-100 p-4 rounded-2xl text-slate-700 hover:bg-orange-600 hover:text-white transition-all shadow-inner"><ShoppingCart size={24} />{cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}</button>
              <div className="flex items-center gap-4 bg-slate-100 pr-5 pl-2 py-2 rounded-2xl border border-slate-100 group relative">
                <img src={user?.avatar} alt="User" className="w-11 h-11 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                <div className="hidden lg:block"><span className="font-black text-sm text-slate-800 block line-clamp-1">{user?.name}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role} Account</span></div>
                <button onClick={() => { setUser(null); setCurrentStep('login'); setCart([]); }} className="ml-2 text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-white rounded-xl"><LogOut size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow">{currentStep === 'home' && renderHome()}{currentStep === 'restaurant' && renderRestaurant()}{currentStep === 'map' && renderMap()}{currentStep === 'payment' && renderPayment()}{currentStep === 'admin' && <AdminPanel orders={orders} onUpdateOrderStatus={updateOrderStatus} inventory={inventory} onDeleteMenuItem={deleteMenuItem} onAddMenuItem={addMenuItem} />}</main>
      <Footer />
      {isCartOpen && <Cart items={cart} onUpdateQuantity={updateCartQuantity} onRemove={removeFromCart} onCheckout={() => { setIsCartOpen(false); setCurrentStep('payment'); }} onClose={() => setIsCartOpen(false)} />}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 0% { transform: translateY(0px) rotate(12deg); } 50% { transform: translateY(-20px) rotate(12deg); } 100% { transform: translateY(0px) rotate(12deg); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-up { animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-shimmer { background-size: 200% auto; animation: shimmer 5s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
