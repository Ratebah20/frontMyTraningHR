'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core'
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <Container size="md" py="xl">
          <Stack gap="md" align="center">
            <Alert
              icon={<Warning size={24} weight="fill" />}
              color="red"
              title="Une erreur est survenue"
              variant="light"
              w="100%"
            >
              <Text size="sm">
                {this.state.error?.message || 'Erreur inconnue'}
              </Text>
            </Alert>
            <Button onClick={this.handleReset} variant="light">
              Réessayer
            </Button>
          </Stack>
        </Container>
      )
    }
    return this.props.children
  }
}
