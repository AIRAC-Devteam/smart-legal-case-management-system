function RadioGroup({ label, name, value, onChange, options }) {
  return (
    <div className="field-block">
      <label className="field-label">{label}</label>
      <div className="radio-row">
        {options.map((item) => (
          <label className="radio-option" key={`${name}-${String(item.value)}`}>
            <input
              type="radio"
              name={name}
              checked={value === item.value}
              onChange={() => onChange(name, item.value)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function CaseForm({ form, onChange, disabled = false }) {
  const set = (name, value) => onChange({ ...form, [name]: value })

  return (
    <section className="form-card case-form-card">
      <div className="section-heading">
        <div>
          <h2>اطلاعات پرونده</h2>
          <p>اطلاعات استخراج‌شده را قبل از ثبت نهایی بررسی و اصلاح کنید.</p>
        </div>
      </div>

      <div className="form-grid two">
        <Field label="نام پرونده">
          <input
            disabled={disabled}
            value={form.case_name ?? ''}
            onChange={(e) => set('case_name', e.target.value)}
            placeholder="مثال: شرکت الف علیه جهاد دانشگاهی"
          />
        </Field>

        <Field label="کلاسه داخلی">
          <input
            disabled={disabled}
            value={form.internal_ref ?? ''}
            onChange={(e) => set('internal_ref', e.target.value)}
            placeholder="کد داخلی واحد حقوقی"
          />
        </Field>

        <Field label="شماره پرونده">
          <input
            disabled={disabled}
            value={form.case_number ?? ''}
            onChange={(e) => set('case_number', e.target.value)}
            placeholder="شماره پرونده قضایی"
          />
        </Field>

        <Field label="گروه‌بندی موضوعی پرونده">
          <input
            disabled={disabled}
            value={form.subject_category ?? ''}
            onChange={(e) => set('subject_category', e.target.value)}
            placeholder="مثال: قرارداد، استخدام، مطالبه وجه"
          />
        </Field>

        <Field label="تاریخ تشکیل">
          <input
            disabled={disabled}
            value={form.creation_date ?? ''}
            onChange={(e) => set('creation_date', e.target.value)}
            placeholder="مثال: ۱۴۰۵/۰۵/۰۶"
          />
        </Field>

        <Field label="مرجع رسیدگی">
          <input
            disabled={disabled}
            value={form.authority_category ?? ''}
            onChange={(e) => set('authority_category', e.target.value)}
            placeholder="مثال: شعبه ۲۶ دادگاه…"
          />
        </Field>
      </div>

      <div className={`form-grid two radio-grid ${disabled ? 'is-disabled' : ''}`}>
        <RadioGroup
          label="نوع دعوی"
          name="case_type"
          value={form.case_type}
          onChange={(n, v) => !disabled && set(n, v)}
          options={[
            { value: 'legal', label: 'حقوقی' },
            { value: 'criminal', label: 'کیفری' },
            { value: 'quasi_judicial', label: 'شبه قضایی' },
            { value: 'administrative', label: 'اداری' },
          ]}
        />

        <RadioGroup
          label="طبقه‌بندی"
          name="classification"
          value={form.classification}
          onChange={(n, v) => !disabled && set(n, v)}
          options={[
            { value: 'normal', label: 'عادی' },
            { value: 'confidential', label: 'محرمانه' },
          ]}
        />

        <RadioGroup
          label="وضعیت مالی"
          name="financial_status"
          value={form.financial_status}
          onChange={(n, v) => !disabled && set(n, v)}
          options={[
            { value: 'financial', label: 'مالی' },
            { value: 'non_financial', label: 'غیر مالی' },
          ]}
        />

        <RadioGroup
          label="مطرح شده توسط"
          name="submitted_by"
          value={form.submitted_by}
          onChange={(n, v) => !disabled && set(n, v)}
          options={[
            { value: 'organization', label: 'سازمان/شرکت' },
            { value: 'other', label: 'دیگری' },
          ]}
        />

        <RadioGroup
          label="وجود حبس در موضوع پرونده"
          name="has_imprisonment"
          value={form.has_imprisonment}
          onChange={(n, v) => !disabled && set(n, v)}
          options={[
            { value: true, label: 'دارد' },
            { value: false, label: 'ندارد' },
            { value: null, label: 'نامشخص' },
          ]}
        />

        <RadioGroup
          label="وضعیت دعوی"
          name="case_status"
          value={form.case_status}
          onChange={(n, v) => !disabled && set(n, v)}
          options={[
            { value: 'primary', label: 'اصلی' },
            { value: 'secondary', label: 'فرعی' },
          ]}
        />
      </div>

      <div className="form-grid three">
        <Field label="مبلغ خواسته (ریال)">
          <input
            disabled={disabled}
            inputMode="numeric"
            value={form.amount ?? ''}
            onChange={(e) =>
              set('amount', e.target.value.replace(/[^0-9]/g, ''))
            }
            placeholder="مثال: 250000000"
          />
        </Field>

        <Field label="استان">
          <input
            disabled={disabled}
            value={form.province ?? ''}
            onChange={(e) => set('province', e.target.value)}
            placeholder="استان"
          />
        </Field>

        <Field label="شهرستان / شهر">
          <input
            disabled={disabled}
            value={form.city ?? ''}
            onChange={(e) => set('city', e.target.value)}
            placeholder="شهرستان یا شهر"
          />
        </Field>
      </div>

      <div className="form-grid two form-grid-last">
        <Field label="طرفین پرونده">
          <textarea
            disabled={disabled}
            rows="5"
            value={form.plaintiff_defendant ?? ''}
            onChange={(e) => set('plaintiff_defendant', e.target.value)}
            placeholder="خواهان/شاکی و خوانده/طرف شکایت"
          />
        </Field>

        <Field label="توضیحات و اطلاعات سند">
          <textarea
            disabled={disabled}
            rows="5"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="خلاصه یا متن استخراج‌شده از سند"
          />
        </Field>
      </div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div className="field-block">
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}
