"use client";

import Link from "next/link";
import { BadgeCheck, CircleHelp } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Verification = { valid: boolean; certificateId?: string; courseTitle?: string; learner?: string; issuedAt?: string };
export default function CertificateVerificationPage() {
  const params = useParams<{ certificateId: string }>();
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Verification>(`/certificates/verify/${params.certificateId}`).then(setResult).catch(exception => setError(exception.message)); }, [params.certificateId]);
  return <main className="verification-page"><div className="verification-card">{error ? <><CircleHelp size={29} /><h1>Verification unavailable</h1><p>{error}</p></> : result?.valid ? <><span className="verification-seal"><BadgeCheck size={30} /></span><span className="eyebrow">ASTER LEARNING · CERTIFICATE VERIFIED</span><h1>{result.courseTitle}</h1><p>This certificate was issued to <strong>{result.learner}</strong> on {new Date(result.issuedAt!).toLocaleDateString()}.</p><small>Certificate ID · {result.certificateId}</small></> : result ? <><CircleHelp size={29} /><h1>Certificate not found</h1><p>We couldn&apos;t verify that certificate ID in the current Aster records.</p></> : <span className="spinner" />}</div><Link href="/courses" className="text-link">Explore courses</Link></main>;
}
