import { createContext, useContext } from 'react';
import { loadValidationRulesSync } from '../services/validationService';

// ההגדרות של הוולידציות לכל המסכים (נטענות פעם אחת ומתעדכנות כשמנהל המערכת שומר)
export const ValidationRulesContext = createContext(null);

export const useValidationRules = () => useContext(ValidationRulesContext) ?? loadValidationRulesSync();
