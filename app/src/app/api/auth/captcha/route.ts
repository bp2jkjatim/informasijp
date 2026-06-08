import { NextResponse } from "next/server";
import { issueCaptcha, renderCaptchaSvg } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export function GET() {
  const text = issueCaptcha();
  const svg = renderCaptchaSvg(text);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
