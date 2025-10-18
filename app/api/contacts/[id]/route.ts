'use server';

import { NextRequest, NextResponse } from 'next/server';

// A mock database call to simulate fetching a contact.
// In a real app, this would query your database.
async function findContactById(id: string) {
  // This is a placeholder. Replace with your actual database logic.
  const contacts = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];
  return contacts.find((contact) => contact.id === id) || null;
}

export async function GET(request: NextRequest, { params }: any) {
  try {
    const { id } = params;
    
    const contact = await findContactById(id);

    if (!contact) {
      return NextResponse.json({ message: `Contact with id ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Failed to fetch contact:', error);
    return NextResponse.json({ message: 'Failed to fetch contact' }, { status: 500 });
  }
}