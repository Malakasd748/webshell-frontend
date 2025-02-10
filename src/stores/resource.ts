import { ref, computed } from 'vue';
import { useAsyncState } from '@vueuse/core';
import { defineStore } from 'pinia';

import { getResourceList } from '@/api/sc_ic/sc';
import { HpcResource } from '../hpcResource';

export const useWebshellResourceStore = defineStore('webshell-resource', () => {
  const fetchResources = useAsyncState<HpcResource[]>(
    async () => {
      const { data } = await getResourceList({});
      if (data.success !== 'yes') {
        return [];
      }

      return data.results.map(
        (r) =>
          new HpcResource({
            id: r.id,
            name: r.resource_name,
          }),
      );
    },
    [],
    { immediate: false },
  );

  const selectedResourceId = ref<string>();
  const activeManager = computed(
    () => fetchResources.state.value.find((r) => r.id === selectedResourceId.value)?.manager,
  );

  return {
    resources: fetchResources.state,
    selectedResourceId,
    activeManager,
    fetchResources: () => fetchResources.execute(),
  };
});
