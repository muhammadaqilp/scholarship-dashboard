// Optional, user-triggered only (never called automatically). Per the
// offline-first spec this app's core functionality never depends on this
// route - it only checks whether a scholarship's resourceUrl is still
// reachable, and never overwrites the Excel-sourced record. This is a
// baseline verification (reachability + timestamp); swap in a real search
// API here later for genuine "is the deadline still current" checks.
import { NextResponse } from "next/server";
import { getScholarshipById } from "@/lib/scholarships";
import type { VerificationRecord } from "@/lib/types";

export async function POST(request: Request) {
  let body: { scholarshipId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scholarshipId = body.scholarshipId;
  if (typeof scholarshipId !== "number") {
    return NextResponse.json({ error: "scholarshipId is required" }, { status: 400 });
  }

  const record = getScholarshipById(scholarshipId);
  if (!record) {
    return NextResponse.json({ error: "Unknown scholarshipId" }, { status: 404 });
  }

  const url = record.raw.resourceUrl;
  if (!url) {
    const result: VerificationRecord = {
      scholarshipId,
      checkedAt: new Date().toISOString(),
      reachable: false,
      httpStatus: null,
      finalUrl: null,
      note: "Database ini tidak punya Resource URL untuk diverifikasi.",
    };
    return NextResponse.json(result);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ScholarshipQuestVerifier/1.0)" },
    });
    const result: VerificationRecord = {
      scholarshipId,
      checkedAt: new Date().toISOString(),
      reachable: res.ok,
      httpStatus: res.status,
      finalUrl: res.url,
      note: res.ok
        ? "Resource URL bisa diakses saat ini. Ini cuma cek link hidup, bukan verifikasi isi/deadline."
        : `Resource URL merespons dengan status ${res.status}.`,
    };
    return NextResponse.json(result);
  } catch {
    const result: VerificationRecord = {
      scholarshipId,
      checkedAt: new Date().toISOString(),
      reachable: false,
      httpStatus: null,
      finalUrl: null,
      note: "Nggak bisa mengakses Resource URL sekarang. Data database tetap tersedia seperti biasa.",
    };
    return NextResponse.json(result);
  } finally {
    clearTimeout(timeout);
  }
}
