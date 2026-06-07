import React, { useState, useEffect } from 'react';
import CheckoutHeader from './CheckoutHeader';
import CheckoutLines from './CheckoutLines';
import data from '../data/data.json';

export default function Checkout({ cartLines = [], currentUser, globalOrg, onBack, onSubmit }) {
  const [headerOrg, setHeaderOrg] = useState(String(globalOrg));
  const [buyerNotes, setBuyerNotes] = useState('');
  const [justification, setJustification] = useState('');
  const [headerDescription, setHeaderDescription] = useState('');
  
  const [lines, setLines] = useState([]);
  const [selectedLineIds, setSelectedLineIds] = useState([]);

  useEffect(() => {
    if (cartLines.length > 0) {
      const enrichedLines = cartLines.map((line, idx) => {
        const catalogItem = line.itemId 
          ? data.catalogItems.find(i => String(i.id) === String(line.itemId)) 
          : null;

        const defaultDate = line.needByDate || (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          return d.toISOString().split('T')[0];
        })();

        return {
          ...line,
          lineNumber: line.lineNumber || idx + 1,
          lineType: line.lineType || "טובין",
          destinationType: line.destinationType || "Inventory",
          sku: line.sku || (catalogItem ? catalogItem.sku : ""),
          itemDescription: line.itemDescription || (catalogItem ? catalogItem.description : "פריט לא מוגדר"),
          uom: line.uom || (catalogItem ? catalogItem.uom : "EA"),
          unitPrice: line.unitPrice ?? (catalogItem ? catalogItem.price : 0),
          currency: line.currency || (catalogItem ? catalogItem.currency : "ILS"),
          foreignUnitPrice: line.foreignUnitPrice ?? (catalogItem ? catalogItem.foreignPrice : 0),
          inventoryOrg: line.inventoryOrg || globalOrg,
          buyerNotes: line.buyerNotes || "",
          justification: line.justification || "",
          needByDate: defaultDate
        };
      });
      setLines(enrichedLines);
    } else {
      setLines([]);
    }
  }, [cartLines, globalOrg]);

  const handleHeaderOrgChange = (orgId) => {
    setHeaderOrg(orgId);
    if (orgId !== 'mixed') {
      setLines(prevLines => prevLines.map(line => ({ ...line, inventoryOrg: Number(orgId) })));
    }
  };

  const handleHeaderNotesChange = (notes) => {
    setBuyerNotes(notes);
    setLines(prevLines => prevLines.map(line => ({ ...line, buyerNotes: notes })));
  };

  const handleHeaderJustificationChange = (just) => {
    setJustification(just);
    setLines(prevLines => prevLines.map(line => ({ ...line, justification: just })));
  };

  const handleLineOrgChange = (lineId, orgId) => {
    setLines(prevLines => prevLines.map(line => line.id === lineId ? { ...line, inventoryOrg: Number(orgId) } : line));
  };

  const handleLineFieldChange = (lineId, field, value) => {
    setLines(prevLines => prevLines.map(line => line.id === lineId ? { ...line, [field]: value } : line));
  };

  const handleRemoveLine = (lineId) => {
    setLines(prevLines => prevLines.filter(line => line.id !== lineId));
    setSelectedLineIds(prev => prev.filter(id => id !== lineId));
  };

  const cartTotal = lines.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.quantity), 0);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 w-full" dir="rtl">
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
        buyerNotes={buyerNotes}
        onHeaderNotesChange={handleHeaderNotesChange}
        justification={justification}
        onHeaderJustificationChange={handleHeaderJustificationChange}
        headerDescription={headerDescription}
        setHeaderDescription={setHeaderDescription}
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
        />
      </div>
    </div>
  );
}