import React, { useState } from 'react';
import data from '../data/data.json';

export default function CheckoutLineRow({ 
  line, 
  index, 
  isSelected, 
  onToggleSelect, 
  onLineOrgChange, 
  onLineFieldChange, 
  onRemoveLine, 
  currentUser,
  onOpenDocs,
  activeTab 
}) {
  const isForeignCurrency = line.currency && line.currency !== 'ILS';
  const [isPriceEditable] = useState(!line.unitPrice || line.unitPrice === 0);

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
      
      {/* --- שדות נעוצים (Fixed) --- */}
      <td className="p-4 text-center w-12">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect(line.id)}
          className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      </td>
      <td className="p-4 text-center font-mono text-gray-500 dark:text-gray-400 font-semibold w-16">{index}</td>
      <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-300 w-28">
        {line.sku || <span className="text-gray-400 italic">ללא מק"ט</span>}
      </td>
      <td className="p-4 font-semibold text-gray-900 dark:text-white truncate max-w-[250px] w-[200px]" title={line.itemDescription}>
        {line.itemDescription}
      </td>

      {/* --- כרטיסיית מידע כללי ופיננסי --- */}
      {activeTab === 'general' && (
        <>
          <td className="p-4 w-24">
            <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold ${
              line.lineType === 'טובין' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
            }`}>
              {line.lineType || 'טובין'}
            </span>
          </td>
          <td className="p-4 w-24">
            <input 
              type="number" 
              min="1"
              value={line.quantity || 1}
              onChange={(e) => onLineFieldChange(line.id, 'quantity', Number(e.target.value))}
              className="w-16 p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-center font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </td>
          <td className="p-4 text-gray-600 dark:text-gray-300 font-medium text-xs w-20">{line.uom}</td>
          <td className="p-4 w-32">
            {isPriceEditable ? (
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={line.unitPrice || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'unitPrice', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-24 p-1.5 border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-center font-bold text-amber-700 dark:text-amber-400 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            ) : (
              <div className="font-bold text-gray-900 dark:text-white">
                ₪{Number(line.unitPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            )}
          </td>
          <td className="p-4 w-36">
            <input 
              type="date" 
              value={line.needByDate || ''}
              onChange={(e) => onLineFieldChange(line.id, 'needByDate', e.target.value)}
              className="p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono w-full"
            />
          </td>
          <td className="p-4 w-32">
            <select 
              value={line.inventoryOrg || ''}
              onChange={(e) => onLineOrgChange(line.id, e.target.value)}
              className="w-full p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              {data.inventoryOrganizations?.map(org => (
                <option key={org.id} value={org.id}>{org.code}</option>
              ))}
            </select>
          </td>
        </>
      )}

      {/* --- כרטיסיית ספק מומלץ --- */}
      {activeTab === 'supplier' && (
        <>
          <td className="p-4 w-40">
            <select 
              value={line.buyer || ''} 
              onChange={(e) => onLineFieldChange(line.id, 'buyer', e.target.value)}
              className="w-full p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">בחר ספק...</option>
              {data.suppliers?.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.id}</option>
              ))}
            </select>
          </td>
          <td className="p-4 w-36">
            <select className="w-full p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">בחר אתר...</option>
            </select>
          </td>
          <td className="p-4 w-36">
            <select className="w-full p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">בחר קניין...</option>
              {data.buyers?.map((b, i) => (
                <option key={b.id || i} value={b.id}>{b.name}</option>
              ))}
            </select>
          </td>
        </>
      )}

      {/* --- כרטיסיית מידע נוסף --- */}
      {activeTab === 'additional' && (
        <>
          <td className="p-4 w-40">
            <select 
              value={line.qualityRequirement || ''}
              onChange={(e) => onLineFieldChange(line.id, 'qualityRequirement', e.target.value)}
              className="w-full p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value=""></option>
              {data.qualityRequirements?.map((q, i) => (
                <option key={q.id || i} value={q.id}>{q.name}</option>
              ))}
            </select>
          </td>
          <td className="p-4 w-40">
            <select 
              value={line.serviceApprover || currentUser?.firstName || ''}
              onChange={(e) => onLineFieldChange(line.id, 'serviceApprover', e.target.value)}
              className="w-full p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{currentUser?.firstName || 'מאשר שירות'}</option>
              {data.users?.map(u => (
                <option key={u.id} value={u.firstName}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </td>
        </>
      )}

      {/* --- עמודות קבועות (פעולות) --- */}
      <td className="p-4 text-center border-l border-gray-50 dark:border-gray-700/50 w-28">
        <button 
          onClick={() => onOpenDocs(line.id)}
          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
        >
          מסמכים
        </button>
      </td>
      <td className="p-4 text-center w-32">
        <div className="flex items-center justify-center gap-2">
          <button className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer">
            עריכה
          </button>
          <button 
            onClick={() => onRemoveLine(line.id)}
            className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            הסרה
          </button>
        </div>
      </td>
    </tr>
  );
}