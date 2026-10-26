"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api, type CurrentUser } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api<{ users: CurrentUser[] }>(`/admin/users?q=${encodeURIComponent(query)}`).then(result => setUsers(result.users)).catch(exception => setError(exception.message)); }, [query]);
  return <PortalFrame role="admin" title="People at Aster." subtitle="Explore account roles across the learning community.">{error && <div className="portal-alert">{error}</div>}<label className="admin-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or email" /></label><div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td><span className="status-pill">{user.role}</span></td><td>—</td></tr>)}</tbody></table>{users.length === 0 && <div className="table-empty">No matching accounts.</div>}</div><p className="portal-footnote">Account role changes and account suspension are not included in this demonstration. Administrator roles cannot be assigned through public registration.</p></PortalFrame>;
}
