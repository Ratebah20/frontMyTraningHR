'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Select,
  Badge,
  Loader,
  Center,
  Alert,
} from '@mantine/core'
import { motion } from 'framer-motion'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock'
import { Target } from '@phosphor-icons/react/dist/ssr/Target'
import { Laptop } from '@phosphor-icons/react/dist/ssr/Laptop'
import { UsersFour } from '@phosphor-icons/react/dist/ssr/UsersFour'
import { ChalkboardTeacher } from '@phosphor-icons/react/dist/ssr/ChalkboardTeacher'
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning'
import { useReducedMotionPreference } from '@/lib/hooks/useReducedMotionPreference'
import { statsService } from '@/lib/services'
import { BilanAnnuelResponse } from '@/lib/types'

// Tuiles colorées façon "bilan de l'année" : fonds pastels fixes + encre
// sombre fixe, lisibles à l'identique en thème clair et sombre.
const TILE_INK = '#1a1b1e'
const TILE_INK_SOFT = 'rgba(26, 27, 30, 0.72)'

interface TileDef {
  key: string
  background: string
  icon: React.ComponentType<{ size?: number; weight?: any }>
  value: string
  label: string
  delta?: string | null
  meta?: string | null
}

function BilanTile({ tile, delay, reducedMotion }: { tile: TileDef; delay: number; reducedMotion: boolean }) {
  const Icon = tile.icon
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      style={{ height: '100%' }}
    >
      <Card
        radius="lg"
        p="xl"
        style={{ backgroundColor: tile.background, height: '100%', minHeight: 190 }}
      >
        <Stack gap={6} justify="space-between" style={{ height: '100%' }}>
          <Group justify="space-between" align="flex-start">
            <Text
              style={{ color: TILE_INK, fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.1 }}
            >
              {tile.value}
            </Text>
            <Icon size={30} weight="duotone" color={TILE_INK_SOFT as any} />
          </Group>
          <Stack gap={2}>
            <Text fw={600} style={{ color: TILE_INK }}>
              {tile.label}
            </Text>
            {tile.delta && (
              <Text size="sm" fw={700} style={{ color: TILE_INK }}>
                {tile.delta}
              </Text>
            )}
            {tile.meta && (
              <Text size="xs" style={{ color: TILE_INK_SOFT }}>
                {tile.meta}
              </Text>
            )}
          </Stack>
        </Stack>
      </Card>
    </motion.div>
  )
}

export default function BilanAnnuelPage() {
  const reducedMotion = useReducedMotionPreference()
  const currentYear = new Date().getFullYear()
  const [annee, setAnnee] = useState(String(currentYear))
  const [data, setData] = useState<BilanAnnuelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await statsService.getBilanAnnuel(parseInt(annee, 10))
        setData(response)
      } catch (err) {
        console.error('Erreur lors du chargement du bilan annuel:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [annee])

  const formatDelta = (pct: number | null, refYear: number, unit: string = '%'): string | null => {
    if (pct === null || pct === 0) return null
    const sign = pct > 0 ? '+' : ''
    return `${sign}${pct}${unit} vs ${refYear}`
  }

  const tiles: TileDef[] = data
    ? [
        {
          key: 'stagiaires',
          background: '#74c0fc',
          icon: Users,
          value: data.stagiaires.valeur.toLocaleString('fr-FR'),
          label: 'stagiaires formés',
          delta: formatDelta(data.stagiaires.evolutionPct, data.anneePrecedente),
          meta: `${data.stagiaires.precedent.toLocaleString('fr-FR')} en ${data.anneePrecedente}`,
        },
        {
          key: 'heures',
          background: '#fcc2d7',
          icon: Clock,
          value: `${data.heures.cumulees.toLocaleString('fr-FR')} h`,
          label: 'heures de formation suivies',
          delta: formatDelta(data.heures.evolutionPct, data.anneePrecedente),
          meta: `${data.heures.dispensees.toLocaleString('fr-FR')} h dispensées`,
        },
        {
          key: 'prioritaires',
          background: '#8ce99a',
          icon: Target,
          value: `${data.categoriesPrioritaires.pourcentage}%`,
          label: 'des stagiaires formés sur les thématiques prioritaires',
          delta: null,
          meta: data.categoriesPrioritaires.categories.join(' · '),
        },
        {
          key: 'distanciel',
          background: '#b197fc',
          icon: Laptop,
          value: `${data.distanciel.pourcentage}%`,
          label: 'de sessions collectives à distance',
          delta: formatDelta(data.distanciel.evolutionPts, data.anneePrecedente, ' pts'),
          meta: `${data.distanciel.sessionsDistanciel}/${data.distanciel.sessionsTotal} sessions collectives`,
        },
        {
          key: 'maxParticipants',
          background: '#ffd43b',
          icon: UsersFour,
          value: data.maxParticipants.nombre.toLocaleString('fr-FR'),
          label: 'participants sur une seule session (record)',
          delta: null,
          meta: data.maxParticipants.titreSession,
        },
        {
          key: 'formateurs',
          background: '#66d9e8',
          icon: ChalkboardTeacher,
          value: data.formateurs.formateursDistincts.toLocaleString('fr-FR'),
          label: 'formateurs mobilisés',
          delta: null,
          meta: `${data.formateurs.organismesDistincts} organisme${data.formateurs.organismesDistincts > 1 ? 's' : ''} de formation`,
        },
      ]
    : []

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
        >
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Stack gap={4}>
              <Title order={1}>Bilan annuel {annee}</Title>
              <Text c="dimmed">Chiffres clés de l&apos;année — comparaison avec l&apos;année précédente</Text>
            </Stack>
            <Group gap="sm">
              <Badge variant="light" color="orange" size="lg">
                Chiffres au {new Date().toLocaleDateString('fr-FR')}
              </Badge>
              <Select
                data={yearOptions}
                value={annee}
                onChange={(value) => value && setAnnee(value)}
                allowDeselect={false}
                w={110}
                aria-label="Année du bilan"
              />
            </Group>
          </Group>
        </motion.div>

        {loading ? (
          <Center h={300}>
            <Stack align="center" gap="md">
              <Loader />
              <Text c="dimmed">Chargement du bilan annuel...</Text>
            </Stack>
          </Center>
        ) : error || !data ? (
          <Alert color="red" icon={<Warning size={18} />} title="Erreur">
            Erreur lors du chargement du bilan annuel
          </Alert>
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {tiles.map((tile, index) => (
                <BilanTile key={tile.key} tile={tile} delay={0.1 + index * 0.08} reducedMotion={reducedMotion} />
              ))}
            </SimpleGrid>
            <Text size="xs" c="dimmed">
              Stagiaires et heures : sessions complétées de l&apos;année (individuelles et collectives).
              Part à distance : sessions collectives dont la modalité n&apos;est pas « présentiel ».
              Formateurs : intervenants distincts renseignés sur les sessions collectives.
            </Text>
          </>
        )}
      </Stack>
    </Container>
  )
}
