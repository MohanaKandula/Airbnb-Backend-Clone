import React from 'react';
import { User, Trash2, Edit2, ShieldAlert } from 'lucide-react';

const GuestCard = ({ guest, onEdit, onDelete }) => {
  const { id, name, age, gender, isPrimary = false } = guest;

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-xs transition duration-200 hover:shadow-md flex items-center justify-between gap-4 ${
      isPrimary ? 'border-brand/40 ring-1 ring-brand/10' : 'border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isPrimary ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'
        }`}>
          <User className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate max-w-[150px] sm:max-w-xs">{name}</h4>
            {isPrimary && (
              <span className="bg-brand/10 text-brand font-bold text-[10px] px-2 py-0.5 rounded-full border border-brand/20">
                Primary
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {gender} • {age} Years Old
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {onEdit && (
          <button
            onClick={() => onEdit(guest)}
            className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition cursor-pointer"
            title="Edit Guest Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        
        {onDelete && !isPrimary && (
          <button
            onClick={() => onDelete(id)}
            className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition cursor-pointer"
            title="Delete Guest Profile"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GuestCard;
