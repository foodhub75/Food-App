
import React, { useState } from 'react';
import { 
  BarChart3, Package, Users, Settings, TrendingUp, 
  Clock, CheckCircle, Truck, MoreVertical, Plus, Edit2, Trash2, X
} from 'lucide-react';
import { Order, MenuItem } from '../types';
import { CATEGORIES } from '../constants';

interface AdminPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  inventory: MenuItem[];
  onDeleteMenuItem: (id: string) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id' | 'rating'>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  orders, 
  onUpdateOrderStatus, 
  inventory,
  onDeleteMenuItem,
  onAddMenuItem
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: 0,
    category: 'Burger' as MenuItem['category'],
    description: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300'
  });

  const stats = {
    revenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMenuItem(newItem);
    setIsAddModalOpen(false);
    setNewItem({
      name: '',
      price: 0,
      category: 'Burger',
      description: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <BarChart3 size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Package size={20} /> Orders Management
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Settings size={20} /> Menu Inventory
          </button>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`Rs ${stats.revenue}`} icon={<TrendingUp />} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Active Orders" value={stats.totalOrders} icon={<Package />} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label="Pending" value={stats.pending} icon={<Clock />} color="text-orange-600" bg="bg-orange-50" />
                <StatCard label="Delivered" value={stats.delivered} icon={<CheckCircle />} color="text-purple-600" bg="bg-purple-50" />
              </div>
              
              <div className="bg-white rounded-3xl p-8 border shadow-sm">
                <h3 className="text-xl font-bold mb-6 font-poppins">Recent Activity</h3>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-slate-400 text-center py-8 italic">No orders recorded yet.</p>
                  ) : (
                    orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-3 rounded-xl border font-bold text-slate-400">#{order.id.slice(-4)}</div>
                          <div>
                            <p className="font-bold">{order.userName}</p>
                            <p className="text-xs text-slate-500">{new Date(order.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                        <p className="font-bold text-slate-800">Rs {order.total}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold font-poppins">Live Orders</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">Real-time update enabled</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No orders currently active.</td></tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-500">#{order.id.slice(-4)}</td>
                          <td className="px-6 py-4 font-semibold">{order.userName}</td>
                          <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                          <td className="px-6 py-4 text-sm text-slate-500">{order.items.length} items</td>
                          <td className="px-6 py-4">
                            <select 
                              value={order.status}
                              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                              className="bg-white border rounded-lg px-3 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold font-poppins">Menu Inventory</h3>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                >
                  <Plus size={20} /> Add New Item
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map(item => (
                  <div key={item.id} className="bg-white rounded-3xl p-5 border shadow-sm flex gap-4 group">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-2xl group-hover:scale-105 transition-transform" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold line-clamp-1">{item.name}</h4>
                        <div className="flex gap-1">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => onDeleteMenuItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{item.category}</p>
                      <p className="text-orange-600 font-extrabold">Rs {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setIsAddModalOpen(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6 font-poppins text-slate-900">Add New Menu Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
                <input 
                  type="text" required
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Classic Cheesecake"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Price (Rs)</label>
                  <input 
                    type="number" required
                    value={newItem.price || ''}
                    onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select 
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value as MenuItem['category']})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                  >
                    {CATEGORIES.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                <input 
                  type="url" required
                  value={newItem.image}
                  onChange={e => setNewItem({...newItem, image: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  placeholder="Describe the dish..."
                ></textarea>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
    <div className={`${bg} ${color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const styles = {
    pending: 'bg-orange-100 text-orange-600',
    preparing: 'bg-blue-100 text-blue-600',
    shipped: 'bg-purple-100 text-purple-600',
    delivered: 'bg-emerald-100 text-emerald-600'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
};
