import React, { useState, useEffect } from 'react';
import CheckoutHeader from './CheckoutHeader';
import CheckoutLines from './CheckoutLines';
import data from '../data/data.json';

export default function Checkout({ cartLines = [], currentUser, globalOrg, onBack, onSubmit, onRemoveFromCart }) {
  const [headerOrg, setHeaderOrg] = useState(String(globalOrg));
  const [buyerNotes, setBuyerNotes] = useState('');
  const [justification, setJustification] = useState('');
  const [headerDescription, setHeaderDescription] = useState('');
  
  const [headerProjectId, setHeaderProjectId] = useState('');
  const [headerTaskId, setHeaderTaskId] = useState('');
  const [headerExpTypeId, setHeaderExpTypeId] = useState('');
  const [headerExpOrgId, setHeaderExpOrgId] = useState('');

  const [lines, setLines] = useState([]);
  const [selectedLineIds, setSelectedLineIds] = useState([]);
  const [isBudgetMixed, setIsBudgetMixed] = useState(false);

  useEffect(() => {
    if (cartLines && cartLines.length > 0) {
      setLines(prevLines => {
        return cartLines.filter(l => l).map((line, idx) => {
          const catalogItem = line.itemId 
            ? data.catalogItems.find(i => String(i.id) === String(line.itemId)) 
            : null;

          const price = line.unitPrice ?? (catalogItem ? catalogItem.price : 0);
          const qty = line.quantity || 1;
          const currency = line.currency || (catalogItem ? catalogItem.currency : "ILS");
          const invOrg = line.inventoryOrg || globalOrg;
          const currentRate = line.rate || 1;

          const createDefaultDist = () => [{
            id: Date.now() + Math.random(),
            quantity: qty,
            percentage: 100,
            functionalAmount: qty * price * currentRate,
            projectId: headerProjectId || '',
            taskId: headerTaskId || '',
            expenditureTypeId: headerExpTypeId || '',
            expenditureOrgId: headerExpOrgId || invOrg 
          }];

          const existingLine = prevLines.find(l => l && l.id === line.id);
          
          if (existingLine) {
            if (!existingLine.distributions || existingLine.distributions.length === 0) {
              existingLine.distributions = createDefaultDist();
            }
            return { ...existingLine, lineNumber: idx + 1 };
          }

          const defaultDate = line.needByDate || (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            return d.toISOString().split('T')[0];
          })();

          let lineDistributions = line.distributions;
          if (!lineDistributions || lineDistributions.length === 0) {
            lineDistributions = createDefaultDist();
          }

          return {
            ...line,
            lineNumber: line.lineNumber || idx + 1,
            lineType: line.lineType || "טובין",
            destinationType: line.destinationType || "Inventory",
            sku: line.sku || (catalogItem ? catalogItem.sku : ""),
            itemDescription: line.itemDescription || (catalogItem ? catalogItem.description : "פריט לא מוגדר"),
            uom: line.uom || (catalogItem ? catalogItem.uom : "EA"),
            unitPrice: price,
            currency: currency,
            exchangeDate: line.exchangeDate || "",
            rate: currentRate,
            foreignUnitPrice: line.foreignUnitPrice ?? (catalogItem ? catalogItem.foreignPrice : 0),
            inventoryOrg: invOrg,
            buyerNotes: line.buyerNotes || "",
            justification: line.justification || "",
            needByDate: defaultDate,
            distributions: lineDistributions
          };
        });
      });
    } else {
      setLines([]);
    }
  }, [cartLines, globalOrg]);

  useEffect(() => {
    if (lines.length === 0) return;
    
    const firstOrg = String(lines[0].inventoryOrg);
    const isAllSameOrg = lines.every(line => String(line.inventoryOrg) === firstOrg);
    setHeaderOrg(isAllSameOrg ? firstOrg : 'mixed');

    let allDists = [];
    lines.forEach(l => {
      if (l.distributions) allDists.push(...l.distributions);
    });
    
    if (allDists.length > 0) {
      const firstDist = allDists[0];
      const isMixed = !allDists.every(d => 
        String(d.projectId || '') === String(firstDist.projectId || '') &&
        String(d.taskId || '') === String(firstDist.taskId || '') &&
        String(d.expenditureTypeId || '') === String(firstDist.expenditureTypeId || '') &&
        String(d.expenditureOrgId || '') === String(firstDist.expenditureOrgId || '')
      );
      
      setIsBudgetMixed(isMixed);
      
      if (!isMixed) {
        setHeaderProjectId(firstDist.projectId || '');
        setHeaderTaskId(firstDist.taskId || '');
        setHeaderExpTypeId(firstDist.expenditureTypeId || '');
        setHeaderExpOrgId(firstDist.expenditureOrgId || '');
      }
    } else {
      setIsBudgetMixed(false);
    }
  }, [lines]);

  const processLineUpdate = (line, field, value) => {
    let updatedLine = { ...line, [field]: value };
    
    if (field === 'currency' || field === 'exchangeDate') {
      if (updatedLine.currency === 'ILS') {
        updatedLine.rate = 1;
        updatedLine.exchangeDate = '';
      } else if (updatedLine.currency && updatedLine.exchangeDate) {
        const foundRate = data.currencyExchangeRates?.find(
          r => r.currency === updatedLine.currency && r.date === updatedLine.exchangeDate
        );
        updatedLine.rate = foundRate ? foundRate.rate : 1;
      }
    }

    if (['quantity', 'unitPrice', 'currency', 'exchangeDate'].includes(field)) {
      if (field === 'quantity' && (updatedLine.distributions || []).length === 1) {
        updatedLine.distributions[0].quantity = Number(value) || 0;
        updatedLine.distributions[0].percentage = 100;
      }

      const currentRate = updatedLine.rate || 1;
      const currentPrice = updatedLine.unitPrice || 0;
      
      updatedLine.distributions = (updatedLine.distributions || []).map(dist => ({
        ...dist,
        functionalAmount: (Number(dist.quantity) || 0) * currentPrice * currentRate
      }));
    }
    return updatedLine;
  };

  const handleLineFieldChange = (lineId, field, value) => {
    setLines(prev => prev.map(line => line.id === lineId ? processLineUpdate(line, field, value) : line));
  };

  const handleApplyBulkEdit = (lineIds, fieldsToApply, newDists) => {
    setLines(prevLines => prevLines.map(line => {
      if (!lineIds.includes(line.id)) return line;
      let updatedLine = { ...line };
      
      Object.keys(fieldsToApply).forEach(key => {
        const val = fieldsToApply[key];
        if (val !== '__MIXED__' && val !== undefined) updatedLine[key] = val;
      });
      
      if (updatedLine.currency === 'ILS') {
        updatedLine.rate = 1;
        updatedLine.exchangeDate = '';
      } else if (updatedLine.currency && updatedLine.exchangeDate) {
        const foundRate = data.currencyExchangeRates?.find(
          r => r.currency === updatedLine.currency && r.date === updatedLine.exchangeDate
        );
        updatedLine.rate = foundRate ? foundRate.rate : 1;
      }
      
      if (newDists && newDists.length > 0) {
        const currentRate = updatedLine.rate || 1;
        const currentPrice = updatedLine.unitPrice || 0;
        
        updatedLine.distributions = newDists.map(bd => {
          const pct = Number(bd.percentage) || 0;
          const qty = (pct / 100) * updatedLine.quantity;
          const finalQty = updatedLine.uom === 'EA' ? Math.floor(qty) : qty;

          return {
            id: Date.now() + Math.random(),
            percentage: pct,
            quantity: finalQty,
            functionalAmount: finalQty * currentPrice * currentRate,
            projectId: bd.projectId === '__MIXED__' ? '' : bd.projectId,
            taskId: bd.taskId === '__MIXED__' ? '' : bd.taskId,
            expenditureTypeId: bd.expenditureTypeId === '__MIXED__' ? '' : bd.expenditureTypeId,
            expenditureOrgId: bd.expenditureOrgId === '__MIXED__' ? '' : bd.expenditureOrgId
          };
        });
      }
      return updatedLine;
    }));
  };

  const handleAddNewLine = (newLineData) => {
    const newLineId = Date.now() + Math.random();
    const currentInvOrg = newLineData.inventoryOrg ? Number(newLineData.inventoryOrg) : (headerOrg !== 'mixed' && headerOrg ? Number(headerOrg) : (globalOrg || 1));

    let calculatedRate = 1;
    if (newLineData.currency && newLineData.currency !== 'ILS' && newLineData.exchangeDate) {
      const foundRate = data.currencyExchangeRates?.find(
        r => r.currency === newLineData.currency && r.date === newLineData.exchangeDate
      );
      calculatedRate = foundRate ? foundRate.rate : 1;
    }

    const newLine = {
      id: newLineId,
      lineNumber: lines.length + 1,
      lineType: newLineData.lineType || "טובין",
      destinationType: newLineData.destinationType || "Inventory",
      itemId: newLineData.itemId,
      sku: newLineData.sku,
      itemDescription: newLineData.itemDescription,
      quantity: newLineData.quantity,
      uom: newLineData.uom,
      unitPrice: newLineData.unitPrice,
      currency: newLineData.currency || "ILS",
      exchangeDate: newLineData.exchangeDate || "",
      rate: calculatedRate,
      foreignUnitPrice: 0,
      inventoryOrg: currentInvOrg,
      buyerNotes: buyerNotes || "",
      justification: justification || "",
      needByDate: newLineData.needByDate,
      supplier: newLineData.supplier || "",
      qualityRequirement: newLineData.qualityRequirement || "",
      serviceApprover: newLineData.serviceApprover || "",
      buyer: newLineData.buyer || "",
      
      // קולט את כל מערך הפיצולים מהשורה המהירה
      distributions: newLineData.distributions.map(dist => ({
        id: Date.now() + Math.random(),
        quantity: dist.quantity,
        percentage: dist.percentage,
        functionalAmount: dist.quantity * newLineData.unitPrice * calculatedRate,
        projectId: dist.projectId || '',
        taskId: dist.taskId || '',
        expenditureTypeId: dist.expenditureTypeId || '',
        expenditureOrgId: dist.expenditureOrgId || currentInvOrg
      }))
    };

    setLines(prev => [...prev, newLine]);
  };

  const handleHeaderOrgChange = (orgId) => {
    setHeaderOrg(orgId);
    if (orgId !== 'mixed') {
      setLines(prevLines => prevLines.map(line => ({ 
        ...line, 
        inventoryOrg: Number(orgId),
        distributions: (line.distributions || []).map(d => ({ ...d, expenditureOrgId: Number(orgId) }))
      })));
    }
  };

  const handleHeaderBudgetChange = (field, value) => {
    if (field === 'projectId') setHeaderProjectId(value);
    if (field === 'taskId') setHeaderTaskId(value);
    if (field === 'expenditureTypeId') setHeaderExpTypeId(value);
    if (field === 'expenditureOrgId') setHeaderExpOrgId(value);

    setLines(prevLines => prevLines.map(line => ({
      ...line,
      distributions: (line.distributions || []).map(dist => ({
        ...dist,
        [field]: value
      }))
    })));
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
    setLines(prevLines => prevLines.map(line => {
      if (line.id !== lineId) return line;
      return { 
        ...line, 
        inventoryOrg: Number(orgId),
        distributions: (line.distributions || []).map(d => ({ ...d, expenditureOrgId: Number(orgId) }))
      };
    }));
  };

  const handleRemoveLine = (lineId) => {
    setLines(prevLines => prevLines.filter(line => line.id !== lineId));
    setSelectedLineIds(prev => prev.filter(id => id !== lineId));
    if (onRemoveFromCart) onRemoveFromCart(lineId);
  };

  const handleAddDist = (lineId) => {
    setLines(prevLines => prevLines.map(line => {
      if (line.id !== lineId) return line;
      
      const dists = line.distributions || [];
      const currentTotalQty = dists.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
      const remainingQty = Math.max(0, line.quantity - currentTotalQty);
      const qtyToUse = line.uom === 'EA' ? Math.floor(remainingQty) : remainingQty;

      const lastDist = dists[dists.length - 1];

      const newDist = {
        id: Date.now() + Math.random(),
        quantity: qtyToUse,
        percentage: line.quantity > 0 ? (qtyToUse / line.quantity) * 100 : 0,
        functionalAmount: qtyToUse * (line.unitPrice || 0) * (line.rate || 1),
        projectId: lastDist?.projectId || headerProjectId || '',
        taskId: lastDist?.taskId || headerTaskId || '',
        expenditureTypeId: lastDist?.expenditureTypeId || headerExpTypeId || '',
        expenditureOrgId: lastDist?.expenditureOrgId || headerExpOrgId || line.inventoryOrg || headerOrg || ''
      };

      return { ...line, distributions: [...dists, newDist] };
    }));
  };

  const handleDistFieldChange = (lineId, distId, field, value) => {
    setLines(prevLines => prevLines.map(line => {
      if (line.id !== lineId) return line;
      
      const updatedDists = (line.distributions || []).map(dist => {
        if (dist.id !== distId) return dist;
        const updatedDist = { ...dist, [field]: value };
        
        if (field === 'quantity') {
          const qty = Number(value) || 0;
          updatedDist.percentage = line.quantity > 0 ? (qty / line.quantity) * 100 : 0;
          updatedDist.functionalAmount = qty * (line.unitPrice || 0) * (line.rate || 1);
        } else if (field === 'percentage') {
          const pct = Number(value) || 0;
          const calculatedQty = line.quantity > 0 ? (pct / 100) * line.quantity : 0;
          updatedDist.quantity = line.uom === 'EA' ? Math.floor(calculatedQty) : calculatedQty;
          updatedDist.functionalAmount = updatedDist.quantity * (line.unitPrice || 0) * (line.rate || 1);
        }
        
        return updatedDist;
      });

      return { ...line, distributions: updatedDists };
    }));
  };

  const handleRemoveDist = (lineId, distId) => {
    setLines(prevLines => prevLines.map(line => {
      if (line.id !== lineId) return line;
      const updatedDists = (line.distributions || []).filter(d => d.id !== distId);
      return { ...line, distributions: updatedDists };
    }));
  };

  const cartTotal = lines.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.quantity * (item.rate || 1)), 0);
  const hasExpenseLines = lines.some(line => line.destinationType === 'Expense');

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
        headerProjectId={headerProjectId}
        headerTaskId={headerTaskId}
        headerExpTypeId={headerExpTypeId}
        headerExpOrgId={headerExpOrgId}
        onHeaderBudgetChange={handleHeaderBudgetChange}
        hasExpenseLines={hasExpenseLines}
        isBudgetMixed={isBudgetMixed}
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
          headerProjectId={headerProjectId}
          headerTaskId={headerTaskId}
          headerExpTypeId={headerExpTypeId}
          headerExpOrgId={headerExpOrgId}
          isBudgetMixed={isBudgetMixed}
          headerOrg={headerOrg}
        />
      </div>
    </div>
  );
}