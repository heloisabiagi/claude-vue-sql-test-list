<script setup>
defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  editingId: { type: Number, default: null },
});
defineEmits(['edit', 'delete']);

function formatDate(value) {
  // SQLite returns "YYYY-MM-DD HH:MM:SS" in UTC; make it an ISO instant first.
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<template>
  <div class="wrap" :class="{ busy: loading }">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Added</th>
          <th aria-label="Actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" :class="{ active: user.id === editingId }">
          <td class="name">{{ user.name }}</td>
          <td class="email">{{ user.email }}</td>
          <td><span class="pill" :data-role="user.role">{{ user.role }}</span></td>
          <td class="muted">{{ formatDate(user.createdAt) }}</td>
          <td class="row-actions">
            <button type="button" @click="$emit('edit', user)">Edit</button>
            <button type="button" class="danger" @click="$emit('delete', user)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="!users.length && !loading" class="empty">No users to show.</p>
  </div>
</template>

<style scoped>
.wrap { overflow-x: auto; transition: opacity 0.15s ease; }
.busy { opacity: 0.55; }

table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th {
  text-align: left;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-weight: 600;
  padding: 0 0.75rem 0.6rem;
  border-bottom: 1px solid var(--border);
}
td { padding: 0.7rem 0.75rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
tr.active td { background: var(--accent-soft); }
tbody tr:last-child td { border-bottom: none; }

.name { font-weight: 550; white-space: nowrap; }
.email { color: var(--muted); }
.muted { color: var(--muted); white-space: nowrap; }

.pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.74rem;
  border: 1px solid var(--border);
  text-transform: capitalize;
}
.pill[data-role='admin'] { background: var(--accent-soft); border-color: var(--accent-border); color: var(--accent-ink); }

.row-actions { display: flex; gap: 0.35rem; justify-content: flex-end; }
.row-actions button { font-size: 0.8rem; padding: 0.3rem 0.6rem; }

.empty { text-align: center; color: var(--muted); padding: 2rem 0 1rem; font-size: 0.9rem; }
</style>
