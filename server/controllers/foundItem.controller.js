const FoundItemModel = require('../src/models/foundItem');

const createFoundItem = async (req, res) => {
  try {
    const { name, category, location, date, contactInfo, description, imageUrl, userId } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'Item name is required' });
    }
    let parsedDate = undefined;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }
    const item = await FoundItemModel.create({
      name,
      category,
      location,
      date: parsedDate,
      contactInfo,
      description,
      imageUrl,
      userId: userId || null,
    });
    return res.json({ data: item });
  } catch (err) {
    console.error('POST /found-items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getFoundItems = async (req, res) => {
  try {
    const items = await FoundItemModel.find({})
      .populate('userId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: items });
  } catch (err) {
    console.error('GET /found-items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getFoundItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await FoundItemModel.findById(id)
      .populate('userId', 'name email profilePicture')
      .lean();
    
    if (!item) {
      return res.status(404).json({ message: 'Found item not found' });
    }
    
    return res.json({ data: item });
  } catch (err) {
    console.error('GET /found-items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, location, date, contactInfo, description, imageUrl, status } = req.body || {};
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (date !== undefined) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) updateData.date = d;
    }
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    
    if (status !== undefined) {
      const validStatuses = ['Active', 'Archived', 'Deleted', 'Unclaimed', 'Pending', 'Claimed'];
      if (validStatuses.includes(status)) {
        updateData.status = status;
      }
    }
    
    const item = await FoundItemModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Found item not found' });
    }
    
    return res.json({ data: item });
  } catch (err) {
    console.error('PUT /found-items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await FoundItemModel.findByIdAndDelete(id);
    
    if (!item) {
      return res.status(404).json({ message: 'Found item not found' });
    }
    
    return res.json({ message: 'Found item deleted successfully', data: item });
  } catch (err) {
    console.error('DELETE /found-items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const softDeleteFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await FoundItemModel.findByIdAndUpdate(
      id,
      { status: 'Deleted' },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Found item not found' });
    }
    
    return res.json({ message: 'Found item marked as deleted', data: item });
  } catch (err) {
    console.error('PATCH /found-items/:id/delete failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const exportFoundItemsPdf = async (req, res) => {
  try {
    const { ids } = req.body || {};

    let items = [];
    if (Array.isArray(ids) && ids.length > 0) {
      items = await FoundItemModel.find({ _id: { $in: ids } }).lean();
    } else {
      items = await FoundItemModel.find({}).lean();
    }

    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      console.error('pdfkit is not installed. Run `npm install pdfkit` in server folder.');
      return res.status(500).json({ message: 'Server missing dependency: pdfkit' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Found-Items-Report.pdf"');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    const colors = {
      primary: '#059669',
      secondary: '#475569',
      accent: '#047857',
      border: '#CBD5E1',
      background: '#F0FDF4',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#1E293B'
    };

    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (margin * 2);

    // Title Page
    doc.rect(0, 0, pageWidth, 120).fill(colors.primary);
    doc.fillColor('#FFFFFF').fontSize(32).font('Helvetica-Bold').text('iFind', margin, 20);
    doc.fontSize(14).font('Helvetica').text('Found Item Management System', margin, 60);
    doc.fontSize(11).fillColor('#E2E8F0').text('Official Report', margin, 82);

    doc.y = 150;
    doc.fillColor(colors.primary).fontSize(26).font('Helvetica-Bold').text('FOUND ITEMS REPORT', { align: 'center' });
    
    doc.y += 15;
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke(colors.accent);
    
    doc.y += 30;
    doc.fontSize(11).font('Helvetica').fillColor(colors.text);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.text(`Time: ${new Date().toLocaleTimeString('en-US')}`, { align: 'center' });
    
    doc.y += 40;
    const statsBoxY = doc.y;
    const statsBoxHeight = 90;
    
    doc.rect(margin, statsBoxY, contentWidth, statsBoxHeight).fill(colors.background).stroke({ color: colors.border, width: 2 });
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary).y = statsBoxY + 12;
    doc.text('REPORT SUMMARY', margin + 15, doc.y);
    
    const totalItems = items.length;
    const activeItems = items.filter(i => i.status === 'Active').length;
    const archivedItems = items.filter(i => i.status === 'Archived').length;
    const deletedItems = items.filter(i => i.status === 'Deleted').length;

    doc.y += 20;
    doc.fontSize(10).font('Helvetica').fillColor(colors.text);
    
    const statLineHeight = 12;
    const statsStartY = doc.y;
    const col1 = margin + 15;
    const col2 = margin + contentWidth / 2;

    doc.text(`Total Found Items: ${totalItems}`, col1, statsStartY);
    doc.text(`Active Items: ${activeItems}`, col2, statsStartY);
    doc.text(`Archived Items: ${archivedItems}`, col1, statsStartY + statLineHeight);
    doc.text(`Deleted Items: ${deletedItems}`, col2, statsStartY + statLineHeight);

    doc.addPage({ margin: 40, size: 'A4' });

    doc.fillColor(colors.primary).fontSize(16).font('Helvetica-Bold').text('DETAILED ITEMS LISTING', margin);
    
    doc.y += 15;
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke(colors.border);
    doc.y += 15;

    const tableTop = doc.y;
    const colConfig = {
      itemName: { width: 0.25, label: 'Item Name' },
      category: { width: 0.15, label: 'Category' },
      status: { width: 0.12, label: 'Status' },
      location: { width: 0.22, label: 'Location' },
      date: { width: 0.12, label: 'Date' },
      contact: { width: 0.14, label: 'Contact' }
    };

    const colWidths = {};
    Object.values(colConfig).forEach((col, idx) => {
      colWidths[Object.keys(colConfig)[idx]] = contentWidth * col.width;
    });

    const headerHeight = 22;
    const rowHeight = 20;

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

    for (const item of items) {
      const rowY = doc.y;
      
      if (rowY + rowHeight > doc.page.height - 80) {
        doc.fontSize(9).fillColor(colors.secondary).text(
          `Page ${doc.page.number}`,
          margin,
          doc.page.height - 30,
          { align: 'center', width: contentWidth }
        );
        
        doc.addPage({ margin: 40, size: 'A4' });
        doc.y = margin;
        
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
      
      if (rowCount % 2 === 0) {
        doc.rect(margin, currentRowY, contentWidth, rowHeight).fill(colors.background);
      }
      
      doc.moveTo(margin, currentRowY + rowHeight).lineTo(margin + contentWidth, currentRowY + rowHeight).stroke(colors.border);

      doc.fillColor(colors.text).fontSize(9).font('Helvetica');
      
      xPos = margin + 8;
      
      doc.text(truncate(item.name || 'N/A', 25), xPos, currentRowY + 5, { width: colWidths.itemName - 8, ellipsis: true });
      xPos += colWidths.itemName;
      
      doc.text(truncate(item.category || 'N/A', 15), xPos, currentRowY + 5, { width: colWidths.category - 8, ellipsis: true });
      xPos += colWidths.category;
      
      const statusColors = {
        'Active': colors.success,
        'Archived': colors.warning,
        'Deleted': colors.danger
      };
      doc.fillColor(statusColors[item.status] || colors.secondary).text(item.status || 'Active', xPos, currentRowY + 5, { width: colWidths.status - 8, ellipsis: true });
      xPos += colWidths.status;
      
      doc.fillColor(colors.text).text(truncate(item.location || 'Not specified', 25), xPos, currentRowY + 5, { width: colWidths.location - 8, ellipsis: true });
      xPos += colWidths.location;
      
      const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US') : 'N/A';
      doc.text(dateStr, xPos, currentRowY + 5, { width: colWidths.date - 8, ellipsis: true });
      xPos += colWidths.date;
      
      doc.text(truncate(item.contactInfo || 'N/A', 20), xPos, currentRowY + 5, { width: colWidths.contact - 8, ellipsis: true });

      doc.y = currentRowY + rowHeight;
      rowCount++;
    }

    doc.moveTo(margin, doc.y).lineTo(margin + contentWidth, doc.y).stroke(colors.border);

    doc.y += 20;
    doc.fontSize(9).fillColor(colors.secondary).font('Helvetica');
    doc.text(`Total Records: ${items.length}`, margin);

    doc.fontSize(8).fillColor('#999999').text(
      'This document is an official report from the iFind Found Item Management System.',
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
    console.error('Export Found Items PDF failed', err);
    res.status(500).json({ message: 'Server error during PDF export', error: err.message });
  }
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

module.exports = {
  createFoundItem,
  getFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem,
  softDeleteFoundItem,
  exportFoundItemsPdf,
};
