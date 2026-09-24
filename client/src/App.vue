<script setup>
import { ref, onMounted } from 'vue';
import { useUsers } from './composables/useUsers.js';
import UserForm from './components/UserForm.vue';
import UserTable from './components/UserTable.vue';

const {
  users, total, search, loading, error,
  page, pageCount, goTo, load,
  create, update, remove,
} = useUsers();

const editing = ref(null);
const notice = ref('');

onMounted(load);

function flash(message) {
  notice.value = message;
  setTimeout(() => (notice.value = ''), 3000);
}

// Passed to the form; rejections flow back so it can show field-level errors.
async function save(payload) {
  if (editing.value) {
    await update(editing.value.id, payload);
    flash('User updated');
    editing.value = null;
  } else {
    await create(payload);
    flash('User added');
  }
}

async function onDelete(user) {
  if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
  try {
    await remove(user.id);
    if (editing.value?.id === user.id) editing.value = null;
    flash('User deleted');
  } catch (err) {
    flash(err.message);
  }
}
</script>

<template>
  <div class="page">
    <header>
      <div>
        <h1>User Directory</h1>
        <p class="sub">Express &middot; SQLite &middot; Vue 3</p>
      </div>
      <span class="count">{{ total }} {{ total === 1 ? 'user' : 'users' }}</span>
    </header>

    <p v-if="notice" class="toast">{{ notice }}</p>

    <div class="layout">
      <UserForm
        :editing="editing"
        :on-save="save"
        @cancel="editing = null"
      />

      <section class="card list">
        <div class="toolbar">
          <input
            v-model="search"
            type="search"
            class="search"
            placeholder="Search name or email…"
            aria-label="Search users"
          />
        </div>

        <p v-if="error" class="banner">{{ error }}</p>

        <UserTable
          :users="users"
          :loading="loading"
          :editing-id="editing?.id ?? null"
          @edit="editing = $event"
          @delete="onDelete"
        />

        <div v-if="pageCount > 1" class="pager">
          <button type="button" :disabled="page <= 1" @click="goTo(page - 1)">Previous</button>
          <span>Page {{ page }} of {{ pageCount }}</span>
          <button type="button" :disabled="page >= pageCount" @click="goTo(page + 1)">Next</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1040px; margin: 0 auto; padding: 2.5rem 1rem 4rem; }

header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
h1 { margin: 0; font-size: 1.5rem; letter-spacing: -0.02em; }
.sub { margin: 0.2rem 0 0; color: var(--muted); font-size: 0.85rem; }
.count {
  font-size: 0.8rem;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
}

.layout { display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 300px) minmax(0, 1fr); align-items: start; }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
}

.list { display: grid; gap: 1rem; }
.toolbar { display: flex; gap: 0.5rem; }
.search { width: 100%; }

.toast {
  margin: 0 0 1rem;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  color: var(--accent-ink);
}
.banner {
  margin: 0;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: var(--muted);
}
</style>
