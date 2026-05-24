import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, Card, Text, TextInput, Title } from '@tremor/react'
import { apiFetch } from '../api'
import { FlashMessage } from '../components/FlashMessage'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [status, setStatus] = useState({ type: '', message: '' })

  const loginMutation = useMutation({
    mutationFn: (payload) =>
      apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: async (payload) => {
      queryClient.setQueryData(['auth', 'me'], { ok: true, user: payload.user })
      await navigate({ to: '/app' })
    },
    onError: (error) => setStatus({ type: 'error', message: error.message }),
  })

  function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    loginMutation.mutate(loginForm)
  }

  return (
    <main className="app-page grid place-items-center p-4">
      <Card className="panel-card w-full max-w-md rounded-md space-y-5 p-6">
        <div className="space-y-1.5">
          <Text className="!text-xs !uppercase !tracking-wide !text-blue-900/45">Informasi JP</Text>
          <Title className="!text-[32px] !font-semibold !tracking-tight !text-blue-950">Login Panel Diklat</Title>
          <Text className="!text-blue-900/55">Akses panel pengelolaan JP dan riwayat diklat pegawai.</Text>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Text className="!text-blue-900/55">Username</Text>
            <TextInput
              className="dense-input"
              placeholder="Masukkan username"
              value={loginForm.username}
              onValueChange={(value) => setLoginForm((current) => ({ ...current, username: value }))}
            />
          </div>
          <div className="space-y-2">
            <Text className="!text-blue-900/55">Password</Text>
            <TextInput
              className="dense-input"
              type="password"
              placeholder="Masukkan password"
              value={loginForm.password}
              onValueChange={(value) => setLoginForm((current) => ({ ...current, password: value }))}
            />
          </div>
          <FlashMessage status={status} />
          <Button type="submit" color="blue" className="w-full !rounded-md !bg-blue-900 !py-2.5" loading={loginMutation.isPending}>
            Login
          </Button>
        </form>
      </Card>
    </main>
  )
}
