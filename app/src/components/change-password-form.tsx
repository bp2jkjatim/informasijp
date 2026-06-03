"use client";

import { FormEvent, useState } from "react";
import { Button, Callout, Card, TextInput, Title } from "@tremor/react";
import { appPath } from "@/lib/paths";

type SubmitState = {
  type: "success" | "error";
  message: string;
} | null;

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitState(null);

    try {
      const response = await fetch(appPath("/api/account/password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setSubmitState({
          type: "error",
          message: payload.message || "Password gagal diubah.",
        });
        return;
      }

      setSubmitState({
        type: "success",
        message: payload.message || "Password berhasil diubah.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setSubmitState({
        type: "error",
        message: "Terjadi gangguan koneksi saat mengubah password.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="planner-card rounded-[28px] p-6">
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          Account Security
        </div>
        <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
          Ganti password
        </Title>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Menu ini disediakan untuk penggantian password kapan saja. Login pertama tetap
          tidak mewajibkan perubahan password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-3xl border border-slate-200 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Password saat ini
          </label>
          <TextInput
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Password baru
          </label>
          <TextInput
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Konfirmasi password baru
          </label>
          <TextInput
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        {submitState ? (
          <Callout color={submitState.type === "success" ? "teal" : "rose"} title={submitState.type === "success" ? "Berhasil" : "Gagal"}>
            {submitState.message}
          </Callout>
        ) : null}

        <Button
          type="submit"
          color="blue"
          className="!rounded-xl !px-5 !py-2.5"
          loading={submitting}
        >
          Simpan password baru
        </Button>
      </form>
    </Card>
  );
}
