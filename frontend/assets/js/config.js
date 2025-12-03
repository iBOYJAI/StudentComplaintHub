export const config = {
  apiBaseUrl: 'http://localhost:5000/api',
  appName: 'Student Complaint Hub',
  version: '1.0.0',
  
  // Pagination
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  
  // File upload
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Timeouts
  requestTimeout: 30000, // 30 seconds
  
  // Status
  complaintStatuses: ['open', 'in_progress', 'resolved', 'closed', 'escalated'],
  priorities: ['low', 'medium', 'high'],
  roles: ['student', 'staff', 'admin'],
};
