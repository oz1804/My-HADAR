import React, { useState } from 'react';
import usersData from '../data/data.json';
import { runScreen, visibleMessages, messagesFor, hasBlocking } from '../utils/validationEngine';
import { loginContext } from '../utils/validationScreens';
import { useValidationRules } from '../hooks/validationRulesContext';
import { FieldLabelRow, FieldMessageBelow } from './Validation/FieldMessage';
import { fieldToneClass } from './Validation/fieldTone';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  // ולידציות מסך הכניסה (מוגדרות במסך ניהול המערכת)
  const rules = useValidationRules();
  const [attempted, setAttempted] = useState(false);
  const allMessages = runScreen('LOGIN', loginContext({ username }), rules);
  const usernameMessages = messagesFor(visibleMessages(allMessages, attempted), 'username');

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (hasBlocking(allMessages)) return;
    const foundUser = usersData.users.find(
      user => user.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (foundUser) onLogin(foundUser);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-300">
      
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 transition-colors duration-300">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            התחברות למערכת הד"ר
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            הזן את שם המשתמש שלך כדי להמשיך
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div data-validation-field="username">
            <FieldLabelRow messages={usernameMessages}>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                שם משתמש
              </label>
            </FieldLabelRow>
            <input
              id="username"
              name="username"
              type="text"
              // הסרנו את ה-dir="ltr" והוספנו text-start שמוודא שהטקסט מתחיל מהצד הנכון
              className={`w-full px-4 py-3 text-start rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${fieldToneClass(usernameMessages)}`}
              placeholder="הזן את שם המשתמש באנגלית"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <FieldMessageBelow messages={usernameMessages} />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
          >
            היכנס
          </button>
        </form>
        
      </div>
    </div>
  );
}