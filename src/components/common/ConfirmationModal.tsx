import { AlertTriangle, Trash2, XCircle, CheckCircle } from 'lucide-react';

export type ConfirmationType = 'delete' | 'deactivate' | 'reactivate';

interface ConfirmationModalProps {
  isOpen: boolean;
  type: ConfirmationType;
  title: string;
  message: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ConfirmationModal({
  isOpen,
  type,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isProcessing = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'delete':
        return {
          icon: <Trash2 className="w-12 h-12 text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          buttonText: 'Delete Permanently',
          processingText: 'Deleting...',
        };
      case 'deactivate':
        return {
          icon: <XCircle className="w-12 h-12 text-orange-600" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-900',
          buttonBg: 'bg-orange-600 hover:bg-orange-700',
          buttonText: 'Deactivate',
          processingText: 'Deactivating...',
        };
      case 'reactivate':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          buttonText: 'Reactivate',
          processingText: 'Reactivating...',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-full p-3 mb-4`}>
            {config.icon}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-600">{message}</p>
        </div>

        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-6`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-5 h-5 ${config.textColor} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`font-semibold ${config.textColor} mb-1`}>
                {type === 'delete' ? 'This action cannot be undone!' :
                 type === 'deactivate' ? 'This item will be hidden from customers' :
                 'This item will be visible to customers again'}
              </p>
              <p className="text-sm text-slate-700">
                {type === 'delete' &&
                  'All data associated with this item will be permanently removed from the system. Existing appointments may be affected.'}
                {type === 'deactivate' &&
                  'The item will remain in the database but will not be available for new bookings. You can reactivate it later.'}
                {type === 'reactivate' &&
                  'The item will be available for new bookings immediately.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-6 border border-slate-200">
          <p className="text-sm text-slate-600">Item to {type}:</p>
          <p className="font-semibold text-slate-900 mt-1">{itemName}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 ${config.buttonBg} text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? config.processingText : config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
