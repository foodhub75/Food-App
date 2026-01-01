
import React from 'react';
import { OrderItem } from '../types';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';

interface CartProps {
  items: OrderItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onClose: () => void;
}

export const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemove, onCheckout, onClose }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
        <div className="p-4 border-b flex justify-between items-center bg-orange-500 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="text-xl font-bold">Your Cart</h2>
          </div>
          <button onClick={onClose} className="hover:bg-orange-600 p-1 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingBag size={64} strokeWidth={1} className="mb-4" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-xl">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-orange-600 font-bold">Rs {item.price}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1 rounded-full bg-white border shadow-sm hover:bg-slate-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1 rounded-full bg-white border shadow-sm hover:bg-slate-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-red-500">
                  <X size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t bg-slate-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600">Total Amount</span>
              <span className="text-2xl font-bold text-orange-600">Rs {total}</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors"
            >
              Checkout Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
