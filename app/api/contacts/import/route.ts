'use server'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import * as xlsx from 'xlsx';

interface Contact extends Record<string, any> {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  tags: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let sheet;
    if (workbook.SheetNames.includes('contacts')) {
      sheet = workbook.Sheets['contacts'];
    } else {
      sheet = workbook.Sheets[workbook.SheetNames[0]];
    }
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (data.length < 2) { // must have header and at least one data row
      return NextResponse.json({ message: 'Sheet must have a header and at least one data row' }, { status: 400 });
    }

    const headerRow = data[0].map(header => String(header).toLowerCase().trim());
    const headerMap: Record<string, number> = {};
    headerRow.forEach((header, index) => {
      headerMap[header] = index;
    });

    if (headerMap['name'] === undefined) {
      return NextResponse.json({ message: 'Sheet must contain a \'name\' column' }, { status: 400 });
    }

    const newContacts: Contact[] = [];
    const duplicateContacts: { new: Contact, existing: Contact }[] = [];

    // Start from 1 to skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
        continue;
      }
      
      const contact: Contact = {
        name: String(row[headerMap['name']] || ''),
        email: String(row[headerMap['email']] || ''),
        phone: String(row[headerMap['phone']] || ''),
        whatsapp: String(row[headerMap['whatsapp']] || ''),
        address: String(row[headerMap['address']] || ''),
        tags: String(row[headerMap['tags']] || ''),
      };

      const isBlankContact = Object.values(contact).every(value => value === '');
      if (isBlankContact) {
        continue;
      }

      const conditions: string[] = [];
      const args: string[] = [];

      if (contact.email) {
        conditions.push('email = ?');
        args.push(contact.email);
      }
      if (contact.phone) {
        conditions.push('phone = ?');
        args.push(contact.phone);
      }
      if (contact.whatsapp) {
        conditions.push('whatsapp = ?');
        args.push(contact.whatsapp);
      }

      if (conditions.length > 0) {
        const { rows: existingRows } = await db.execute({
          sql: `SELECT * FROM contacts WHERE ${conditions.join(' OR ')} LIMIT 1`,
          args: args,
        });

        if (existingRows.length > 0) {
          duplicateContacts.push({ new: contact, existing: existingRows[0] as any as Contact });
        } else {
          newContacts.push(contact);
        }
      }
    }

    if (duplicateContacts.length > 0) {
      return NextResponse.json({ newContacts, duplicateContacts }, { status: 409 });
    }

    if (newContacts.length > 0) {
      const insertStatements = newContacts.map(contact => ({
        sql: 'INSERT INTO contacts (name, email, phone, whatsapp, address, tags) VALUES (?, ?, ?, ?, ?, ?)',
        args: [contact.name, contact.email, contact.phone, contact.whatsapp, contact.address, contact.tags],
      }));
      await db.batch(insertStatements);
    }

    return NextResponse.json({ message: 'Contacts imported successfully', importedCount: newContacts.length, duplicateCount: 0, totalCount: newContacts.length });
  } catch (error) {
    console.error('Failed to import contacts', error);
    return NextResponse.json({ message: 'Failed to import contacts' }, { status: 500 });
  }
}