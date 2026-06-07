import React, { useState } from 'react';
import NavbarLogo from './NavbarLogo';
import NavOrg from './NavOrg';
import NavSearch from './NavSearch';
import NavNikraLink from './NavNikraLink';
import NavNonCatalogBtn from './NavNonCatalogBtn';
import NavUserReq from './NavUserReq';
import KnowledgeAndProcDocs from './KnowledgeAndProcDocs';
import NonCatalogModal from './NonCatalogModal';
import DefaultsAndFavorites from './DefaultsAndFavorites';
import DefaultsModal from './DefaultsModal';
import NavLogoutBtn from './NavLogoutBtn';
import NavCart from './NavCart';

// 1. הוספנו את הפרופס של העגלה ושל ארגון המלאי לחתימה
export default function Navbar({ 
  currentUser, 
  onLogout, 
  isDarkMode, 
  onToggleDarkMode, 
  onNavigate,
  cartLines,      // <--- תוספת
  onUpdateQty,    // <--- תוספת
  globalOrg,      // <--- תוספת
  setGlobalOrg    // <--- תוספת
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDefaultsModalOpen, setIsDefaultsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (path, payload = null) => {
    onNavigate(path, payload);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
        
        <div className="px-2 sm:px-4 md:px-6 py-2 md:py-4 flex items-center justify-between gap-1 sm:gap-2 md:gap-4 w-full flex-nowrap">

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 2xl:gap-6 flex-1 min-w-0">
            <div className="shrink-0">
              <NavbarLogo />
            </div>

            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0"></div>

            <div className="shrink-0">
              {/* אפשר גם להעביר את globalOrg ו-setGlobalOrg לכאן אם NavOrg משתמש בהם */}
              <NavOrg />
            </div>

            <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
              <NavSearch onNavigate={handleNavigate} />
              <NavNonCatalogBtn onOpenModal={() => setIsModalOpen(true)} />

              <div className="hidden 2xl:flex items-center gap-4 shrink-0 ms-2">
                 <NavUserReq onNavigate={() => handleNavigate('requisitions')} />
                 <KnowledgeAndProcDocs onNavigate={handleNavigate} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
            <div className="hidden md:block shrink-0">
              <NavNikraLink />
            </div>

            <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-700 shrink-0"></div>

            {/* 2. הנה התיקון המשמעותי: מעבירים את המידע ל-NavCart */}
            <NavCart 
              cartLines={cartLines} 
              onUpdateQty={onUpdateQty} 
              onNavigate={handleNavigate} 
            />

            <button
              onClick={onToggleDarkMode}
              className="p-1 md:p-2 text-lg md:text-xl rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer shrink-0"
              title="החלף מצב תצוגה"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <div className="hidden md:flex items-center justify-center border-e-2 border-gray-200 dark:border-gray-600 pe-3 md:pe-5 me-1 shrink-0 min-w-[200px]">
              <DefaultsAndFavorites 
                currentUser={currentUser}
                onNavigate={handleNavigate} 
                onOpenDefaultsModal={() => setIsDefaultsModalOpen(true)} 
              />
            </div>

            <NavLogoutBtn onLogout={onLogout} />

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="2xl:hidden flex items-center justify-center p-1 sm:p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`2xl:hidden w-full bg-white dark:bg-gray-800 transition-all duration-300 overflow-hidden shadow-inner ${
            isMobileMenuOpen ? 'max-h-[750px] border-t border-gray-100 dark:border-gray-700' : 'max-h-0'
          }`}
        >
          <div className="px-6 py-4 flex flex-col gap-6 overflow-y-auto max-h-[700px]">

            <div className="md:hidden flex flex-col gap-5">
              
              <div className="flex justify-between items-start bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                <div className="flex-1 min-w-0">
                  <DefaultsAndFavorites 
                    currentUser={currentUser}
                    onNavigate={handleNavigate} 
                    onOpenDefaultsModal={() => { setIsDefaultsModalOpen(true); setIsMobileMenuOpen(false); }} 
                  />
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 pt-2">
                <NavNikraLink />
              </div>
            </div>

            <div className="flex flex-col items-start gap-4">
              <div className="md:hidden w-full h-px bg-gray-100 dark:bg-gray-700"></div>
              <NavUserReq onNavigate={() => handleNavigate('requisitions')} />
              <KnowledgeAndProcDocs onNavigate={handleNavigate} />
            </div>

          </div>
        </div>
      </header>

      <NonCatalogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <DefaultsModal isOpen={isDefaultsModalOpen} onClose={() => setIsDefaultsModalOpen(false)} />
    </>
  );
}