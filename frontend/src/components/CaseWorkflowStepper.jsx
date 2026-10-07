import { Check, FileText, Scale, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    id: 1,
    label: 'تشکیل پرونده',
    description: 'ثبت و تکمیل اطلاعات',
    icon: FileText,
  },
  {
    id: 2,
    label: 'تأیید اطلاعات',
    description: 'بازبینی نهایی پرونده',
    icon: Scale,
  },
  {
    id: 3,
    label: 'پیش‌نویس لایحه',
    description: 'انتخاب منابع و تولید لایحه',
    icon: Sparkles,
  },
]

function stepPath(stepId, caseId) {
  if (stepId === 1) return caseId ? `/cases/${caseId}/edit` : '/cases/new'
  if (stepId === 2) return caseId ? `/cases/${caseId}` : null
  if (stepId === 3) return caseId ? `/cases/${caseId}/defense` : null
  return null
}

export default function CaseWorkflowStepper({
  activeStep,
  unlockedStep = activeStep,
  caseId = null,
  lockForwardFromCurrent = false,
}) {
  const navigate = useNavigate()

  const goToStep = (step) => {
    const path = stepPath(step.id, caseId)
    if (!path) return

    const effectiveUnlocked = lockForwardFromCurrent
      ? Math.min(unlockedStep, activeStep)
      : unlockedStep

    if (step.id > effectiveUnlocked) return
    navigate(path)
  }

  return (
    <nav className="case-workflow-stepper" aria-label="مراحل تشکیل پرونده">
      {STEPS.map((step, index) => {
        const Icon = step.icon
        const completed = step.id < activeStep
        const active = step.id === activeStep
        const effectiveUnlocked = lockForwardFromCurrent
          ? Math.min(unlockedStep, activeStep)
          : unlockedStep
        const disabled = step.id > effectiveUnlocked || !stepPath(step.id, caseId)

        return (
          <div className="workflow-step-wrap" key={step.id}>
            <button
              type="button"
              className={`workflow-step ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}
              onClick={() => goToStep(step)}
              disabled={disabled}
              aria-current={active ? 'step' : undefined}
              title={disabled ? 'ابتدا مرحله قبلی را تکمیل کنید.' : step.label}
            >
              <span className="workflow-step-icon">
                {completed ? <Check size={18} /> : <Icon size={18} />}
              </span>
              <span className="workflow-step-copy">
                <small>مرحله {step.id.toLocaleString('fa-IR')}</small>
                <strong>{step.label}</strong>
                <span>{step.description}</span>
              </span>
            </button>
            {index < STEPS.length - 1 && <span className={`workflow-step-line ${completed ? 'completed' : ''}`} />}
          </div>
        )
      })}
    </nav>
  )
}
