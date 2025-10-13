'use client';

import { useState, useRef } from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';

DataTable.use(DT);

export default function Page() {
    const [showDialog, setShowDialog] = useState(false);

    const handleOpenDialog = () => setShowDialog(true);
    const handleCloseDialog = () => setShowDialog(false);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // handle form submission logic here (e.g., add to table or API call)
        alert("Contact created!");
        handleCloseDialog();
    };

    return (
        <div>
            <div className="d-flex justify-content-space-evenly">
                <h1 className="text-2xl font-bold mb-4">
                    Contacts
                    <button
                        onClick={handleOpenDialog}
                        className="float-right bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm ml-4"
                    >
                        Add Contact
                    </button>
                </h1>
            </div>

            {/* Create Contact Dialog */}
            {showDialog && (
                <div
                    className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50"
                    onClick={handleCloseDialog} // Close on background click
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the dialog
                    >
                        <h2 className="text-lg font-bold mb-4">Create Contact</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Name" className="w-full border p-2 rounded" required />
                            <input type="email" placeholder="Email" className="w-full border p-2 rounded" required />
                            <input type="text" placeholder="Phone Number" className="w-full border p-2 rounded" />
                            <input type="text" placeholder="WhatsApp" className="w-full border p-2 rounded" />
                            <input type="text" placeholder="Address" className="w-full border p-2 rounded" />
                            <input type="text" placeholder="Tags" className="w-full border p-2 rounded" />

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={handleCloseDialog}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DataTable>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Number</th>
                        <th>WhatsApp</th>
                        <th>Address</th>
                        <th>Tags</th>
                    </tr>
                </thead>
                <tbody className="text-center pt-4">
                    <tr>
                        <td>test</td>
                        <td>test@gmail.com</td>
                        <td>+91 9876543210</td>
                        <td>+91 9876543210</td>
                        <td>test</td>
                        <td>test</td>
                    </tr>
                </tbody>
            </DataTable>
        </div>
    );
}
