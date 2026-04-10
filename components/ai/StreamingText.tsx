'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Table } from '@mantine/core';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  if (!content && isStreaming) {
    return (
      <Box style={{ display: 'inline-block' }}>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 16,
            backgroundColor: '#667eea',
            animation: 'blink 1s infinite',
          }}
        />
        <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      </Box>
    );
  }

  return (
    <Box className="agent-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({ children }) => (
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '12px 0 6px' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: '6px 0', lineHeight: 1.6 }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: 2 }}>{children}</li>
          ),
          table: ({ children }) => (
            <Table
              striped
              highlightOnHover
              withTableBorder
              withColumnBorders
              style={{ fontSize: '12px', marginTop: 8, marginBottom: 8 }}
            >
              {children}
            </Table>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.startsWith('language-');
            if (isBlock) {
              return (
                <Box
                  component="pre"
                  p="xs"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderRadius: 6,
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  <code>{children}</code>
                </Box>
              );
            }
            return (
              <code
                style={{
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: '12px',
                }}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 16,
              backgroundColor: '#667eea',
              animation: 'blink 1s infinite',
              verticalAlign: 'text-bottom',
              marginLeft: 2,
            }}
          />
          <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
        </>
      )}
    </Box>
  );
}
