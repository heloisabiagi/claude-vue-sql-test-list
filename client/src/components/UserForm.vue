<script setup>
import { ref, reactive, watch, computed } from 'vue';

const props = defineProps({
  editing: { type: Object, default: null },
  // Async; rejects with an ApiError whose `details` holds per-field messages.
  onSave: { type: Function, required: true },
});
const emit = defineEmits(['cancel']);

const ROLES = ['admin', 'member', 'viewer'];

const form = reactive({ name: '', email: '', role: 'member' });
const fieldErrors = ref({});
const formError = ref('');
const saving = ref(false);

const isEdit = computed(() => Boolean(props.editing));

// Re-fill the form whenever the row being edited changes (or editing is cancelled).
watch(
  () => props.editing,
  (user) => {
    form.name = user?.name ?? '';
    form.email = user?.email ?? '';
    form.role = user?.role ?? 'member';
    fieldErrors.value = {};
    formError.value = '';
  },
  { immediate: true },
);

async function onSubmit() {
  saving.value = true;
  fieldErrors.value = {};
  formError.value = '';
  try {
    await props.onSave({ ...form });
    if (!isEdit.value) {
      form.name = '';
      form.email = '';
      form.role = 'member';
    }
  } catch (err) {
    if (err?.details && Object.keys(err.details).length) fieldErrors.value = err.details;
    else formError.value = err?.message || 'Something went wrong';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="card form" @submit.prevent="onSubmit">
    <h2>{{ isEdit ? 'Edit user' : 'Add a user' }}</h2>

    <label>
      <span>Name</span>
      <input v-model="form.name" type="text" placeholder="Ada Lovelace" autocomplete="off" />
      <small v-if="fieldErrors.name" class="err">{{ fieldErrors.name }}</small>
    </label>

    <label>
      <span>Email</span>
      <input v-model="form.email" type="text" placeholder="ada@example.com" autocomplete="off" />
      <small v-if="fieldErrors.email" class="err">{{ fieldErrors.email }}</small>
    </label>

    <label>
      <span>Role</span>
      <select v-model="form.role">
        <option v-for="role in ROLES" :key="role" :value="role">{{ role }}</option>
      </select>
      <small v-if="fieldErrors.role" class="err">{{ fieldErrors.role }}</small>
    </label>

    <p v-if="formError" class="banner">{{ formError }}</p>

    <div class="actions">
      <button type="submit" class="primary" :disabled="saving">
        {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add user' }}
      </button>
      <button v-if="isEdit" type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<style scoped>
.form { display: grid; gap: 1rem; align-content: start; }
h2 { margin: 0; font-size: 1rem; letter-spacing: -0.01em; }
label { display: grid; gap: 0.35rem; }
label > span { font-size: 0.8rem; color: var(--muted); }
.actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.banner {
  margin: 0;
  font-size: 0.85rem;
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
}
.err { color: var(--danger); font-size: 0.78rem; }
</style>
