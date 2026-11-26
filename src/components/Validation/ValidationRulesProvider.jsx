import { useEffect, useState } from 'react';
import { ValidationRulesContext } from '../../hooks/validationRulesContext';
import { getValidationRules, loadValidationRulesSync, VALIDATION_RULES_CHANGED } from '../../services/validationService';

export default function ValidationRulesProvider({ children }) {
  const [rules, setRules] = useState(() => loadValidationRulesSync());

  useEffect(() => {
    let cancelled = false;
    const reload = () => getValidationRules().then(r => { if (!cancelled) setRules(r); });
    // שינוי בלשונית אחרת (storage) או במסך הניהול באותה לשונית
    const onStorage = (e) => { if (!e.key || e.key === 'appValidationRules') reload(); };
    window.addEventListener(VALIDATION_RULES_CHANGED, reload);
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(VALIDATION_RULES_CHANGED, reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return <ValidationRulesContext.Provider value={rules}>{children}</ValidationRulesContext.Provider>;
}
