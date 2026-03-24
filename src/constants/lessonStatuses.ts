export const LESSON_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Scheduled (Not Started)' },
  { value: 'in_progress', label: 'Teaching' },
  { value: 'done', label: 'Completed' }
] as const

export type LessonStatusValue = typeof LESSON_STATUS_OPTIONS[number]['value']

export const LESSON_STATUS_VALUES: LessonStatusValue[] = LESSON_STATUS_OPTIONS.map((option) => option.value)
