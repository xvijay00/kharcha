import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../hooks/useBusiness';
import { BUSINESS_TYPES } from '../../lib/constants';
import {
  Store,
  MapPin,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  Pill,
  Hotel,
  UtensilsCrossed,
  Cake,
  Smartphone,
} from 'lucide-react';
import type { BusinessType, BusinessFormData } from '../../types';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  ShoppingCart,
  Pill,
  Hotel,
  UtensilsCrossed,
  Cake,
  Smartphone,
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { createBusiness } = useBusiness();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    business_type: 'grocery',
    gstin: '',
    address: '',
  });

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      setError('Please enter a business name');
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await createBusiness(formData);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create business';
      setError(msg);
      setLoading(false);
    }
  };

  const selectedBizMeta = BUSINESS_TYPES.find((b) => b.value === formData.business_type);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between py-6 px-4 max-w-lg mx-auto">
      {/* Header & Stepper */}
      <div>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2 shadow-md">
            ₹
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Your Business</h1>
          <p className="text-sm text-gray-500">Step {step} of 3</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-10 bg-blue-600'
                  : s < step
                  ? 'w-6 bg-blue-300'
                  : 'w-6 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sharma Kirana & General Store"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  GSTIN <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={formData.gstin || ''}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Shop / Business Address <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., Shop #4, Market Complex, MG Road"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Type */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Select your business type to automatically configure categories, units, and modules.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((bt) => {
                const IconComponent = ICON_MAP[bt.icon] || Store;
                const isSelected = formData.business_type === bt.value;
                return (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, business_type: bt.value as BusinessType })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {bt.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{bt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirmation */}
        {step === 3 && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                {selectedBizMeta && (
                  (() => {
                    const IconComp = ICON_MAP[selectedBizMeta.icon] || Store;
                    return <IconComp className="w-6 h-6" />;
                  })()
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{formData.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{selectedBizMeta?.label}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-400">GSTIN:</span>
                <span className="font-mono font-medium text-gray-800">{formData.gstin || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-400">Address:</span>
                <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">
                  {formData.address || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-400">Default Modules:</span>
                <span className="font-medium text-green-600">Tailored to {selectedBizMeta?.label}</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-700">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Default income/expense categories and units will be automatically created. You can customize them anytime.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="flex-1 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-500/20"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-500/20 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Business...</span>
              </>
            ) : (
              <>
                <span>Launch Business</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
