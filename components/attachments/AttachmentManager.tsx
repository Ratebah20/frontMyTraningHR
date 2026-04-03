'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Group,
  Text,
  ActionIcon,
  Button,
  Paper,
  Loader,
  Badge,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Paperclip } from '@phosphor-icons/react/dist/ssr/Paperclip';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { FilePdf } from '@phosphor-icons/react/dist/ssr/FilePdf';
import { FileDoc } from '@phosphor-icons/react/dist/ssr/FileDoc';
import { FileXls } from '@phosphor-icons/react/dist/ssr/FileXls';
import { Image } from '@phosphor-icons/react/dist/ssr/Image';
import { File } from '@phosphor-icons/react/dist/ssr/File';
import { UploadSimple } from '@phosphor-icons/react/dist/ssr/UploadSimple';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { attachmentsService, Attachment } from '@/lib/services/attachments.service';

type TargetType = 'todo' | 'session' | 'sessionCollective';

interface AttachmentManagerProps {
  targetType: TargetType;
  targetId: number;
  compact?: boolean; // Compact mode for inline display in todo items
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <FilePdf size={18} weight="bold" />;
  if (mimeType.includes('word') || mimeType.includes('doc')) return <FileDoc size={18} weight="bold" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('xls')) return <FileXls size={18} weight="bold" />;
  if (mimeType.startsWith('image/')) return <Image size={18} weight="bold" />;
  return <File size={18} weight="bold" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentManager({ targetType, targetId, compact = false }: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAttachments();
  }, [targetType, targetId]);

  const getTargetParams = () => {
    switch (targetType) {
      case 'todo': return { todoId: targetId };
      case 'session': return { sessionId: targetId };
      case 'sessionCollective': return { sessionCollectiveId: targetId };
    }
  };

  const loadAttachments = async () => {
    try {
      const data = await attachmentsService.list(getTargetParams());
      setAttachments(data);
    } catch (error) {
      console.error('Erreur chargement pièces jointes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await attachmentsService.upload(file, getTargetParams());
      }
      notifications.show({
        title: 'Succès',
        message: `${files.length} fichier(s) uploadé(s)`,
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      await loadAttachments();
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de l\'upload',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      await attachmentsService.download(attachment.id);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de télécharger le fichier',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return;

    try {
      await attachmentsService.remove(id);
      setAttachments(prev => prev.filter(a => a.id !== id));
      notifications.show({
        title: 'Succès',
        message: 'Pièce jointe supprimée',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer le fichier',
        color: 'red',
      });
    }
  };

  // Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
      style={{ display: 'none' }}
      onChange={handleUpload}
    />
  );

  // Compact mode: just a badge with count + upload button
  if (compact) {
    return (
      <>
        {fileInput}
        <Group gap="xs">
          <Tooltip label="Pièces jointes">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              <Paperclip size={16} />
            </ActionIcon>
          </Tooltip>
          {attachments.length > 0 && (
            <Badge size="xs" variant="light" color="blue">
              {attachments.length}
            </Badge>
          )}
        </Group>
      </>
    );
  }

  // Full mode
  return (
    <Stack gap="sm">
      {fileInput}

      <Group justify="space-between">
        <Group gap="xs">
          <Paperclip size={18} />
          <Text fw={600} size="sm">
            Pièces jointes
          </Text>
          {attachments.length > 0 && (
            <Badge size="sm" variant="light">{attachments.length}</Badge>
          )}
        </Group>
        <Button
          size="xs"
          variant="light"
          leftSection={<UploadSimple size={14} />}
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
        >
          Ajouter
        </Button>
      </Group>

      {loading ? (
        <Loader size="sm" />
      ) : attachments.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xs">
          Aucune pièce jointe
        </Text>
      ) : (
        <Stack gap="xs">
          {attachments.map((att) => (
            <Paper key={att.id} p="xs" withBorder radius="sm">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{ flex: 1, overflow: 'hidden' }}>
                  {getFileIcon(att.mimeType)}
                  <div style={{ overflow: 'hidden' }}>
                    <Text size="sm" fw={500} truncate>
                      {att.filename}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatFileSize(att.size)}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Tooltip label="Télécharger">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      size="sm"
                      onClick={() => handleDownload(att)}
                    >
                      <DownloadSimple size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Supprimer">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDelete(att.id)}
                    >
                      <Trash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
