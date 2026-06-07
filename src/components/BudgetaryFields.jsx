import React from 'react';

export default function BudgetaryFields() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">פרויקט</label>
        <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">בחר פרויקט...</option>
          <option value="1">שדרוג תשתיות מחשוב 2026</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">משימה</label>
        <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">בחר משימה...</option>
          <option value="1">רכש חומרה מרכזית</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">סוג הוצאה</label>
        <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">בחר סוג הוצאה...</option>
          <option value="4">רכש למלאי</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">יחידה מממנת</label>
        <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">בחר יחידה...</option>
          <option value="1">מנו"ר הנהלה</option>
        </select>
      </div>
    </div>
  );
}