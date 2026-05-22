export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

function detectPhoneColumn(headers: string[]): string | undefined {
  const phoneKeys = ["telefone", "phone", "phonenumber", "numero", "celular", "mobile"];
  return headers.find((h) => phoneKeys.includes(h.toLowerCase().replace(/\s/g, "")));
}

function detectNameColumn(headers: string[]): string | undefined {
  const nameKeys = ["nome", "name"];
  return headers.find((h) => nameKeys.includes(h.toLowerCase().trim()));
}

function detectCompanyColumn(headers: string[]): string | undefined {
  const companyKeys = ["empresa", "company", "compania"];
  return headers.find((h) => companyKeys.includes(h.toLowerCase().trim()));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 12) return "55" + digits;
  return digits;
}

const CHUNK_SIZE = 500;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const listId = formData.get("listId") as string | null;

  if (!file || !listId) {
    return NextResponse.json({ error: "Arquivo e listId são obrigatórios." }, { status: 400 });
  }

  const list = await prisma.contactList.findFirst({
    where: { id: listId, userId: session.user.id },
  });
  if (!list) {
    return NextResponse.json({ error: "Lista não encontrada." }, { status: 404 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

  if (parsed.data.length > 10000) {
    return NextResponse.json({ error: "Limite de 10.000 contatos excedido." }, { status: 422 });
  }

  const headers = Object.keys(parsed.data[0] ?? {});
  const phoneCol = detectPhoneColumn(headers);
  if (!phoneCol) {
    return NextResponse.json(
      { error: "Coluna de telefone não encontrada. Use: telefone, phone, celular, numero." },
      { status: 422 }
    );
  }
  const nameCol = detectNameColumn(headers);
  const companyCol = detectCompanyColumn(headers);

  const contacts = parsed.data
    .filter((row) => row[phoneCol])
    .map((row) => {
      const customFields: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        if (key !== phoneCol && key !== nameCol) {
          if (companyCol && key === companyCol) {
            customFields["empresa"] = value;
          } else {
            customFields[key] = value;
          }
        }
      }
      return {
        contactListId: listId,
        phoneNumber: normalizePhone(row[phoneCol] ?? ""),
        name: nameCol ? (row[nameCol] ?? null) : null,
        customFields: Object.keys(customFields).length > 0 ? customFields : {},
      };
    });

  let imported = 0;
  let duplicates = 0;
  const errors = parsed.errors.length;

  for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
    const chunk = contacts.slice(i, i + CHUNK_SIZE);
    const result = await prisma.contact.createMany({ data: chunk, skipDuplicates: true });
    imported += result.count;
    duplicates += chunk.length - result.count;
  }

  return NextResponse.json({ imported, duplicates, errors });
}
