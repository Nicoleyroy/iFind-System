const ItemModel = require('../src/models/item');

const createItem = async (req, res) => {
  try {
    const { name, location, date, contactInfo, description, type, imageUrl, userId } = req.body || {};
    if (!name || !type || !['lost', 'found'].includes(type)) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }
    let parsedDate = undefined;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }
    const item = await ItemModel.create({
      name,
      location,
      date: parsedDate,
      contactInfo,
      description,
      type,
      imageUrl,
      userId: userId || null,
    });
    return res.json({ data: item });
  } catch (err) {
    console.error('POST /items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getItems = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type && ['lost', 'found'].includes(type)) filter.type = type;
    const items = await ItemModel.find(filter).sort({ createdAt: -1 }).lean();
    
    // Map old statuses to new ones for backward compatibility
    const statusMap = {
      "Unclaimed": "Active",
      "Resolved": "Archived",
      "Claimed": "Archived",
      "Pending": "Active"
    };
    
    const mappedItems = items.map(item => ({
      ...item,
      status: statusMap[item.status] || item.status || "Active"
    }));
    
    return res.json({ data: mappedItems });
  } catch (err) {
    console.error('GET /items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, date, contactInfo, description, type, imageUrl, status } = req.body || {};
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (date !== undefined) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) updateData.date = d;
    }
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined && ['lost', 'found'].includes(type)) updateData.type = type;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    
    // Accept both old and new status values
    if (status !== undefined) {
      const validStatuses = ['Unclaimed', 'Pending', 'Claimed', 'Active', 'Archived', 'Deleted'];
      if (validStatuses.includes(status)) {
        updateData.status = status;
      }
    }
    
    const item = await ItemModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Map status when returning
    const statusMap = {
      "Unclaimed": "Active",
      "Resolved": "Archived",
      "Claimed": "Archived",
      "Pending": "Active"
    };
    
    const mappedItem = {
      ...item,
      status: statusMap[item.status] || item.status || "Active"
    };
    
    return res.json({ data: mappedItem });
  } catch (err) {
    console.error('PUT /items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ItemModel.findByIdAndDelete(id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    return res.json({ message: 'Item deleted successfully', data: item });
  } catch (err) {
    console.error('DELETE /items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Soft delete - mark item as deleted
const softDeleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ItemModel.findByIdAndUpdate(
      id,
      { status: 'Deleted' },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    return res.json({ message: 'Item marked as deleted', data: item });
  } catch (err) {
    console.error('PATCH /items/:id/delete failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Export selected items to PDF using pdfkit and stream back to client
const exportPdf = async (req, res) => {
  try {
    const { ids } = req.body || {};

    let items = [];
    if (Array.isArray(ids) && ids.length > 0) {
      items = await ItemModel.find({ _id: { $in: ids } }).lean();
    } else {
      items = await ItemModel.find({}).lean();
    }

    // Map old statuses to new ones
    const statusMap = {
      "Unclaimed": "Active",
      "Resolved": "Archived",
      "Claimed": "Archived",
      "Pending": "Active"
    };
    
    items = items.map(item => ({
      ...item,
      status: statusMap[item.status] || item.status || "Active"
    }));

    // Dynamically require pdfkit
    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      console.error('pdfkit is not installed. Run `npm install pdfkit` in server folder.');
      return res.status(500).json({ message: 'Server missing dependency: pdfkit' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Lost-Items-Report.pdf"');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    const colors = {
      primary: '#0F172A',
      secondary: '#475569',
      accent: '#1E40AF',
      border: '#CBD5E1',
      background: '#F8FAFC',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#1E293B'
    };

    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (margin * 2);

    // ===== PAGE 1: TITLE PAGE =====
    // Header bar
    doc.rect(0, 0, pageWidth, 120).fill(colors.primary);
    
    // Logo/Organization title
    doc.fillColor('#FFFFFF').fontSize(32).font('Helvetica-Bold').text('iFind', margin, 20);
    doc.fontSize(14).font('Helvetica').text('Lost Item Management System', margin, 60);
    
    // Subtitle
    doc.fontSize(11).fillColor('#E2E8F0').text('Official Report', margin, 82);

    // Main title
    doc.y = 150;
    doc.fillColor(colors.primary).fontSize(26).font('Helvetica-Bold').text('LOST ITEMS REPORT', { align: 'center' });
    
    // Divider
    doc.y += 15;
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke(colors.accent);
    
    // Report details
    doc.y += 30;
    doc.fontSize(11).font('Helvetica').fillColor(colors.text);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.text(`Time: ${new Date().toLocaleTimeString('en-US')}`, { align: 'center' });
    
    // Summary statistics box
    doc.y += 40;
    const statsBoxY = doc.y;
    const statsBoxHeight = 90;
    
    // Box background
    doc.rect(margin, statsBoxY, contentWidth, statsBoxHeight).fill(colors.background).stroke({ color: colors.border, width: 2 });
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary).y = statsBoxY + 12;
    doc.text('REPORT SUMMARY', margin + 15, doc.y);
    
    // Stats
    const totalItems = items.length;
    const activeItems = items.filter(i => i.status === 'Active').length;
    const archivedItems = items.filter(i => i.status === 'Archived').length;
    const deletedItems = items.filter(i => i.status === 'Deleted').length;
    const lostItems = items.filter(i => i.type === 'lost').length;
    const foundItems = items.filter(i => i.type === 'found').length;

    doc.y += 20;
    doc.fontSize(10).font('Helvetica').fillColor(colors.text);
    
    const statLineHeight = 12;
    const statsStartY = doc.y;
    const col1 = margin + 15;
    const col2 = margin + contentWidth / 2;

    doc.text(`Total Items: ${totalItems}`, col1, statsStartY);
    doc.text(`Active Items: ${activeItems}`, col2, statsStartY);
    doc.text(`Archived Items: ${archivedItems}`, col1, statsStartY + statLineHeight);
    doc.text(`Deleted Items: ${deletedItems}`, col2, statsStartY + statLineHeight);
    doc.text(`Lost Items: ${lostItems}`, col1, statsStartY + (statLineHeight * 2));
    doc.text(`Found Items: ${foundItems}`, col2, statsStartY + (statLineHeight * 2));

    // Add new page for detailed table
    doc.addPage({ margin: 40, size: 'A4' });

    // ===== PAGE 2+: DETAILED ITEMS TABLE =====
    doc.fillColor(colors.primary).fontSize(16).font('Helvetica-Bold').text('DETAILED ITEMS LISTING', margin);
    
    doc.y += 15;
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke(colors.border);
    doc.y += 15;

    // Table setup
    const tableTop = doc.y;
    const colConfig = {
      itemName: { width: 0.20, label: 'Item Name' },
      type: { width: 0.10, label: 'Type' },
      status: { width: 0.12, label: 'Status' },
      location: { width: 0.22, label: 'Location' },
      date: { width: 0.12, label: 'Date' },
      contact: { width: 0.24, label: 'Contact Info' }
    };

    const colWidths = {};
    Object.values(colConfig).forEach((col, idx) => {
      colWidths[Object.keys(colConfig)[idx]] = contentWidth * col.width;
    });

    const headerHeight = 22;
    const rowHeight = 20;

    // Draw table header
    const headerY = doc.y;
    doc.rect(margin, headerY, contentWidth, headerHeight).fill(colors.primary);
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');

    let xPos = margin + 8;
    Object.entries(colConfig).forEach(([key, col]) => {
      doc.text(col.label, xPos, headerY + 6, { width: colWidths[key] - 8, ellipsis: true });
      xPos += colWidths[key];
    });

    doc.y = headerY + headerHeight;
    let rowCount = 0;

    // Draw table rows
    for (const item of items) {
      const rowY = doc.y;
      
      // Check if need new page
      if (rowY + rowHeight > doc.page.height - 80) {
        // Draw footer on current page
        doc.fontSize(9).fillColor(colors.secondary).text(
          `Page ${doc.page.number}`,
          margin,
          doc.page.height - 30,
          { align: 'center', width: contentWidth }
        );
        
        // Add new page
        doc.addPage({ margin: 40, size: 'A4' });
        doc.y = margin;
        
        // Repeat header on new page
        doc.rect(margin, doc.y, contentWidth, headerHeight).fill(colors.primary);
        doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');

        xPos = margin + 8;
        Object.entries(colConfig).forEach(([key, col]) => {
          doc.text(col.label, xPos, doc.y + 6, { width: colWidths[key] - 8, ellipsis: true });
          xPos += colWidths[key];
        });
        
        doc.y += headerHeight;
        rowCount = 0;
      }

      const currentRowY = doc.y;
      
      // Alternating row background
      if (rowCount % 2 === 0) {
        doc.rect(margin, currentRowY, contentWidth, rowHeight).fill(colors.background);
      }
      
      // Row border
      doc.moveTo(margin, currentRowY + rowHeight).lineTo(margin + contentWidth, currentRowY + rowHeight).stroke(colors.border);

      // Row content
      doc.fillColor(colors.text).fontSize(9).font('Helvetica');
      
      xPos = margin + 8;
      
      // Item Name
      doc.text(truncate(item.name || 'N/A', 25), xPos, currentRowY + 5, { width: colWidths.itemName - 8, ellipsis: true });
      xPos += colWidths.itemName;
      
      // Type
      doc.text(item.type === 'lost' ? 'LOST' : 'FOUND', xPos, currentRowY + 5, { width: colWidths.type - 8, ellipsis: true });
      xPos += colWidths.type;
      
      // Status with color
      const statusColors = {
        'Active': colors.success,
        'Archived': colors.warning,
        'Deleted': colors.danger
      };
      doc.fillColor(statusColors[item.status] || colors.secondary).text(item.status || 'Active', xPos, currentRowY + 5, { width: colWidths.status - 8, ellipsis: true });
      xPos += colWidths.status;
      
      // Location
      doc.fillColor(colors.text).text(truncate(item.location || 'Not specified', 30), xPos, currentRowY + 5, { width: colWidths.location - 8, ellipsis: true });
      xPos += colWidths.location;
      
      // Date
      const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US') : 'N/A';
      doc.text(dateStr, xPos, currentRowY + 5, { width: colWidths.date - 8, ellipsis: true });
      xPos += colWidths.date;
      
      // Contact Info
      doc.text(truncate(item.contactInfo || 'Not provided', 30), xPos, currentRowY + 5, { width: colWidths.contact - 8, ellipsis: true });

      doc.y = currentRowY + rowHeight;
      rowCount++;
    }

    // Final table border
    doc.moveTo(margin, doc.y).lineTo(margin + contentWidth, doc.y).stroke(colors.border);

    // ===== FOOTER =====
    doc.y += 20;
    doc.fontSize(9).fillColor(colors.secondary).font('Helvetica');
    doc.text(`Total Records: ${items.length}`, margin);
    doc.text(`Report Period: ${new Date().toLocaleDateString('en-US')}`, margin);

    // Footer
    doc.fontSize(8).fillColor('#999999').text(
      '---',
      margin,
      doc.page.height - 50,
      { align: 'center', width: contentWidth }
    );
    doc.text(
      'This document is an official report from the iFind Lost Item Management System. For inquiries, please contact the support team.',
      margin,
      doc.page.height - 40,
      { align: 'center', width: contentWidth }
    );
    doc.text(
      `Page ${doc.page.number}`,
      margin,
      doc.page.height - 20,
      { align: 'center', width: contentWidth }
    );

    doc.end();
  } catch (err) {
    console.error('Export to PDF failed', err);
    res.status(500).json({ message: 'Server error during PDF export', error: err.message });
  }
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

module.exports = {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  softDeleteItem,
  exportPdf,
};

