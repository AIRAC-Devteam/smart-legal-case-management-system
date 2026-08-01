# سامانه هوشمند مدیریت پرونده‌های حقوقی

نسخه نهایی Full-Stack شامل React/Vite در Frontend و Django REST Framework در Backend است. پردازش اسناد و تولید پیش‌نویس لایحه فقط از Gemini انجام می‌شود.

> این پروژه در وضعیت فعلی برای توسعه و استفاده داخلی است. قبل از استقرار عمومی روی اسناد حقوقی واقعی باید Authentication، سطح دسترسی، Audit Log، HTTPS و سیاست امن نگهداری فایل‌ها اضافه شود.

## قابلیت‌ها

- رابط فارسی RTL و Responsive
- آپلود `JPG`، `PNG`، `WEBP` و `PDF`
- استخراج ساختاریافته اطلاعات سند با Gemini
- پر شدن خودکار فرم پرونده و امکان اصلاح توسط کارشناس
- ایجاد، مشاهده، ویرایش و حذف پرونده‌ها
- تولید پیش‌نویس لایحه دفاعیه فقط پس از تشکیل پرونده
- تولید لایحه براساس اطلاعات تأییدشده ذخیره‌شده در Case
- نمایش موارد ناقص و موارد نیازمند بررسی حقوقی
- SQLite برای نسخه فعلی توسعه

## ساختار

```text
legal-case-manager-final/
├── backend/
│   ├── cases/
│   │   ├── migrations/
│   │   ├── services/
│   │   │   ├── extraction.py
│   │   │   ├── gemini_extractor.py
│   │   │   ├── schema.py
│   │   │   ├── defense_generator.py
│   │   │   └── defense_schema.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── config/
│   ├── .env.example
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/app.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── scripts/
```

## اجرای Backend در Windows

PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

فایل `backend/.env` را باز کنید و کلید واقعی Gemini را فقط همان‌جا قرار دهید:

```env
DJANGO_SECRET_KEY=change-me-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

GEMINI_API_KEY=PUT_YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.6-flash
MAX_UPLOAD_MB=12
```

سپس:

```powershell
python manage.py migrate
python manage.py runserver
```

Backend:

```text
http://127.0.0.1:8000
```

Health Check:

```text
http://127.0.0.1:8000/api/v1/health/
```

## اجرای Frontend در Windows

در PowerShell جدید:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend:

```text
http://localhost:5173
```

مقدار `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## APIها

```text
GET    /api/v1/health/

POST   /api/v1/documents/
GET    /api/v1/documents/{id}/
POST   /api/v1/documents/{id}/extract/
DELETE /api/v1/documents/{id}/

GET    /api/v1/cases/
POST   /api/v1/cases/
GET    /api/v1/cases/{id}/
PATCH  /api/v1/cases/{id}/
PUT    /api/v1/cases/{id}/
DELETE /api/v1/cases/{id}/
POST   /api/v1/cases/{id}/generate-defense/
```

## جریان اصلی سامانه

```text
آپلود سند
   ↓
ذخیره Document در Django
   ↓
Gemini Extraction
   ↓
Structured JSON
   ↓
پر شدن فرم React
   ↓
بازبینی و اصلاح انسانی
   ↓
تأیید و تشکیل پرونده
   ↓
ذخیره Case در دیتابیس
   ↓
صفحه جزئیات پرونده
   ↓
تهیه لایحه دفاعیه با هوش مصنوعی
   ↓
بازبینی و ویرایش انسانی پیش‌نویس
```

دکمه تهیه لایحه قبل از تشکیل موفق پرونده نمایش داده نمی‌شود. Backend نیز لایحه را با Case ذخیره‌شده تولید می‌کند تا اصلاحات کارشناس در فرم مبنای تولید باشند.

## تست

بعد از نصب dependencyهای Backend:

```powershell
cd backend
python manage.py test
```

و برای Frontend:

```powershell
cd frontend
npm install
npm run build
```

## نکات امنیتی

- `.env` داخل ZIP نهایی قرار نگرفته است؛ فقط `.env.example` وجود دارد.
- کلید Gemini را در Frontend یا متغیرهای `VITE_*` قرار ندهید.
- فایل‌های حقوقی واقعی حاوی داده حساس هستند؛ دسترسی به `media/` در Production نباید عمومی باقی بماند.
- پیش‌نویس تولیدشده توسط AI باید قبل از استفاده توسط کارشناس حقوقی بررسی شود.
- مدل موظف شده است استناد قانونی، قرارداد، شماره، تاریخ یا واقعیتی را که در داده ورودی وجود ندارد اختراع نکند.
