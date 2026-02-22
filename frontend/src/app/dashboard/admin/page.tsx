'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  DollarSign,
  Star,
  Plus,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  Users,
  Edit3,
  X,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PlanConfig {
  _id: string;
  planId: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  signalsPerDay: any;
  highlighted: boolean;
  isActive: boolean;
}

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  isVisible: boolean;
  order: number;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'plans' | 'testimonials' | 'stats'>('plans');
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // New testimonial form
  const [showForm, setShowForm] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, testimonialsRes, statsRes] = await Promise.allSettled([
        adminAPI.getPlans(),
        adminAPI.getTestimonials(),
        adminAPI.getStats(),
      ]);

      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data.plans || []);
      if (testimonialsRes.status === 'fulfilled') setTestimonials(testimonialsRes.value.data.testimonials || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlanPrice = async (planId: string, newPrice: number) => {
    setSavingPlan(planId);
    try {
      await adminAPI.updatePlan(planId, { price: newPrice });
      setPlans((prev) =>
        prev.map((p) => (p.planId === planId ? { ...p, price: newPrice } : p))
      );
      toast.success(`${planId} plan price updated to $${newPrice}`);
    } catch {
      toast.error('Failed to update plan price');
    } finally {
      setSavingPlan(null);
    }
  };

  const handleUpdatePlanFeatures = async (planId: string, features: string[]) => {
    setSavingPlan(planId);
    try {
      await adminAPI.updatePlan(planId, { features });
      setPlans((prev) =>
        prev.map((p) => (p.planId === planId ? { ...p, features } : p))
      );
      toast.success('Features updated');
    } catch {
      toast.error('Failed to update features');
    } finally {
      setSavingPlan(null);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.name || !newTestimonial.role || !newTestimonial.text) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await adminAPI.createTestimonial(newTestimonial);
      setTestimonials((prev) => [data.testimonial, ...prev]);
      setNewTestimonial({ name: '', role: '', text: '', rating: 5 });
      setShowForm(false);
      toast.success('Testimonial added!');
    } catch {
      toast.error('Failed to add testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await adminAPI.deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((t) => t._id !== id));
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Failed to delete testimonial');
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      await adminAPI.updateTestimonial(id, { isVisible: !isVisible });
      setTestimonials((prev) =>
        prev.map((t) => (t._id === id ? { ...t, isVisible: !isVisible } : t))
      );
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark-400">Admin Access Required</h2>
          <p className="text-dark-500 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">Admin Panel</h1>
        <p className="text-dark-400">Manage plans, testimonials, and platform settings</p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Users</span>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Active Subs</span>
            <p className="text-2xl font-bold text-primary-400">{stats.activeSubscriptions}</p>
          </div>
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Revenue</span>
            <p className="text-2xl font-bold text-buy">${stats.revenue}</p>
          </div>
          <div className="stat-card">
            <span className="text-xs text-dark-400 uppercase">Signals</span>
            <p className="text-2xl font-bold">{stats.signalsGenerated}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700 pb-2">
        {[
          { key: 'plans' as const, label: 'Plan Pricing', icon: DollarSign },
          { key: 'testimonials' as const, label: 'Testimonials', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-primary-600/15 text-primary-400 border border-primary-500/30'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plan Pricing Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <p className="text-sm text-dark-400">
            Modify the price of each subscription plan. Changes are applied immediately.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan.planId} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <span className="text-xs text-dark-400 uppercase">{plan.planId}</span>
                  </div>
                  {plan.highlighted && (
                    <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-sm text-dark-400 mb-1 block">Price ($/month)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={plan.price}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((p) =>
                            p.planId === plan.planId
                              ? { ...p, price: parseFloat(e.target.value) || 0 }
                              : p
                          )
                        )
                      }
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => handleUpdatePlanPrice(plan.planId, plan.price)}
                      disabled={savingPlan === plan.planId}
                      className="btn-primary flex items-center gap-1 px-4"
                    >
                      {savingPlan === plan.planId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Features</label>
                  <div className="space-y-1">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={f}
                          onChange={(e) => {
                            const updated = [...plan.features];
                            updated[i] = e.target.value;
                            setPlans((prev) =>
                              prev.map((p) =>
                                p.planId === plan.planId ? { ...p, features: updated } : p
                              )
                            );
                          }}
                          className="input-field text-xs py-1 flex-1"
                        />
                        <button
                          onClick={() => {
                            const updated = plan.features.filter((_, idx) => idx !== i);
                            setPlans((prev) =>
                              prev.map((p) =>
                                p.planId === plan.planId ? { ...p, features: updated } : p
                              )
                            );
                          }}
                          className="text-dark-500 hover:text-sell"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          setPlans((prev) =>
                            prev.map((p) =>
                              p.planId === plan.planId
                                ? { ...p, features: [...p.features, ''] }
                                : p
                            )
                          )
                        }
                        className="text-xs text-primary-400 hover:underline"
                      >
                        + Add feature
                      </button>
                      <button
                        onClick={() => handleUpdatePlanFeatures(plan.planId, plan.features)}
                        className="text-xs text-buy hover:underline ml-auto"
                      >
                        Save features
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials Tab */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-400">
              Manage client reviews displayed on the landing page.
            </p>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Testimonial
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="card border-primary-500/30">
              <h3 className="font-semibold mb-4">New Testimonial</h3>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Client Name</label>
                  <input
                    type="text"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial((p) => ({ ...p, name: e.target.value }))}
                    placeholder="John D."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Role</label>
                  <input
                    type="text"
                    value={newTestimonial.role}
                    onChange={(e) => setNewTestimonial((p) => ({ ...p, role: e.target.value }))}
                    placeholder="Crypto Trader"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-sm text-dark-400 mb-1 block">Review Text</label>
                <textarea
                  value={newTestimonial.text}
                  onChange={(e) => setNewTestimonial((p) => ({ ...p, text: e.target.value }))}
                  placeholder="This platform changed my trading..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-dark-400 mb-1 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setNewTestimonial((p) => ({ ...p, rating: r }))}
                    >
                      <Star
                        className={cn(
                          'w-6 h-6 transition-colors',
                          r <= newTestimonial.rating
                            ? 'text-warning fill-warning'
                            : 'text-dark-600'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddTestimonial}
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Testimonial List */}
          <div className="space-y-3">
            {testimonials.length === 0 ? (
              <div className="card text-center py-8">
                <MessageSquare className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">No testimonials yet. Add the first one!</p>
              </div>
            ) : (
              testimonials.map((t) => (
                <div
                  key={t._id}
                  className={cn('card flex items-start justify-between gap-4', !t.isVisible && 'opacity-50')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{t.name}</p>
                      <span className="text-xs text-dark-400">{t.role}</span>
                      <div className="flex gap-0.5 ml-2">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="w-3 h-3 text-warning fill-warning" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-dark-300">&quot;{t.text}&quot;</p>
                    {!t.isVisible && (
                      <span className="text-xs text-sell mt-1 inline-block">Hidden</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleVisibility(t._id, t.isVisible)}
                      className="text-xs px-2 py-1 rounded bg-dark-800 text-dark-400 hover:text-white transition-colors"
                    >
                      {t.isVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(t._id)}
                      className="text-dark-500 hover:text-sell transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
