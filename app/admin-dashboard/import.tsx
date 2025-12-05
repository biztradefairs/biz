'use client';

import { useState } from 'react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: string[];
    errors?: string[];
  } | null>(null);

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a CSV or Excel file');
      return;
    }
    
    setLoading(true);
    setMessage('Uploading...');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/import-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✅ ${data.message}`);
        setResult({
          imported: data.imported || [],
          errors: data.errors || []
        });
      } else {
        setMessage(`❌ ${data.message || 'Upload failed'}`);
        if (data.errors) {
          setResult({
            imported: [],
            errors: data.errors
          });
        }
      }
    } catch (error: any) {
      setMessage(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'eventTitle',
      'eventDescription',
      'shortDescription',
      'slug',
      'edition',
      'startDate',
      'endDate',
      'registrationStart',
      'registrationEnd',
      'timezone',
      'category',
      'eventType',
      'tags',
      'status',
      'isFeatured',
      'isVIP',
      'isPublic',
      'requiresApproval',
      'allowWaitlist',
      'maxAttendees',
      'currency',
      'isVirtual',
      'virtualLink',
      'images',
      'videos',
      'brochure',
      'layoutPlan',
      'documents',
      'bannerImage',
      'thumbnailImage',
      'metaTitle',
      'metaDescription',
      'organizerName',
      'organizerEmail',
      'speakerNames',
      'speakerEmails',
      'exhibitorNames',
      'exhibitorEmails',
      'venueName',
      'venueEmail',
      'venueAddress',
      'venueCity',
      'venueState',
      'venueCountry',
      'venueZipCode',
      'venuePhone',
      'venueWebsite',
      'maxCapacity',
      'totalHalls',
      'amenities',
      'venueImages',
      'venueVideos',
      'floorPlans',
      'virtualTour',
      'basePrice',
      'venueCurrency',
      'latitude',
      'longitude',
      'refundPolicy',
      'eventCategoryNames',
      'countryNames',
      'cityNames'
    ];

    const sampleRow = [
      'Tech Expo 2025',
      'Annual innovation conference showcasing latest technologies from AI to renewable energy',
      'Premier tech event of the year',
      'tech-expo-2025',
      '2025 Edition',
      '2025-05-01',
      '2025-05-03',
      '2025-01-01',
      '2025-04-15',
      'America/Los_Angeles',
      'Technology,AI,Innovation',
      'CONFERENCE,EXHIBITION',
      'AI,Innovation,Machine Learning,Renewable Energy',
      'PUBLISHED',
      'TRUE',
      'FALSE',
      'TRUE',
      'FALSE',
      'TRUE',
      '1000',
      'USD',
      'FALSE',
      'https://techexpo2025.com/virtual',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200,https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      'https://youtube.com/watch?v=tech2025,https://youtube.com/watch?v=innovation2025',
      'https://techexpo2025.com/brochure.pdf',
      'https://techexpo2025.com/layout.pdf',
      'https://techexpo2025.com/terms.pdf,https://techexpo2025.com/guide.pdf',
      'https://images.unsplash.com/photo-1518834103328-0d0b7d4d5c8c?w=1600',
      'https://images.unsplash.com/photo-1518834103328-0d0b7d4d5c8c?w=400',
      'Tech Expo 2025 | Technology Conference',
      'Join the premier technology conference of 2025 featuring AI, ML and innovation',
      'John Doe',
      'john@techexpo.com',
      'Sarah Lee|Mark Johnson|David Chen',
      'sarah@microsoft.com|mark@google.com|david@openai.com',
      'Microsoft|Google|Intel|IBM',
      'contact@microsoft.com|contact@google.com|contact@intel.com|contact@ibm.com',
      'San Francisco Convention Center',
      'info@sfcc.com',
      '747 Howard Street',
      'San Francisco',
      'California',
      'USA',
      '94103',
      '+1-415-974-4000',
      'https://www.sfcc.com',
      '10000',
      '25',
      'WiFi,AV Equipment,Catering,Parking,Conference Rooms,Expo Halls',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200,https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
      'https://youtube.com/watch?v=sfcc-tour',
      'https://sfcc.com/floorplan-level1.pdf,https://sfcc.com/floorplan-level2.pdf',
      'https://sfcc.com/virtual-tour',
      '10000',
      'USD',
      '37.785',
      '-122.4003',
      'Full refund up to 30 days before event. 50% refund up to 15 days before event.',
      'Technology,AI',
      'United States',
      'San Francisco'
    ];

    // Create TSV (Tab-Separated Values) content
    // Excel handles TSV better than CSV for complex data
    const tsvRows = [headers.join('\t'), sampleRow.join('\t')];
    const tsvContent = tsvRows.join('\n');
    
    // Use .tsv extension for clarity
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'event_import_template.tsv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage('📥 Template downloaded as TSV file! Open in Excel for best results.');
  };

  // OR Option 2: Generate proper CSV with proper escaping
  const handleDownloadCSVTemplate = () => {
    const headers = [
      'eventTitle',
      'eventDescription',
      'shortDescription',
      'slug',
      'edition',
      'startDate',
      'endDate',
      'registrationStart',
      'registrationEnd',
      'timezone',
      'category',
      'eventType',
      'tags',
      'status',
      'isFeatured',
      'isVIP',
      'isPublic',
      'requiresApproval',
      'allowWaitlist',
      'maxAttendees',
      'currency',
      'isVirtual',
      'virtualLink',
      'images',
      'videos',
      'brochure',
      'layoutPlan',
      'documents',
      'bannerImage',
      'thumbnailImage',
      'metaTitle',
      'metaDescription',
      'organizerName',
      'organizerEmail',
      'speakerNames',
      'speakerEmails',
      'exhibitorNames',
      'exhibitorEmails',
      'venueName',
      'venueEmail',
      'venueAddress',
      'venueCity',
      'venueState',
      'venueCountry',
      'venueZipCode',
      'venuePhone',
      'venueWebsite',
      'maxCapacity',
      'totalHalls',
      'amenities',
      'venueImages',
      'venueVideos',
      'floorPlans',
      'virtualTour',
      'basePrice',
      'venueCurrency',
      'latitude',
      'longitude',
      'refundPolicy',
      'eventCategoryNames',
      'countryNames',
      'cityNames'
    ];

    const sampleRow = [
      'Tech Expo 2025',
      'Annual innovation conference showcasing latest technologies from AI to renewable energy',
      'Premier tech event of the year',
      'tech-expo-2025',
      '2025 Edition',
      '2025-05-01',
      '2025-05-03',
      '2025-01-01',
      '2025-04-15',
      'America/Los_Angeles',
      'Technology,AI,Innovation',
      'CONFERENCE,EXHIBITION',
      'AI,Innovation,Machine Learning,Renewable Energy',
      'PUBLISHED',
      'TRUE',
      'FALSE',
      'TRUE',
      'FALSE',
      'TRUE',
      '1000',
      'USD',
      'FALSE',
      'https://techexpo2025.com/virtual',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200,https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      'https://youtube.com/watch?v=tech2025,https://youtube.com/watch?v=innovation2025',
      'https://techexpo2025.com/brochure.pdf',
      'https://techexpo2025.com/layout.pdf',
      'https://techexpo2025.com/terms.pdf,https://techexpo2025.com/guide.pdf',
      'https://images.unsplash.com/photo-1518834103328-0d0b7d4d5c8c?w=1600',
      'https://images.unsplash.com/photo-1518834103328-0d0b7d4d5c8c?w=400',
      'Tech Expo 2025 | Technology Conference',
      'Join the premier technology conference of 2025 featuring AI, ML and innovation',
      'John Doe',
      'john@techexpo.com',
      'Sarah Lee|Mark Johnson|David Chen',
      'sarah@microsoft.com|mark@google.com|david@openai.com',
      'Microsoft|Google|Intel|IBM',
      'contact@microsoft.com|contact@google.com|contact@intel.com|contact@ibm.com',
      'San Francisco Convention Center',
      'info@sfcc.com',
      '747 Howard Street',
      'San Francisco',
      'California',
      'USA',
      '94103',
      '+1-415-974-4000',
      'https://www.sfcc.com',
      '10000',
      '25',
      'WiFi,AV Equipment,Catering,Parking,Conference Rooms,Expo Halls',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200,https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
      'https://youtube.com/watch?v=sfcc-tour',
      'https://sfcc.com/floorplan-level1.pdf,https://sfcc.com/floorplan-level2.pdf',
      'https://sfcc.com/virtual-tour',
      '10000',
      'USD',
      '37.785',
      '-122.4003',
      'Full refund up to 30 days before event. 50% refund up to 15 days before event.',
      'Technology,AI',
      'United States',
      'San Francisco'
    ];

    // Proper CSV escaping
    const escapeCSV = (field: any) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const csvRows = [headers.map(escapeCSV).join(','), sampleRow.map(escapeCSV).join(',')];
    const csvContent = csvRows.join('\r\n'); // Windows line endings for Excel
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'event_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage('📥 CSV template downloaded! Open in Excel and save as .xlsx if needed.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['.csv', '.tsv', '.xlsx', '.xls', '.txt'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setFile(selectedFile);
        setMessage(`📄 Selected: ${selectedFile.name}`);
        setResult(null);
      } else {
        alert('Please select a CSV, TSV, or Excel file (.csv, .tsv, .xlsx, .xls)');
        e.target.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Data Import</h1>
        <p className="text-gray-600 mb-8">
          Import multiple events from Excel/CSV/TSV files. Download the template first, fill in your data, then upload.
        </p>

        {/* Download Template Section */}
        <div className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">📥 Step 1: Download Template</h2>
          <p className="text-blue-700 mb-4">
            Choose your preferred format. TSV works better with Excel for complex data.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download TSV Template (Recommended for Excel)
            </button>
            
            <button
              onClick={handleDownloadCSVTemplate}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV Template
            </button>
          </div>
          
          <div className="mt-4 text-sm text-blue-600">
            <p><strong>TSV:</strong> Better for Excel, preserves commas in data fields</p>
            <p><strong>CSV:</strong> Standard format for most applications</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-10 p-6 bg-green-50 rounded-lg border border-green-200">
          <h2 className="text-xl font-semibold text-green-800 mb-3">📤 Step 2: Upload Your File</h2>
          <p className="text-green-700 mb-4">
            Upload your filled file. Supports CSV, TSV, Excel (.xlsx, .xls) formats.
          </p>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.tsv,.xlsx,.xls,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-gray-500 text-sm">CSV, TSV, or Excel files (max 10MB)</p>
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setMessage('');
                    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition duration-200 ${
                !file || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading Events...
                </span>
              ) : (
                'Upload and Import Events'
              )}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') || message.includes('📥') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : message.includes('❌')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              {message.includes('✅') && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {message.includes('❌') && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {/* Successfully Imported Events */}
            {result.imported.length > 0 && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Successfully Imported Events ({result.imported.length})
                </h3>
                <div className="bg-white rounded border border-green-100 overflow-hidden">
                  <ul className="divide-y divide-green-100 max-h-60 overflow-y-auto">
                    {result.imported.map((event, index) => (
                      <li key={index} className="px-4 py-3 hover:bg-green-50 flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-800 rounded-full text-sm">
                          {index + 1}
                        </span>
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Errors Display */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Import Errors ({result.errors.length})
                </h3>
                <div className="bg-white rounded border border-red-100 overflow-hidden">
                  <ul className="divide-y divide-red-100 max-h-60 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <li key={index} className="px-4 py-3 hover:bg-red-50 text-sm">
                        <span className="font-medium text-red-700">{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Information */}
        <div className="mt-10 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Import Guidelines</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Required fields:</strong> eventTitle, startDate, endDate, organizerName, organizerEmail</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Dates format:</strong> YYYY-MM-DD (e.g., 2025-05-01)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Multiple values:</strong> Use commas for arrays (tags, categories) and pipes for multiple people (speakers, exhibitors)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Boolean values:</strong> Use "TRUE" or "FALSE" (uppercase)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Phone numbers:</strong> Use format like +1-415-974-4000 (not -5244)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Save as Excel:</strong> If using TSV/CSV, open in Excel and save as .xlsx for best results</span>
            </li>
          </ul>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Note:</h4>
            <p className="text-yellow-700 text-sm">
              Your data shows phone number as "-5244". This appears to be Excel converting "+1-415-974-4000" 
              to a negative number. To fix: Format the cell as Text before entering phone numbers, 
              or use quotes: "+1-415-974-4000"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}