import { Callout } from '@tremor/react'

export function FlashMessage({ status }) {
  if (!status?.message) {
    return null
  }

  const intentClass = status.type === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <Callout
      className={`mb-3 rounded-md border ${intentClass}`}
      title={status.type === 'error' ? 'Terjadi masalah' : 'Berhasil'}
      color={status.type === 'error' ? 'rose' : 'emerald'}
    >
      {status.message}
    </Callout>
  )
}
