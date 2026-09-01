import { InvoiceSAC9988 } from './types';

/**
 * Generates official Tally Prime XML envelope format for importing Sales Vouchers (SAC 9988 Embroidery Jobwork)
 */
export function generateTallyPrimeSalesXML(
  companyName: string,
  invoices: InvoiceSAC9988[],
  startDate: string,
  endDate: string
): string {
  const sanitize = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const formatDateForTally = (isoDate: string) => {
    // Tally format YYYYMMDD
    return (isoDate || '').replace(/-/g, '').substring(0, 8);
  };

  const voucherXmlList = invoices.map((inv) => {
    const tallyDate = formatDateForTally(inv.invoiceDate);
    const partyName = sanitize(inv.traderName);
    const gstin = sanitize(inv.traderGstin);
    const invoiceNo = sanitize(inv.invoiceNumber);
    const baseAmt = inv.baseAmount.toFixed(2);
    const cgstAmt = inv.cgstAmount.toFixed(2);
    const sgstAmt = inv.sgstAmount.toFixed(2);
    const igstAmt = (inv.igstAmount || 0).toFixed(2);
    const totalAmt = inv.totalAmount.toFixed(2);
    const narration = sanitize(
      `Job Work SAC 9988 - Lot ${inv.lotNumber}, ${(inv.totalStitches || 0).toLocaleString('en-IN')} Stitches on ${inv.fabricQuality}`
    );

    return `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
        <DATE>${tallyDate}</DATE>
        <GUID>ETMS-${inv.id}</GUID>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${invoiceNo}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
        <PARTYNAME>${partyName}</PARTYNAME>
        <PARTYMAILINGNAME>${partyName}</PARTYMAILINGNAME>
        <PARTYGSTIN>${gstin}</PARTYGSTIN>
        <STATENAME>Gujarat</STATENAME>
        <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
        <PLACEOFSUPPLY>Gujarat</PLACEOFSUPPLY>
        <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
        <NARRATION>${narration}</NARRATION>
        <EFFECTIVEDATE>${tallyDate}</EFFECTIVEDATE>
        <ISINVOICE>Yes</ISINVOICE>
        
        <!-- Party Ledger Debit Entry -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${partyName}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <LEDGERFROMITEM>No</LEDGERFROMITEM>
          <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
          <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
          <AMOUNT>-${totalAmt}</AMOUNT>
          <BILLALLOCATIONS.LIST>
            <NAME>${invoiceNo}</NAME>
            <BILLTYPE>New Ref</BILLTYPE>
            <AMOUNT>-${totalAmt}</AMOUNT>
          </BILLALLOCATIONS.LIST>
        </ALLLEDGERENTRIES.LIST>

        <!-- Embroidery Jobwork Sales (SAC 9988) Credit Entry -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Embroidery Jobwork Sales (SAC 9988)</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <LEDGERFROMITEM>No</LEDGERFROMITEM>
          <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
          <ISPARTYLEDGER>No</ISPARTYLEDGER>
          <AMOUNT>${baseAmt}</AMOUNT>
          <HSNDETAILS.LIST>
            <HSNCODE>9988</HSNCODE>
            <HSNDESCRIPTION>Textile Embroidery Jobwork Services</HSNDESCRIPTION>
          </HSNDETAILS.LIST>
        </ALLLEDGERENTRIES.LIST>

        <!-- Output CGST 2.5% Ledger -->
        ${
          inv.cgstAmount > 0
            ? `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output CGST @ 2.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <LEDGERFROMITEM>No</LEDGERFROMITEM>
          <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
          <ISPARTYLEDGER>No</ISPARTYLEDGER>
          <AMOUNT>${cgstAmt}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
            : ''
        }

        <!-- Output SGST 2.5% Ledger -->
        ${
          inv.sgstAmount > 0
            ? `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output SGST @ 2.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <LEDGERFROMITEM>No</LEDGERFROMITEM>
          <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
          <ISPARTYLEDGER>No</ISPARTYLEDGER>
          <AMOUNT>${sgstAmt}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
            : ''
        }

        <!-- Output IGST 5.0% Ledger (if interstate) -->
        ${
          inv.igstAmount > 0
            ? `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output IGST @ 5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <LEDGERFROMITEM>No</LEDGERFROMITEM>
          <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
          <ISPARTYLEDGER>No</ISPARTYLEDGER>
          <AMOUNT>${igstAmt}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
            : ''
        }

      </VOUCHER>
    </TALLYMESSAGE>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${sanitize(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${voucherXmlList.join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Generates GSTR-1 SAC 9988 CSV export content
 */
export function generateGSTR1SAC9988CSV(invoices: InvoiceSAC9988[]): string {
  const headers = [
    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place of Supply',
    'Reverse Charge',
    'Applicable % of Tax Rate',
    'Invoice Type',
    'E-Commerce GSTIN',
    'Rate',
    'Taxable Value',
    'Cess Amount',
    'SAC Code',
    'Description'
  ];

  const rows = invoices.map((inv) => {
    return [
      `"${inv.traderGstin}"`,
      `"${inv.traderName}"`,
      `"${inv.invoiceNumber}"`,
      `"${inv.invoiceDate}"`,
      inv.totalAmount.toFixed(2),
      '"24-Gujarat"',
      '"N"',
      '""',
      '"Regular"',
      '""',
      '5',
      inv.baseAmount.toFixed(2),
      '0.00',
      '"9988"',
      '"Textile Embroidery Jobwork"'
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
