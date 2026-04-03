import api from '../api';

export interface Attachment {
  id: number;
  filename: string;
  storedFilename: string;
  mimeType: string;
  size: number;
  path: string;
  todoId?: number | null;
  sessionId?: number | null;
  sessionCollectiveId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export const attachmentsService = {
  async upload(
    file: File,
    target: { todoId?: number; sessionId?: number; sessionCollectiveId?: number },
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (target.todoId) params.set('todoId', target.todoId.toString());
    if (target.sessionId) params.set('sessionId', target.sessionId.toString());
    if (target.sessionCollectiveId) params.set('sessionCollectiveId', target.sessionCollectiveId.toString());

    const response = await api.post(`/attachments/upload?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async list(target: {
    todoId?: number;
    sessionId?: number;
    sessionCollectiveId?: number;
  }): Promise<Attachment[]> {
    const params: any = {};
    if (target.todoId) params.todoId = target.todoId;
    if (target.sessionId) params.sessionId = target.sessionId;
    if (target.sessionCollectiveId) params.sessionCollectiveId = target.sessionCollectiveId;

    const response = await api.get('/attachments', { params });
    return response.data;
  },

  async download(id: number): Promise<void> {
    const response = await api.get(`/attachments/${id}/download`, {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) filename = decodeURIComponent(match[1]);
    }

    // Trigger browser download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/attachments/${id}`);
  },
};
