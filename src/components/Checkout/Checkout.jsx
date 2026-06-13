import React, { useState } from 'react';
import CheckoutHeader from './CheckoutHeader';
import CheckoutLines from './CheckoutLines';
import useCheckout from './UseCheckout'; 
import ApprovalRoutingDrawer from './ApprovalRoutingDrawer';

export default function Checkout({ cartLines = [], currentUser, globalOrg, onBack, onSubmit, onRemoveFromCart, nextRequisitionNumber }) {
  
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isApprovalDrawerOpen, setIsApprovalDrawerOpen] = useState(false); 

  const {
    headerOrg, 
    buyerNotes, 
    justification, 
    headerDescription, setHeaderDescription,
    headerProjectId, 
    headerTaskId, 
    headerExpTypeId, 
    headerExpOrgId, 
    headerBuyer,                 
    headerRequester,
    headerServiceApprover,       
    lines, 
    selectedLineIds, setSelectedLineIds,
    isBudgetMixed, 
    cartTotal,
    hasExpenseLines,
    
    handleLineFieldChange,
    handleApplyBulkEdit,
    handleAddNewLine,
    handleHeaderOrgChange,
    handleHeaderBuyerChange,     
    handleHeaderRequesterChange, 
    handleHeaderServiceApproverChange, 
    handleHeaderBudgetChange,
    handleHeaderNotesChange,
    handleHeaderJustificationChange,
    handleLineOrgChange,
    handleRemoveLine,
    handleAddDist,
    handleDistFieldChange,
    handleRemoveDist
  } = useCheckout({ cartLines, globalOrg, onRemoveFromCart, currentUser });

  const buildHeaderData = () => ({
    org: headerOrg,
    buyerNotes,
    justification,
    description: headerDescription,
    projectId: headerProjectId,
    taskId: headerTaskId,
    expenditureTypeId: headerExpTypeId,
    expenditureOrgId: headerExpOrgId,
    buyer: headerBuyer,
    requester: headerRequester,
    serviceApprover: headerServiceApprover
  });

  // שמירה רגילה - כעת שומר בסטטוס INCOMPLETE
  const handleConfirmSave = (emptyCart) => {
    onSubmit(buildHeaderData(), lines, emptyCart, [], 'INCOMPLETE');
    setIsSaveModalOpen(false);
  };

  const handleApprovalSubmit = (routingSteps) => {
    onSubmit(buildHeaderData(), lines, true, routingSteps, 'IN PROCESS');
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 w-full relative" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">סל דרישה מורחב</h1>
        <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
          &larr; חזרה לאתר
        </button>
      </div>
      
      <CheckoutHeader 
        cartTotal={cartTotal}
        headerOrg={headerOrg}
        onHeaderOrgChange={handleHeaderOrgChange}
        headerBuyer={headerBuyer}
        onHeaderBuyerChange={handleHeaderBuyerChange}
        headerRequester={headerRequester}
        onHeaderRequesterChange={handleHeaderRequesterChange}
        headerServiceApprover={headerServiceApprover} 
        onHeaderServiceApproverChange={handleHeaderServiceApproverChange} 
        buyerNotes={buyerNotes}
        onHeaderNotesChange={handleHeaderNotesChange}
        justification={justification}
        onHeaderJustificationChange={handleHeaderJustificationChange}
        headerDescription={headerDescription}
        setHeaderDescription={setHeaderDescription}
        headerProjectId={headerProjectId}
        headerTaskId={headerTaskId}
        headerExpTypeId={headerExpTypeId}
        headerExpOrgId={headerExpOrgId}
        onHeaderBudgetChange={handleHeaderBudgetChange}
        hasExpenseLines={hasExpenseLines}
        isBudgetMixed={isBudgetMixed}
        onSaveRequestClick={() => setIsSaveModalOpen(true)}
        onApprovalRoutingClick={() => setIsApprovalDrawerOpen(true)} 
        nextRequisitionNumber={nextRequisitionNumber} 
      />
      
      <div className="mt-8">
        <CheckoutLines 
          lines={lines}
          selectedLineIds={selectedLineIds}
          setSelectedLineIds={setSelectedLineIds}
          onLineOrgChange={handleLineOrgChange}
          onLineFieldChange={handleLineFieldChange}
          onRemoveLine={handleRemoveLine} 
          currentUser={currentUser}
          onAddDist={handleAddDist}
          onDistFieldChange={handleDistFieldChange}
          onRemoveDist={handleRemoveDist}
          onApplyBulkEdit={handleApplyBulkEdit}
          onAddNewLine={handleAddNewLine}
          buyerNotes={buyerNotes}
          justification={justification}
          headerProjectId={headerProjectId}
          headerTaskId={headerTaskId}
          headerExpTypeId={headerExpTypeId}
          headerExpOrgId={headerExpOrgId}
          headerBuyer={headerBuyer}
          headerRequester={headerRequester}
          headerServiceApprover={headerServiceApprover} 
          isBudgetMixed={isBudgetMixed}
          headerOrg={headerOrg}
        />
      </div>

      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 transform transition-all border border-gray-100 dark:border-gray-700">
            {/* הכותרת עודכנה ל-INCOMPLETE */}
            <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">שמירת דרישת רכש (INCOMPLETE)</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">האם תרצה לרוקן את הסל לאחר השמירה?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleConfirmSave(true)} className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors cursor-pointer border border-gray-200 dark:border-gray-600 shadow-sm">שמור דרישה ורוקן את הסל</button>
              <button onClick={() => handleConfirmSave(false)} className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors cursor-pointer border border-gray-200 dark:border-gray-600">שמור דרישה והשאר את הסל</button>
              <button onClick={() => setIsSaveModalOpen(false)} className="w-full py-3 px-4 bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl font-bold transition-colors mt-2 cursor-pointer">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <ApprovalRoutingDrawer 
        isOpen={isApprovalDrawerOpen}
        onClose={() => setIsApprovalDrawerOpen(false)}
        currentUser={currentUser}
        lines={lines}
        headerBuyer={headerBuyer}
        onSubmitApproval={handleApprovalSubmit} 
      />

    </div>
  );
}