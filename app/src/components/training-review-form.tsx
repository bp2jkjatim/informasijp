"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, Textarea } from "@tremor/react";
import { appPath } from "@/lib/paths";

type TrainingReviewFormProps = {
  trainingId: number;
};

export function TrainingReviewForm({ trainingId }: TrainingReviewFormProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState<"verified" | "rejected" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  async function submitReview(action: "verified" | "rejected") {
    setSubmittingAction(action);
    setMessage(null);

    try {
      const response = await fetch(appPath(`/api/trainings/${trainingId}/review`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, note }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setMessage({ type: "error", text: payload.message || "Review diklat gagal." });
        return;
      }

      setMessage({ type: "success", text: payload.message || "Review diklat berhasil disimpan." });
      startTransition(() => router.refresh());
    } catch {
      setMessage({ type: "error", text: "Terjadi gangguan koneksi saat menyimpan review." });
    } finally {
      setSubmittingAction(null);
    }
  }

  function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitReview("rejected");
  }

  return (
    <div className="planner-card rounded-[28px] p-5">
      <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
        Verifikasi Admin
      </div>
      <h2 className="mt-3 text-xl font-semibold text-slate-950">Review sertifikat diklat</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Tandai verified jika link atau file sertifikat benar. Tolak dengan catatan jika sertifikat salah atau tidak bisa dibuka.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          color="teal"
          className="!rounded-xl"
          loading={submittingAction === "verified"}
          onClick={() => void submitReview("verified")}
        >
          Verified
        </Button>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleReject}>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Catatan penolakan"
        />
        <Button
          type="submit"
          color="rose"
          className="!rounded-xl"
          loading={submittingAction === "rejected"}
        >
          Reject
        </Button>
      </form>

      {message ? (
        <Callout className="mt-4" color={message.type === "success" ? "teal" : "rose"} title={message.type === "success" ? "Berhasil" : "Gagal"}>
          {message.text}
        </Callout>
      ) : null}
    </div>
  );
}
