import { ref, computed, watch } from 'vue';
import { api } from '../api.js';

const PAGE_SIZE = 10;

/** Owns the user list: fetching, searching, paging, and the CRUD calls. */
export function useUsers() {
  const users = ref([]);
  const total = ref(0);
  const offset = ref(0);
  const search = ref('');
  const loading = ref(false);
  const error = ref('');

  const page = computed(() => Math.floor(offset.value / PAGE_SIZE) + 1);
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const { data, meta } = await api.list({
        search: search.value,
        limit: PAGE_SIZE,
        offset: offset.value,
      });
      users.value = data;
      total.value = meta.total;

      // A delete can empty the last page; step back so the view is never blank.
      if (data.length === 0 && offset.value > 0) {
        offset.value = Math.max(0, offset.value - PAGE_SIZE);
        await load();
      }
    } catch (e) {
      error.value = e.message;
      users.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  let debounce;
  watch(search, () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      offset.value = 0;
      load();
    }, 250);
  });

  function goTo(nextPage) {
    const target = Math.min(Math.max(1, nextPage), pageCount.value);
    offset.value = (target - 1) * PAGE_SIZE;
    load();
  }

  // These rethrow so the form can surface field-level validation errors.
  async function create(payload) {
    const { data } = await api.create(payload);
    offset.value = 0;
    await load();
    return data;
  }

  async function update(id, patch) {
    const { data } = await api.update(id, patch);
    await load();
    return data;
  }

  async function remove(id) {
    await api.remove(id);
    await load();
  }

  return {
    users, total, search, loading, error,
    page, pageCount, goTo, load,
    create, update, remove,
  };
}
