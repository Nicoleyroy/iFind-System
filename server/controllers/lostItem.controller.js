const LostItemModel = require('../src/models/lostItem');
const NotificationModel = require('../src/models/notification');
const UserModel = require('../src/models/user');

const createLostItem = async (req, res) => {
  try {
    const { name, category, location, date, contactInfo, description, imageUrl, images, userId } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'Item name is required' });
    }
    let parsedDate = undefined;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }
    // Normalize images: support either `images` array or single `imageUrl`
    let imgs = [];
    if (Array.isArray(images) && images.length > 0) imgs = images;
    else if (imageUrl) imgs = [imageUrl];

    const item = await LostItemModel.create({
      name,
      category,
      location,
      date: parsedDate,
      contactInfo,
      description,
      imageUrl: imgs[0] || '',
      images: imgs,
      userId: userId || null,
    });

    // Notify moderators/admins that a new lost item was uploaded
    (async () => {
      try {
        const uploader = userId ? await UserModel.findById(userId).lean() : null;
        const recipients = await UserModel.find({ role: { $in: ['moderator', 'admin'] } }).select('_id').lean();
        if (Array.isArray(recipients) && recipients.length > 0) {
          const title = `New Lost Item: ${item.name}`;
          const message = `${uploader?.name || 'A user'} uploaded a new lost item: ${item.name}`;
          const notifications = recipients.map(r => ({
            userId: r._id,
            type: 'new_item',
            title,
            message,
            relatedItemId: item._id,
          }));
          await NotificationModel.insertMany(notifications);
        }
      } catch (e) {
        console.warn('Failed to notify moderators of new lost item', e);
      }
    })();
    return res.json({ data: item });
  } catch (err) {
    console.error('POST /lost-items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getLostItems = async (req, res) => {
  try {
    const items = await LostItemModel.find({})
      .populate('userId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: items });
  } catch (err) {
    console.error('GET /lost-items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getLostItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItemModel.findById(id)
      .populate('userId', 'name email profilePicture')
      .lean();
    
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    
    return res.json({ data: item });
  } catch (err) {
    console.error('GET /lost-items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, location, date, contactInfo, description, imageUrl, images, status } = req.body || {};
    
    const existingItem = await LostItemModel.findById(id).lean();
    if (!existingItem) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

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
    if (images !== undefined) {
      updateData.images = Array.isArray(images) ? images : [];
      updateData.imageUrl = (Array.isArray(images) && images.length > 0) ? images[0] : '';
    } else if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
      updateData.images = imageUrl ? [imageUrl] : [];
    }
    
    if (status !== undefined) {
      const validStatuses = ['Active', 'Archived', 'Deleted', 'Unclaimed', 'Pending', 'Claimed', 'Returned'];
      if (validStatuses.includes(status)) {
        // If status is being set to Returned, persist wasReturned flag
        if (status === 'Returned') {
          updateData.status = status;
          updateData.wasReturned = true;
        } else if (status === 'Archived') {
          // If archiving and the existing item was previously Returned, preserve that information
          updateData.status = status;
          if (existingItem.status === 'Returned' || existingItem.wasReturned) {
            updateData.wasReturned = true;
          }
        } else {
          updateData.status = status;
        }
      }
    }
    
    const item = await LostItemModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    
    return res.json({ data: item });
  } catch (err) {
    console.error('PUT /lost-items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItemModel.findByIdAndDelete(id);
    
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    
    return res.json({ message: 'Lost item deleted successfully', data: item });
  } catch (err) {
    console.error('DELETE /lost-items/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const softDeleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItemModel.findByIdAndUpdate(
      id,
      { status: 'Deleted' },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    
    return res.json({ message: 'Lost item marked as deleted', data: item });
  } catch (err) {
    console.error('PATCH /lost-items/:id/delete failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const exportLostItemsPdf = async (req, res) => {
  try {
    const { ids } = req.body || {};

    let items = [];
    if (Array.isArray(ids) && ids.length > 0) {
      items = await LostItemModel.find({ _id: { $in: ids } }).lean();
    } else {
      items = await LostItemModel.find({}).lean();
    }

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
      primary: '#F97316',
      secondary: '#475569',
      accent: '#EA580C',
      border: '#CBD5E1',
      background: '#FFF7ED',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      text: '#1E293B'
    };

    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (margin * 2);

    const docId = `IFIND-${Date.now().toString(36)}-${Math.random().toString(16).slice(2,10)}`;
    let currentPage = 0;

    // Function to add header and footer to current page
    const addHeaderFooter = () => {
      const pageNum = currentPage;
      if (pageNum === 1) {
        // Title page header (white text over red band)
        doc.save();
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14);
        const h1 = 'iFind';
        const h1w = doc.widthOfString(h1);
        doc.text(h1, (pageWidth - h1w) / 2, 18, { lineBreak: false });
        doc.font('Helvetica').fontSize(10);
        const h2 = 'Lost Item Management System';
        const h2w = doc.widthOfString(h2);
        doc.text(h2, (pageWidth - h2w) / 2, 36, { lineBreak: false });
        doc.fontSize(9);
        const h3 = 'Official Report';
        const h3w = doc.widthOfString(h3);
        doc.text(h3, (pageWidth - h3w) / 2, 50, { lineBreak: false });
        doc.restore();
      } else if (pageNum > 1) {
        // Regular page header
        doc.save();
        doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(12);
        const h1 = 'iFind';
        const h1w = doc.widthOfString(h1);
        doc.text(h1, (pageWidth - h1w) / 2, 12, { lineBreak: false });
        doc.font('Helvetica').fontSize(10).fillColor(colors.secondary);
        const h2 = 'Lost Item Management System';
        const h2w = doc.widthOfString(h2);
        doc.text(h2, (pageWidth - h2w) / 2, 26, { lineBreak: false });
        doc.fontSize(9);
        const h3 = 'Official Report';
        const h3w = doc.widthOfString(h3);
        doc.text(h3, (pageWidth - h3w) / 2, 38, { lineBreak: false });
        doc.restore();
      }

      // Footer on all pages
      if (pageNum > 0) {
        doc.save();
        const footerY = doc.page.height - 25;
        const footerText = `Document ID: ${docId}  |  Page ${pageNum}`;
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        const ftw = doc.widthOfString(footerText);
        doc.text(footerText, (pageWidth - ftw) / 2, footerY, { lineBreak: false });
        doc.restore();
      }
    };

    // Add header/footer when new pages are created
    doc.on('pageAdded', () => {
      currentPage++;
      addHeaderFooter();
    });

    // Title Page
    currentPage = 1;
    doc.rect(0, 0, pageWidth, 120).fill(colors.primary);
    doc.fillColor('#FFFFFF').fontSize(32).font('Helvetica-Bold').text('iFind', margin, 20);
    doc.fontSize(14).font('Helvetica').text('Lost Item Management System', margin, 60);
    doc.fontSize(11).fillColor('#E2E8F0').text('Official Report', margin, 82);
    addHeaderFooter();

    doc.y = 150;
    doc.fillColor(colors.primary).fontSize(26).font('Helvetica-Bold').text('LOST ITEMS REPORT', margin, doc.y, { align: 'center', width: contentWidth });
    
    doc.y += 15;
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke(colors.accent);
    
    doc.y += 30;
    doc.fontSize(11).font('Helvetica').fillColor(colors.text);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, doc.y, { align: 'center', width: contentWidth });
    doc.text(`Time: ${new Date().toLocaleTimeString('en-US')}`, margin, doc.y, { align: 'center', width: contentWidth });
    
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

    doc.text(`Total Lost Items: ${totalItems}`, col1, statsStartY);
    doc.text(`Active Items: ${activeItems}`, col2, statsStartY);
    doc.text(`Archived Items: ${archivedItems}`, col1, statsStartY + statLineHeight);
    doc.text(`Deleted Items: ${deletedItems}`, col2, statsStartY + statLineHeight);

    doc.addPage({ margin: 40, size: 'A4' });

    doc.y = 65; // Start below header
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
        doc.addPage({ margin: 40, size: 'A4' });
        doc.y = 65; // Start below header
        
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

    doc.end();
  } catch (err) {
    console.error('Export Lost Items PDF failed', err);
    res.status(500).json({ message: 'Server error during PDF export', error: err.message });
  }
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

module.exports = {
  createLostItem,
  getLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
  softDeleteLostItem,
  exportLostItemsPdf,
};
