"use client";

import { useEffect, useState } from "react";
import { Award, Printer } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api } from "@/lib/api";

type Certificate = { id: string; courseTitle: string; issuedAt: string };
export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api<{ certificates: Certificate[] }>("/student/certificates").then(result => setCertificates(result.certificates)).catch(exception => setError(exception.message)); }, []);
  return <PortalFrame role="student" title="Your achievements." subtitle="Every completed course represents a step you chose to take.">{error && <div className="portal-alert">{error}</div>}{certificates.length ? <div className="certificate-grid">{certificates.map(certificate => <article className="certificate-card" key={certificate.id}><span className="certificate-seal"><Award size={27} /></span><span className="eyebrow">ASTER LEARNING · CERTIFICATE</span><h2>{certificate.courseTitle}</h2><p>Completed on {new Date(certificate.issuedAt).toLocaleDateString()}</p><small>Certificate ID · {certificate.id}</small><button className="button button-outline" onClick={() => window.print()}><Printer size={15} /> Print certificate</button></article>)}</div> : <div className="portal-empty"><span className="empty-icon"><Award size={21} /></span><h3>Your certificates will appear here.</h3><p>Complete all lessons in an enrolled course to earn a certificate.</p></div>}</PortalFrame>;
}
