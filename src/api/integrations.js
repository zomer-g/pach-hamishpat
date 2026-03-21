export async function UploadFile({ file }) {
  const formData = new FormData();
  formData.append('file', file);
  const headers = {};
  const token = localStorage.getItem('admin_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch('/api/upload', { method: 'POST', body: formData, headers });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}
