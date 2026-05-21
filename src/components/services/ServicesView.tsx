import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Clock, DollarSign, XCircle, CheckCircle, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { ConfirmationModal, type ConfirmationType } from '../common/ConfirmationModal';

type Service = Database['public']['Tables']['services']['Row'];
type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];

type FilterType = 'all' | 'active' | 'inactive';

interface ConfirmationState {
  isOpen: boolean;
  type: ConfirmationType;
  serviceId: string | null;
  serviceName: string;
  currentStatus: boolean;
}

export function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [filter, setFilter] = useState<FilterType>('active');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    type: 'deactivate',
    serviceId: null,
    serviceName: '',
    currentStatus: true,
  });

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const openConfirmation = (
    type: ConfirmationType,
    serviceId: string,
    serviceName: string,
    currentStatus: boolean
  ) => {
    setConfirmation({
      isOpen: true,
      type,
      serviceId,
      serviceName,
      currentStatus,
    });
  };

  const closeConfirmation = () => {
    setConfirmation({
      isOpen: false,
      type: 'deactivate',
      serviceId: null,
      serviceName: '',
      currentStatus: true,
    });
  };

  const handleToggleActive = async () => {
    if (!confirmation.serviceId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({ active: !confirmation.currentStatus })
        .eq('id', confirmation.serviceId);

      if (error) throw error;

      await loadServices();
      closeConfirmation();
    } catch (error: any) {
      alert(error.message || 'Failed to update service status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmation.serviceId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', confirmation.serviceId);

      if (error) throw error;

      await loadServices();
      closeConfirmation();
    } catch (error: any) {
      alert(error.message || 'Failed to delete service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (confirmation.type === 'delete') {
      handleDelete();
    } else {
      handleToggleActive();
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const filteredServices = services.filter((service) => {
    if (filter === 'active') return service.active;
    if (filter === 'inactive') return !service.active;
    return true;
  });

  const groupedServices = categories.map(category => ({
    category,
    services: filteredServices.filter(s => s.category_id === category.id),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading services...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-600 mt-1">Manage your salon services and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filter:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Active ({services.filter((s) => s.active).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'inactive'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Inactive ({services.filter((s) => !s.active).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({services.length})
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {groupedServices.map(({ category, services: categoryServices }) => (
          <div key={category.id}>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{category.name}</h2>
            {categoryServices.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
                No services in this category
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                          {!service.active && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    {service.description && (
                      <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-900 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>{service.base_price}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                      {service.active ? (
                        <button
                          onClick={() =>
                            openConfirmation('deactivate', service.id, service.name, service.active)
                          }
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            openConfirmation('reactivate', service.id, service.name, service.active)
                          }
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() =>
                          openConfirmation('delete', service.id, service.name, service.active)
                        }
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <ServiceModal
          service={editingService}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadServices();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        type={confirmation.type}
        title={
          confirmation.type === 'delete'
            ? 'Delete Service'
            : confirmation.type === 'deactivate'
            ? 'Deactivate Service'
            : 'Reactivate Service'
        }
        message={
          confirmation.type === 'delete'
            ? 'Are you sure you want to permanently delete this service?'
            : confirmation.type === 'deactivate'
            ? 'Are you sure you want to deactivate this service?'
            : 'Are you sure you want to reactivate this service?'
        }
        itemName={confirmation.serviceName}
        onConfirm={handleConfirm}
        onCancel={closeConfirmation}
        isProcessing={isProcessing}
      />
    </div>
  );
}

interface ServiceModalProps {
  service: Service | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSave: () => void;
}

function ServiceModal({ service, categories, onClose, onSave }: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    category_id: service?.category_id || categories[0]?.id || '',
    duration_minutes: service?.duration_minutes || 30,
    base_price: service?.base_price || 0,
    active: service?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (service) {
        const { error } = await supabase
          .from('services')
          .update(formData)
          .eq('id', service.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([formData]);

        if (error) throw error;
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {service ? 'Edit Service' : 'Add Service'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Duration
              </label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              >
                {[15, 30, 45, 60, 75, 90, 105, 120].map((min) => (
                  <option key={min} value={min}>
                    {min < 60
                      ? `${min} min`
                      : min % 60 === 0
                      ? `${min / 60} h`
                      : `${Math.floor(min / 60)} h ${min % 60} min`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price
              </label>
              <input
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
            />
            <label htmlFor="active" className="text-sm text-slate-700">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : service ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
