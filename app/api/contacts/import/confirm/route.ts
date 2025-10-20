'use server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

interface Contact {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  tags: string;
}

export async function POST(req: NextRequest) {
  try {
    const { contactsToImport } = await req.json();

    if (!contactsToImport || !Array.isArray(contactsToImport)) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    if (contactsToImport.length > 0) {
      const insertStatements = contactsToImport.map((contact: Contact) => ({
        sql: 'INSERT INTO contacts (name, email, phone, whatsapp, address, tags) VALUES (?, ?, ?, ?, ?, ?)',
        args: [contact.name, contact.email, contact.phone, contact.whatsapp, contact.address, contact.tags],
      }));
      await db.batch(insertStatements);
    }

    return NextResponse.json({
      message: 'Contacts imported successfully',
      importedCount: contactsToImport.length,
    });
  } catch (error) {
    console.error('Failed to confirm import', error);
    return NextResponse.json({ message: 'Failed to confirm import' }, { status: 500 });
  }
}
