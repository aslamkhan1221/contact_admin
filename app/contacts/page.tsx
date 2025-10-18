'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import $ from 'jquery';
import DataTable from 'datatables.net-react';
import DataTables from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';
import 'datatables.net-select-dt/css/select.dataTables.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Contact {
  id?: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  tags: string;
}

type Errors = Partial<Record<keyof Contact, string[]>>;

interface ImportProgress {
  inProgress: boolean;
  importedCount: number;
  duplicateCount: number;
  totalCount: number;
  error: string | null;
}

interface DuplicateConflict {
  new: Contact;
  existing: Contact;
}

interface ManualConflict {
  new: Contact;
  duplicate: Contact;
}

DataTable.use(DataTables);

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Contact>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    tags: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    inProgress: false,
    importedCount: 0,
    duplicateCount: 0,
    totalCount: 0,
    error: null,
  });
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);
  const [contactsToConfirm, setContactsToConfirm] = useState<Contact[]>([]);
  const [manualConflict, setManualConflict] = useState<ManualConflict | null>(null);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const data: Contact[] = await response.json();
      setContacts(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Wrapper functions to be exposed to the window object
  const handleOpenDialogWrapper = (id: number) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      handleOpenDialog(contact);
    }
  };

  const handleDeleteWrapper = (id: number) => {
    handleDelete(id);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const clearErrors = () => {
    setErrors({});
  };

  useEffect(() => {
    // Expose functions to the window object for DataTables render function
    (window as any).handleOpenDialogWrapper = handleOpenDialogWrapper;
    (window as any).handleDeleteWrapper = handleDeleteWrapper;
    return () => {
      delete (window as any).handleOpenDialogWrapper;
      delete (window as any).handleDeleteWrapper;
    };
  }, [contacts]); // Re-bind if contacts change

  const clearFormData = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      address: '',
      tags: '',
    });
  };

  const handleOpenDialog = (contact: Contact | null = null) => {
    clearErrors();
    if (contact) {
      setEditingContact(contact);
      setFormData(contact);
    } else {
      setEditingContact(null);
      clearFormData();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    clearFormData();
    clearErrors();
    setEditingContact(null);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = (): boolean => {
    const errs: Errors = {};
    if (!formData.name.trim()) {
      errs.name = ['Name is required'];
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errs.email = ['Invalid email address'];
    }
    const phoneRegex = /^\+91\s?\d{10}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      errs.phone = ['Phone must start with +91 and have 10 digits'];
    }
    if (!formData.whatsapp || !phoneRegex.test(formData.whatsapp)) {
      errs.whatsapp = ['WhatsApp must start with +91 and have 10 digits'];
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errs.address = ['Address must be at least 5 characters'];
    }
    const tagsRegex = /^([a-zA-Z0-9]+(,\s*)?)+$/;
    if (!formData.tags || !tagsRegex.test(formData.tags)) {
      errs.tags = ['Tags must be comma-separated words'];
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent, force = false) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const method = editingContact ? 'PUT' : 'POST';
    const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';

    setManualConflict(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, force }),
      });

      if (response.ok) {
        fetchContacts(); // Refetch contacts to update the table
        alert(`Contact ${editingContact ? 'updated' : 'created'} successfully!`);
        handleCloseDialog();
      } else {
        if (response.status === 409) {
          const { duplicate } = await response.json();
          setManualConflict({ new: formData, duplicate });
          return;
        }
        const errorData = await response.json();
        setErrors(errorData);
        alert(`Error: ${errorData.message || 'Something went wrong'}`);
      }
    } catch (error) {
      console.error('Failed to save contact', error);
      alert('Failed to save contact.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const response = await fetch(`/api/contacts/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchContacts(); // Refetch contacts to update the table
          alert('Contact deleted successfully!');
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.message || 'Something went wrong'}`);
        }
      } catch (error) {
        console.error('Failed to delete contact', error);
        alert('Failed to delete contact.');
      }
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setImportProgress({
      inProgress: true,
      importedCount: 0,
      duplicateCount: 0,
      totalCount: 0,
      error: null,
    });

    setDuplicateConflicts([]);
    setContactsToConfirm([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setImportProgress((prev) => ({
          ...prev,
          inProgress: false,
          ...result,
        }));
        fetchContacts();
      } else if (response.status === 409) {
        const { newContacts, duplicateContacts } = await response.json();
        setImportProgress({ inProgress: false, importedCount: 0, duplicateCount: 0, totalCount: 0, error: null });
        setContactsToConfirm(newContacts);
        setDuplicateConflicts(duplicateContacts);
      } else {
        const errorData = await response.json();
        setImportProgress({
          inProgress: false,
          importedCount: 0,
          duplicateCount: 0,
          totalCount: 0,
          error: errorData.message || 'Something went wrong',
        });
      }
    } catch (error) {
      console.error('Failed to import contacts', error);
      setImportProgress({ inProgress: false, importedCount: 0, duplicateCount: 0, totalCount: 0, error: 'Failed to import contacts.' });
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL contacts? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/contacts`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchContacts(); // Refetch contacts to update the table
          alert('All contacts deleted successfully!');
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.message || 'Something went wrong'}`);
        }
      } catch (error) {
        console.error('Failed to delete all contacts', error);
        alert('Failed to delete all contacts.');
      }
    }
  };

  const handleConfirmImport = async (contactsToAdd: Contact[]) => {
    setDuplicateConflicts([]);
    const finalContacts = [...contactsToConfirm, ...contactsToAdd];

    if (finalContacts.length === 0) {
      alert("No new contacts to import.");
      return;
    }

    setImportProgress({ inProgress: true, importedCount: 0, duplicateCount: 0, totalCount: 0, error: null });

    try {
      const response = await fetch('/api/contacts/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactsToImport: finalContacts }),
      });

      if (response.ok) {
        const result = await response.json();
        setImportProgress({ inProgress: false, importedCount: result.importedCount, duplicateCount: duplicateConflicts.length - contactsToAdd.length, totalCount: finalContacts.length + (duplicateConflicts.length - contactsToAdd.length), error: null });
        fetchContacts();
      } else {
        throw new Error('Failed to confirm import');
      }
    } catch (error) {
      setImportProgress({ inProgress: false, importedCount: 0, duplicateCount: 0, totalCount: 0, error: 'Failed to confirm import.' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const columns = [
    { title: 'Name', data: 'name' },
    { title: 'Email', data: 'email' },
    { title: 'Phone', data: 'phone' },
    { title: 'WhatsApp', data: 'whatsapp' },
    { title: 'Address', data: 'address' },
    { title: 'Tags', data: 'tags' },
    {
      title: 'Actions',
      data: null, // We are not binding to a single property
      render: (data: any, type: any, row: Contact) => {
        // The `row` parameter contains the full data object for the current row
        return `
          <button class="text-blue-500 hover:text-blue-700 mr-2" onclick="window.handleOpenDialogWrapper(${row.id})">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>
          </button>
          <button class="text-red-500 hover:text-red-700" onclick="window.handleDeleteWrapper(${row.id})">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
          </button>
        `;
      },
      className: 'dt-body-center',
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <style>{`
        .dt-input {
          margin-right: 1rem;
        }
      `}</style>

      <div className="d-flex justify-content-space-evenly">
        <h1 className="text-2xl font-bold mb-4">
          Contacts ({contacts.length})
          <button
            onClick={() => handleOpenDialog()}
            className="float-right bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm ml-4"
          >
            Add Contact
          </button>
          <button
            onClick={handleImportClick}
            className="float-right bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm ml-4"
          >
            Import Contacts
          </button>
          <button
            onClick={handleDeleteAll}
            className="float-right bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm ml-4"
          >
            Delete All
          </button>
          <a
            href="/file/contact_format.xlsx"
            download
            className="float-right bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm ml-4"
          >
            Download Format
          </a>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".xlsx, .xls"
          />
        </h1>
      
      </div>

      {duplicateConflicts.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Duplicate Contacts Found</h2>
            <p className="mb-4">Choose whether to "Add Anyway" or "Skip" the following contacts that seem to be duplicates.</p>
            <div className="space-y-4">
              {duplicateConflicts.map((conflict, index) => (
                <div key={index} className="border p-4 rounded-md bg-yellow-50">
                  <h4 className="font-bold text-red-600">Potential Duplicate</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="font-semibold">New Contact (from Excel)</p>
                      <p><strong>Name:</strong> {conflict.new.name}</p>
                      <p><strong>Email:</strong> {conflict.new.email}</p>
                      <p><strong>Phone:</strong> {conflict.new.phone}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Existing Contact (in Database)</p>
                      <p><strong>Name:</strong> {conflict.existing.name}</p>
                      <p><strong>Email:</strong> {conflict.existing.email}</p>
                      <p><strong>Phone:</strong> {conflict.existing.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => handleConfirmImport([])} className="px-4 py-2 bg-gray-400 rounded hover:bg-gray-500">Skip All Duplicates</button>
              <button onClick={() => handleConfirmImport(duplicateConflicts.map(c => c.new))} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Add All Anyway</button>
              <button onClick={() => setDuplicateConflicts([])} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel Import</button>
            </div>
          </div>
        </div>
      )}

      {manualConflict && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4 text-red-600">Potential Duplicate</h2>
            <p className="mb-4">This contact appears to be a duplicate of an existing contact. Do you want to add it anyway?</p>
            <div className="grid grid-cols-2 gap-4 mt-2 border-t border-b py-4">
              <div>
                <p className="font-semibold">New/Updated Contact</p>
                <p><strong>Name:</strong> {manualConflict.new.name}</p>
                <p><strong>Email:</strong> {manualConflict.new.email}</p>
                <p><strong>Phone:</strong> {manualConflict.new.phone}</p>
              </div>
              <div>
                <p className="font-semibold">Existing Contact</p>
                <p><strong>Name:</strong> {manualConflict.duplicate.name}</p>
                <p><strong>Email:</strong> {manualConflict.duplicate.email}</p>
                <p><strong>Phone:</strong> {manualConflict.duplicate.phone}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setManualConflict(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={(e) => { handleSubmit(e, true); }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Save Anyway</button>
            </div>
          </div>
        </div>
      )}

      {importProgress.inProgress && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Importing Contacts...</h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            </div>
            <p className="text-center mt-2">Please wait while we import your contacts.</p>
          </div>
        </div>
      )}

      {(importProgress.totalCount > 0 || importProgress.error) && !importProgress.inProgress && (
         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setImportProgress({ inProgress: false, importedCount: 0, duplicateCount: 0, totalCount: 0, error: null })}>
           <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
             <h2 className="text-lg font-bold mb-4">Import Complete</h2>
             {importProgress.error ? (
               <p className="text-red-500">{importProgress.error}</p>
             ) : (
               <div>
                 <p>Total contacts in file: {importProgress.totalCount}</p>
                 <p className="text-green-500">Successfully imported: {importProgress.importedCount}</p>
                 <p className="text-red-500">Duplicate contacts found: {importProgress.duplicateCount}</p>
               </div>
             )}
             <div className="flex justify-end mt-4">
                <button onClick={() => setImportProgress({ inProgress: false, importedCount: 0, duplicateCount: 0, totalCount: 0, error: null })} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Close
                </button>
             </div>
           </div>
         </div>
      )}

      {showDialog && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={handleCloseDialog}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">{editingContact ? 'Edit Contact' : 'Create Contact'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full border p-2 rounded"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name[0]}</p>}
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full border p-2 rounded"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email[0]}</p>}
              </div>

              <div>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 10-digit phone"
                  className="w-full border p-2 rounded"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone[0]}</p>}
              </div>

              <div>
                <input
                  type="text"
                  name="whatsapp"
                  placeholder="+91 10-digit whatsapp"
                  className="w-full border p-2 rounded"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
                {errors.whatsapp && <p className="text-red-500 text-xs">{errors.whatsapp[0]}</p>}
              </div>

              <div>
                <textarea
                  name="address"
                  placeholder="Address"
                  className="w-full border p-2 rounded"
                  value={formData.address}
                  onChange={handleChange as any}
                ></textarea>
                {errors.address && <p className="text-red-500 text-xs">{errors.address[0]}</p>}
              </div>

              <div>
                <input
                  type="text"
                  name="tags"
                  placeholder="tag1,tag2,tag3"
                  className="w-full border p-2 rounded"
                  value={formData.tags}
                  onChange={handleChange}
                />
                {errors.tags && <p className="text-red-500 text-xs">{errors.tags[0]}</p>}
              </div>
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
                  {editingContact ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <DataTable
          data={contacts}
          columns={columns}
          options={{ responsive: true, select: true }}
          className="display"
        />
      </div>
    </div>
  );
}