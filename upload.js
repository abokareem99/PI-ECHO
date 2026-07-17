// استيراد خدمة التخزين من ملف Firebase الخاص بك
import { storage } from "./firebase.js"; // تأكد من كتابة المسار الصحيح لملفك

// استيراد دالات الرفع الخاصة بـ Storage من الـ CDN
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// ربط عناصر واجهة المستخدم (تأكد من مطابقة الـ IDs في الـ HTML لديك)
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const progressText = document.getElementById("progressText");

uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  
  if (!file) {
    alert("الرجاء اختيار ملف أولاً!");
    return;
  }

  // 1. تجميد الزر فوراً وتغيير نصه لمنع المستخدم من الضغط المتكرر (حل مشكلة التعليق)
  uploadBtn.disabled = true;
  uploadBtn.innerText = "جاري الرفع... ⏳";

  // 2. إنشاء مسار فريد للملف داخل مجلد echopi_uploads
  const storageRef = ref(storage, `echopi_uploads/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  // 3. مراقبة عملية الرفع خطوة بخطوة
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      // حساب النسبة المئوية للتقدم وتحديث واجهة المستخدم
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      const roundProgress = Math.round(progress);
      
      if (progressText) progressText.innerText = `تم رفع ${roundProgress}%`;
      uploadBtn.innerText = `جاري الرفع (${roundProgress}%)`;
    },
    (error) => {
      // 4. معالجة الأخطاء (حالة الأمان: تحرير الزر إذا فشل الرفع لكي لا يعلق)
      console.error("خطأ أثناء الرفع:", error);
      alert("للأسف حدث خطأ أثناء الرفع. يرجى التحقق من القواعد (Rules) أو الاتصال.");
      
      resetButton(); // إعادة الزر للوضع الطبيعي
    },
    () => {
      // 5. نجاح عملية الرفع واشتغال الرابط
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log("رابط الملف الجاهز للاستخدام:", downloadURL);
        alert("تم رفع الملف بنجاح! 🎉");

        // [ملاحظة] هنا يمكنك تمرير downloadURL وحفظه في Firestore (db) الخاص بك إذا كنت بحاجة لذلك

        resetButton(); // إعادة الزر للوضع الطبيعي وتفريغ الحقول
        if (fileInput) fileInput.value = ""; // تفريغ خانة الملفات
      });
    }
  );
});

// دالة مساعدة لإعادة الزر إلى حالته النشطة
function resetButton() {
  uploadBtn.disabled = false;
  uploadBtn.innerText = "رفع الملف";
  if (progressText) progressText.innerText = "";
}
