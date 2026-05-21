"use client";

import { useEffect, useState } from "react";

interface ColumnMapperProps {
  headers: string[];
  onMappingChange: (mapping: Record<string, string>) => void;
}

const PHONE_KEYS = ["telefone", "phone", "phonenumber", "numero", "celular", "mobile"];
const NAME_KEYS = ["nome", "name"];
const COMPANY_KEYS = ["empresa", "company", "compania"];

function autoDetect(headers: string[]): { phone: string; name: string; company: string } {
  const phone =
    headers.find((h) => PHONE_KEYS.includes(h.toLowerCase().replace(/\s/g, ""))) ?? "";
  const name =
    headers.find((h) => NAME_KEYS.includes(h.toLowerCase().trim())) ?? "";
  const company =
    headers.find((h) => COMPANY_KEYS.includes(h.toLowerCase().trim())) ?? "";
  return { phone, name, company };
}

export function ColumnMapper({ headers, onMappingChange }: ColumnMapperProps) {
  const detected = autoDetect(headers);
  const [phone, setPhone] = useState(detected.phone);
  const [name, setName] = useState(detected.name);
  const [company, setCompany] = useState(detected.company);

  useEffect(() => {
    const mapping: Record<string, string> = {};
    if (phone) mapping[phone] = "phoneNumber";
    if (name) mapping[name] = "name";
    if (company) mapping[company] = "company";
    onMappingChange(mapping);
  }, [phone, name, company, onMappingChange]);

  const selectClass =
    "border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Mapeamento de colunas</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Telefone <span className="text-red-500">*</span>
          </label>
          <select className={selectClass} value={phone} onChange={(e) => setPhone(e.target.value)}>
            <option value="">— selecione —</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nome</label>
          <select className={selectClass} value={name} onChange={(e) => setName(e.target.value)}>
            <option value="">— nenhum —</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Empresa</label>
          <select className={selectClass} value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">— nenhum —</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Coluna CSV</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Campo do sistema</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((h) => {
              const field =
                h === phone ? "phoneNumber" : h === name ? "name" : h === company ? "company" : "customField";
              return (
                <tr key={h} className="border-t">
                  <td className="px-4 py-2 text-gray-800">{h}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {field === "phoneNumber" && <span className="text-green-700 font-medium">Telefone</span>}
                    {field === "name" && <span className="text-blue-700 font-medium">Nome</span>}
                    {field === "company" && <span className="text-purple-700 font-medium">Empresa</span>}
                    {field === "customField" && <span className="text-gray-400">Campo personalizado</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
