import { NextResponse } from 'next/server';
import { db } from '../../lib/db';

export async function GET() {
  try {
    const { rows } = await db.execute('SELECT * FROM contacts ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const newContact = await req.json();
    const { name, email, phone, whatsapp, address, tags, force } = newContact;

    if (!force) {
      const conditions: string[] = [];
      const args: string[] = [];
      if (email) { conditions.push('email = ?'); args.push(email); }
      if (phone) { conditions.push('phone = ?'); args.push(phone); }
      if (whatsapp) { conditions.push('whatsapp = ?'); args.push(whatsapp); }

      if (conditions.length > 0) {
        const { rows: existing } = await db.execute({
          sql: `SELECT * FROM contacts WHERE ${conditions.join(' OR ')} LIMIT 1`,
          args,
        });
        if (existing.length > 0) {
          return NextResponse.json({ message: 'Duplicate contact found.', duplicate: existing[0] }, { status: 409 });
        }
      }
    }

    await db.execute({
      sql: 'INSERT INTO contacts (name, email, phone, whatsapp, address, tags) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name, email, phone, whatsapp, address, tags],
    });
    return NextResponse.json({ message: 'Contact created successfully' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create contact' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.execute('DELETE FROM contacts');
    return NextResponse.json({ message: 'All contacts deleted successfully' });
  } catch (error) {
    console.error('Failed to delete all contacts', error);
    return NextResponse.json({ message: 'Failed to delete all contacts' }, { status: 500 });
  }
}