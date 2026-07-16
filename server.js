require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // تم استبدال node-fetch بـ axios لتفادي مشاكل التوافقية على Vercel

const app = express();
app.use(express.json());

// تفعيل مشاركة الموارد لكي يتمكن الـ Frontend الخاص بك من الاتصال بالخادم الخلفي
app.use(cors({
    origin: '*' 
}));

const PI_API_URL = 'https://api.minepi.com/v2';
const PI_API_KEY = process.env.PI_API_KEY; // يتم تعيينه في متغيرات بيئة Vercel

// التحقق من وجود مفتاح API الخاص بباي
if (!PI_API_KEY) {
    console.error("❌ تحذير: لم يتم العثور على مفتاح PI_API_KEY في متغيرات البيئة!");
}

// 1. نقطة الموافقة على الدفعة (Approve Payment)
app.post('/api/payments/approve', async (req, res) => {
    const { paymentId } = req.body;

    if (!paymentId) {
        return res.status(400).json({ error: 'حقل paymentId مطلوب.' });
    }

    try {
        // استخدام axios بدلاً من fetch لضمان التوافقية والأداء
        const response = await axios.post(`${PI_API_URL}/payments/${paymentId}/approve`, {}, {
            headers: {
                'Authorization': `Key ${PI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ تمت الموافقة بنجاح على الدفعة: ${paymentId}`);
        return res.status(200).json(response.data);

    } catch (error) {
        if (error.response) {
            console.error("فشل الموافقة في خوادم باي:", error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }
        console.error("خطأ داخلي أثناء الموافقة:", error.message);
        return res.status(500).json({ error: 'حدث خطأ في الخادم الخلفي.' });
    }
});

// 2. نقطة إكمال الدفعة نهائياً (Complete Payment)
app.post('/api/payments/complete', async (req, res) => {
    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
        return res.status(400).json({ error: 'الحقول paymentId و txid مطلوبة.' });
    }

    try {
        const response = await axios.post(`${PI_API_URL}/payments/${paymentId}/complete`, { txid }, {
            headers: {
                'Authorization': `Key ${PI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`🎉 تم إكمال واستلام الدفعة بنجاح! رقم المعاملة: ${txid}`);
        return res.status(200).json(response.data);

    } catch (error) {
        if (error.response) {
            console.error("فشل إكمال الدفعة في خوادم باي:", error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }
        console.error("خطأ داخلي أثناء إكمال العملية:", error.message);
        return res.status(500).json({ error: 'حدث خطأ في الخادم الخلفي.' });
    }
});

// تشغيل الخادم محلياً للتطوير فقط (وليس على Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 خادم دفع باي إيكو التجريبي يعمل على المنفذ: ${PORT}`);
    });
}

// ⚠️ هام جداً لـ Vercel لكي يتمكن من معالجة الطلبات كـ Serverless Function
module.exports = app;
