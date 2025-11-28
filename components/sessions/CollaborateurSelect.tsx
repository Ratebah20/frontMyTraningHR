'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Combobox,
  useCombobox,
  TextInput,
  ScrollArea,
  Loader,
  Text,
  Group,
  Avatar,
  Badge,
  CheckIcon,
  Pill,
  PillsInput,
  Box,
  CloseButton,
} from '@mantine/core';
import { useDebouncedValue, useDebouncedCallback } from '@mantine/hooks';
import { MagnifyingGlass, User, Users } from '@phosphor-icons/react';
import { Collaborateur } from '@/lib/types';
import { collaborateursService } from '@/lib/services/collaborateurs.service';

interface CollaborateurSelectProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
}

const PAGE_SIZE = 20;

export function CollaborateurSelect({
  value,
  onChange,
  multiple = false,
  label,
  placeholder = 'Rechercher un collaborateur...',
  error,
  required = false,
  disabled = false,
  description,
}: CollaborateurSelectProps) {
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadedIdsRef = useRef<Set<number>>(new Set());
  const isLoadingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      if (!multiple) {
        setSearchValue('');
      }
    },
  });

  // Valeurs sélectionnées (toujours un tableau pour simplifier la logique)
  const selectedValues = multiple
    ? (value as string[]) || []
    : value ? [value as string] : [];

  // Charger les collaborateurs initiaux
  useEffect(() => {
    loadInitialCollaborateurs();
  }, []);

  // Charger les infos des collaborateurs sélectionnés
  useEffect(() => {
    loadSelectedCollaborateurs();
  }, [value]);

  // Recherche avec debounce
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchCollaborateurs(debouncedSearch);
    } else if (debouncedSearch.length === 0 && !loading) {
      resetToInitial();
    }
  }, [debouncedSearch]);

  const loadInitialCollaborateurs = async () => {
    try {
      setLoading(true);
      const response = await collaborateursService.getCollaborateurs({
        limit: PAGE_SIZE,
        page: 1,
        includeInactive: true,
      });

      const collabs = response.data || [];
      setCollaborateurs(collabs);
      setHasMore(response.meta?.hasNext ?? collabs.length === PAGE_SIZE);
      setPage(1);
      loadedIdsRef.current = new Set(collabs.map(c => c.id));
    } catch (error) {
      console.error('Erreur chargement collaborateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToInitial = async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      const response = await collaborateursService.getCollaborateurs({
        limit: PAGE_SIZE,
        page: 1,
        includeInactive: true,
      });

      const collabs = response.data || [];

      // Conserver les collaborateurs sélectionnés
      const selectedIds = new Set(selectedValues.map(id => parseInt(id)));
      const selectedCollabs = collaborateurs.filter(c => selectedIds.has(c.id));

      const combined = [...collabs];
      selectedCollabs.forEach(collab => {
        if (!combined.find(c => c.id === collab.id)) {
          combined.push(collab);
        }
      });

      setCollaborateurs(combined);
      setHasMore(response.meta?.hasNext ?? collabs.length === PAGE_SIZE);
      setPage(1);
      loadedIdsRef.current = new Set(combined.map(c => c.id));
    } catch (error) {
      console.error('Erreur reset:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const loadSelectedCollaborateurs = async () => {
    const missingIds = selectedValues
      .map(id => parseInt(id))
      .filter(id => !loadedIdsRef.current.has(id));

    if (missingIds.length === 0) return;

    try {
      const promises = missingIds.map(id =>
        collaborateursService.getCollaborateur(id).catch(() => null)
      );
      const results = await Promise.all(promises);
      const validResults = results.filter((c): c is Collaborateur => c !== null);

      if (validResults.length > 0) {
        setCollaborateurs(prev => {
          const combined = [...prev, ...validResults];
          return combined.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
        });
        validResults.forEach(c => loadedIdsRef.current.add(c.id));
      }
    } catch (error) {
      console.error('Erreur chargement sélectionnés:', error);
    }
  };

  const searchCollaborateurs = async (search: string) => {
    try {
      setLoading(true);
      const response = await collaborateursService.getCollaborateurs({
        search,
        limit: 50,
        includeInactive: true,
      });

      const searchResults = response.data || [];

      // Conserver les sélectionnés
      const selectedIds = new Set(selectedValues.map(id => parseInt(id)));
      const selectedCollabs = collaborateurs.filter(c => selectedIds.has(c.id));

      const combined = [...searchResults];
      selectedCollabs.forEach(collab => {
        if (!combined.find(c => c.id === collab.id)) {
          combined.push(collab);
        }
      });

      setCollaborateurs(combined);
      setHasMore(false);
      combined.forEach(c => loadedIdsRef.current.add(c.id));
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    // Double vérification pour éviter les appels multiples
    if (!hasMore || loading || loadingMore || debouncedSearch.length > 0) {
      return;
    }

    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;

      const response = await collaborateursService.getCollaborateurs({
        limit: PAGE_SIZE,
        page: nextPage,
        includeInactive: true,
      });

      const newCollabs = response.data || [];

      if (newCollabs.length === 0) {
        setHasMore(false);
        return;
      }

      setCollaborateurs(prev => {
        const combined = [...prev, ...newCollabs];
        return combined.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
      });

      newCollabs.forEach(c => loadedIdsRef.current.add(c.id));
      setHasMore(response.meta?.hasNext ?? newCollabs.length === PAGE_SIZE);
      setPage(nextPage);
    } catch (error) {
      console.error('Erreur chargement supplémentaire:', error);
    } finally {
      setLoadingMore(false);
      // Délai avant de permettre un nouveau chargement
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 300);
    }
  }, [hasMore, loading, loadingMore, debouncedSearch, page]);

  // Gestionnaire de scroll avec debounce
  const handleScroll = useDebouncedCallback((event: { scrollHeight: number; scrollTop: number; clientHeight: number }) => {
    const threshold = 100;
    const distanceFromBottom = event.scrollHeight - event.scrollTop - event.clientHeight;

    if (distanceFromBottom < threshold && hasMore && !loading && !loadingMore && !isLoadingRef.current) {
      loadMore();
    }
  }, 150);

  const onScrollCapture = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    handleScroll({
      scrollHeight: target.scrollHeight,
      scrollTop: target.scrollTop,
      clientHeight: target.clientHeight,
    });
  };

  const handleValueSelect = (val: string) => {
    if (multiple) {
      const currentValues = selectedValues;
      const newValues = currentValues.includes(val)
        ? currentValues.filter(v => v !== val)
        : [...currentValues, val];
      onChange(newValues);
    } else {
      onChange(val);
      combobox.closeDropdown();
    }
  };

  const handleValueRemove = (val: string) => {
    if (multiple) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange('');
    }
  };

  // Options à afficher
  const options = collaborateurs.map((collab) => {
    const isSelected = selectedValues.includes(String(collab.id));
    const displayName = collab.nomComplet || `${collab.prenom} ${collab.nom}`;
    const dept = collab.departement
      ? typeof collab.departement === 'string'
        ? collab.departement
        : collab.departement.nomDepartement
      : null;

    return (
      <Combobox.Option value={String(collab.id)} key={collab.id} active={isSelected}>
        <Group gap="sm" wrap="nowrap">
          {multiple && (
            <Box style={{ width: 20 }}>
              {isSelected && <CheckIcon size={12} />}
            </Box>
          )}
          <Avatar size="sm" radius="xl" color={collab.actif !== false ? 'blue' : 'gray'}>
            {displayName.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Group gap="xs">
              <Text size="sm">{displayName}</Text>
              {collab.actif === false && (
                <Badge size="xs" color="gray" variant="light">
                  Inactif
                </Badge>
              )}
            </Group>
            {dept && (
              <Text size="xs" c="dimmed">
                {dept}
              </Text>
            )}
          </div>
        </Group>
      </Combobox.Option>
    );
  });

  // Rendu des pills pour le mode multiple
  const selectedPills = multiple && selectedValues.map((val) => {
    const collab = collaborateurs.find(c => String(c.id) === val);
    const displayName = collab
      ? (collab.nomComplet || `${collab.prenom} ${collab.nom}`)
      : `ID: ${val}`;

    return (
      <Pill
        key={val}
        withRemoveButton
        onRemove={() => handleValueRemove(val)}
        style={{ maxWidth: 200 }}
      >
        {displayName}
      </Pill>
    );
  });

  // Valeur affichée pour le mode simple
  const displayValue = !multiple && selectedValues.length > 0
    ? (() => {
        const collab = collaborateurs.find(c => String(c.id) === selectedValues[0]);
        return collab
          ? (collab.nomComplet || `${collab.prenom} ${collab.nom}`)
          : '';
      })()
    : searchValue;

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={handleValueSelect}
      withinPortal={true}
    >
      <Combobox.DropdownTarget>
        {multiple ? (
          <PillsInput
            label={label}
            description={description}
            required={required}
            disabled={disabled}
            error={error}
            pointer
            onClick={() => combobox.openDropdown()}
            leftSection={loading ? <Loader size={16} /> : <Users size={16} />}
            rightSection={
              selectedValues.length > 0 ? (
                <CloseButton
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onChange([])}
                />
              ) : null
            }
          >
            <Pill.Group>
              {selectedPills}
              <Combobox.EventsTarget>
                <PillsInput.Field
                  placeholder={selectedValues.length === 0 ? placeholder : undefined}
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.currentTarget.value);
                    combobox.openDropdown();
                    combobox.updateSelectedOptionIndex();
                  }}
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && searchValue.length === 0 && selectedValues.length > 0) {
                      handleValueRemove(selectedValues[selectedValues.length - 1]);
                    }
                  }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
        ) : (
          <TextInput
            label={label}
            description={description}
            required={required}
            disabled={disabled}
            error={error}
            placeholder={placeholder}
            value={displayValue}
            onChange={(e) => {
              setSearchValue(e.currentTarget.value);
              if (!multiple && e.currentTarget.value === '') {
                onChange('');
              }
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => combobox.closeDropdown()}
            leftSection={loading ? <Loader size={16} /> : <User size={16} />}
            rightSection={
              selectedValues.length > 0 && !disabled ? (
                <CloseButton
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange('');
                    setSearchValue('');
                  }}
                />
              ) : null
            }
          />
        )}
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize
            mah={300}
            type="scroll"
            onScrollCapture={onScrollCapture}
            viewportRef={scrollRef}
          >
            {loading && collaborateurs.length === 0 ? (
              <Combobox.Empty>
                <Group justify="center" p="sm">
                  <Loader size="sm" />
                  <Text size="sm">Chargement...</Text>
                </Group>
              </Combobox.Empty>
            ) : options.length === 0 ? (
              <Combobox.Empty>
                {searchValue.length > 0 && searchValue.length < 2
                  ? 'Tapez au moins 2 caractères'
                  : 'Aucun collaborateur trouvé'}
              </Combobox.Empty>
            ) : (
              <>
                {options}
                {loadingMore && (
                  <Box p="xs">
                    <Group justify="center">
                      <Loader size="xs" />
                      <Text size="xs" c="dimmed">Chargement...</Text>
                    </Group>
                  </Box>
                )}
                {hasMore && !loadingMore && debouncedSearch.length === 0 && (
                  <Text size="xs" c="dimmed" ta="center" p="xs">
                    ↓ Scrollez pour charger plus ({collaborateurs.length} affichés)
                  </Text>
                )}
                {!hasMore && debouncedSearch.length === 0 && (
                  <Text size="xs" c="dimmed" ta="center" p="xs">
                    {collaborateurs.length} collaborateurs chargés
                  </Text>
                )}
              </>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
