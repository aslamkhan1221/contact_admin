import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

interface Contact {
    id?: number;
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    tags: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { rows } = await db.execute({
            sql: "SELECT * FROM contacts WHERE id = ?",
            args: [params.id],
        });

        if (rows.length === 0) {
            return NextResponse.json({ message: "Contact not found" }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Failed to fetch contact" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const updatedContact: Contact = await request.json();
        const { name, email, phone, whatsapp, address, tags } = updatedContact;

        await db.execute({
            sql: "UPDATE contacts SET name = ?, email = ?, phone = ?, whatsapp = ?, address = ?, tags = ? WHERE id = ?",
            args: [name, email, phone, whatsapp, address, tags, params.id],
        });

        return NextResponse.json({ message: "Contact updated successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Failed to update contact" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await db.execute({
            sql: "DELETE FROM contacts WHERE id = ?",
            args: [params.id],
        });

        return NextResponse.json({ message: "Contact deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Failed to delete contact" }, { status: 500 });
    }
}
