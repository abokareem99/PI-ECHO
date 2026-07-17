require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());

// 1. إعدادات CORS متقدمة وموثوقة لـ Vercel ومحفظة باي
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// التعامل مع طلبات OPTIONS (Preflight) لمنع تعليق المتصفح
app.options('*', cors());

const PI_API_URL = 'https://api.minepi.com/v2';
const PI_API_KEY = process.env.PI_API_KEY;

if (!PI_API_KEY) {
    console.error("❌ تحذير: لم يتم العثور على مفتاح PI_API_KEY في متغيرات البيئة!");
}

// دالة مساعدة لتبسيط وتوحيد طلبات Pi API وتجنب التكرار
async function handlePiRequest(endpoint, payload) {
    return await axios.post(`${PI_API_URL}/${endpoint}`, payload, {
        headers: {
            'Authorization': `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        timeout: 20000 // مهلة 20 ثانية لتجنب تعليق Vercel Serverless
    });
}

// 2. نقطة الموافقة على الدفعة (Approve Payment) - تدعم المسار المباشر والفرعي لتجنب مشاكل Vercel
app.post(['/api/payments/approve', '/payments/approve'], async (req, res) => {
    const { paymentId } = req.body;

    if (!paymentId) {
        return res.status(400).json({ error: 'حقل paymentId مطلوب.' });
    }

    try {
        const response = await handlePiRequest(`payments/${paymentId}/approve`, {});
        console.log(`✅ تمت الموافقة بنجاح على الدفعة: ${paymentId}`);
        return res.status(200).json(response.data);

    } catch (error) {
        if (error.response) {
            console.error("فشل الموافقة في خوادم باي:", JSON.stringify(error.response.data));
            return res.status(error.response.status).json(error.response.data);
        }
        console.error("خطأ داخلي أثناء الموافقة:", error.message);
        return res.status(500).json({ error: 'حدث خطأ في الخادم الخلفي: ' + error.message });
    }
});

// 3. نقطة إكمال الدفعة نهائياً (Complete Payment)
app.post(['/api/payments/complete', '/payments/complete'], async (req, res) => {
    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
        return res.status(400).json({ error: 'الحقول paymentId و txid مطلوبة.' });
    }

    try {
        const response = await handlePiRequest(`payments/${paymentId}/complete`, { txid });
        console.log(`🎉 تم إكمال واستلام الدفعة بنجاح! رقم المعاملة: ${txid}`);
        return res.status(200).json(response.data);

    } catch (error) {
        if (error.response) {
            console.error("فشل إكمال الدفعة في خوادم باي:", JSON.stringify(error.response.data));
            return res.status(error.response.status).json(error.response.data);
        }
        console.error("خطأ داخلي أثناء إكمال العملية:", error.message);
        return res.status(500).json({ error: 'حدث خطأ في الخادم الخلفي: ' + error.message });
    }
});

// تشغيل الخادم محلياً للتطوير
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 خادم دفع باي إيكو التجريبي يعمل على المنفذ: ${PORT}`);
    });
}

module.exports = app;
