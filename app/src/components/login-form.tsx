"use client";

import { FormEvent, useState } from "react";
import { Button, Callout, Card, TextInput, Title } from "@tremor/react";
import { RiLockPasswordLine, RiUserLine } from "@remixicon/react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        redirectTo?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message || "Login gagal.");
        return;
      }

      window.location.href = payload.redirectTo || "/";
    } catch {
      setError("Terjadi gangguan koneksi saat login.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="planner-card rounded-[28px] p-6 md:p-7">
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          Secure Access
        </div>
        <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
          Login Informasi JP
        </Title>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Gunakan akun hasil seed awal. Admin dan pegawai login memakai username
          dan password awal sesuai aturan bootstrap sistem.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-3xl border border-slate-200 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Username / NIP
          </label>
          <TextInput
            icon={RiUserLine}
            placeholder="Masukkan username atau NIP"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Password
          </label>
          <TextInput
            type="password"
            icon={RiLockPasswordLine}
            placeholder="Masukkan password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? (
          <Callout color="rose" title="Login gagal">
            {error}
          </Callout>
        ) : null}

        <Button
          type="submit"
          color="blue"
          className="!mt-2 !w-full !rounded-xl !py-2.5"
          loading={submitting}
        >
          Masuk
        </Button>
      </form>
    </Card>
  );
}
