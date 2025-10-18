'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { rows } = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [parseInt(id, 10)],
    });

    if (rows.length === 0) {
      return NextResponse.json({ message: `Contact with id ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch contact:', error);
    return NextResponse.json({ message: 'Failed to fetch contact' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const contactId = parseInt(id, 10);
    const body = await request.json();
    const { name, email, phone, whatsapp, address, tags, force } = body;

    // Check if contact exists before updating
    const { rows: existingRows } = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [contactId],
    });

    if (existingRows.length === 0) {
      return NextResponse.json({ message: `Contact with id ${id} not found` }, { status: 404 });
    }

    if (!force) {
      const conditions: string[] = [];
      const args: (string | number)[] = [];
      if (email) { conditions.push('email = ?'); args.push(email); }
      if (phone) { conditions.push('phone = ?'); args.push(phone); }
      if (whatsapp) { conditions.push('whatsapp = ?'); args.push(whatsapp); }

      if (conditions.length > 0) {
        const { rows: duplicateCheck } = await db.execute({
          sql: `SELECT * FROM contacts WHERE (${conditions.join(' OR ')}) AND id != ? LIMIT 1`,
          args: [...args, contactId],
        });

        if (duplicateCheck.length > 0) {
          return NextResponse.json({
            message: 'Duplicate contact found.',
            duplicate: duplicateCheck[0],
          }, { status: 409 });
        }
      }
    }

    // Update the contact
    await db.execute({
      sql: 'UPDATE contacts SET name = ?, email = ?, phone = ?, whatsapp = ?, address = ?, tags = ? WHERE id = ?',
      args: [name, email, phone, whatsapp, address, tags, contactId],
    });

    const { rows: updatedRows } = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [contactId],
    });

    if (updatedRows.length === 0) {
      return NextResponse.json({ message: `Contact with id ${id} not found after update` }, { status: 404 });
    }

    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Failed to update contact:', error);
    return NextResponse.json({ message: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const contactId = parseInt(id, 10);

    // Check if contact exists before deleting
    const { rows: existingRows } = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [contactId],
    });
    if (existingRows.length === 0) {
      return NextResponse.json({ message: `Contact with id ${id} not found` }, { status: 404 });
    }

    await db.execute({
      sql: 'DELETE FROM contacts WHERE id = ?',
      args: [contactId],
    });

    return NextResponse.json({ message: `Contact with id ${id} deleted successfully` });
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return NextResponse.json({ message: 'Failed to delete contact' }, { status: 500 });
  }
}