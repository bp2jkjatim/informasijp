"use client";

import { FormEvent, useState } from "react";
import { Button, Callout, TextInput } from "@tremor/react";
import { RiLockPasswordLine, RiRefreshLine, RiShieldCheckLine, RiUserLine } from "@remixicon/react";
import { appPath } from "@/lib/paths";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaNonce, setCaptchaNonce] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refreshCaptcha() {
    setCaptcha("");
    setCaptchaNonce(Date.now());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(appPath("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, captcha }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        redirectTo?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message || "Login gagal.");
        refreshCaptcha();
        return;
      }

      window.location.href = payload.redirectTo || appPath("/");
    } catch {
      setError("Terjadi gangguan koneksi saat login.");
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-900">
          Username / NIP
        </label>
        <TextInput
          icon={RiUserLine}
          placeholder="Masukkan username atau NIP"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-900">
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-900">
          Kode Captcha
        </label>
        <div className="mb-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={appPath(`/api/auth/captcha?ts=${captchaNonce}`)}
            alt="Kode captcha"
            width={180}
            height={60}
            className="h-[60px] w-[180px] rounded-lg border border-slate-200 bg-slate-100"
          />
          <button
            type="button"
            onClick={refreshCaptcha}
            aria-label="Muat ulang captcha"
            title="Muat ulang captcha"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <RiRefreshLine size={18} />
          </button>
        </div>
        <TextInput
          icon={RiShieldCheckLine}
          placeholder="Masukkan kode di gambar"
          autoComplete="off"
          value={captcha}
          onChange={(event) => setCaptcha(event.target.value)}
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
  );
}
