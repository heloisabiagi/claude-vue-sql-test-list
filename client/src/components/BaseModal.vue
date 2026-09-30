<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  // Accessible name announced when the dialog opens.
  label: { type: String, required: true },
});
const emit = defineEmits(['close']);

const dialog = ref(null);

// The parent owns `open`; this keeps the native <dialog> in step with it.
// Runs after render so showModal() can focus the first field in the slot.
function sync(open) {
  const el = dialog.value;
  if (!el) return;
  if (open && !el.open) el.showModal();
  else if (!open && el.open) el.close();
}
watch(() => props.open, sync, { flush: 'post' });
onMounted(() => sync(props.open));

// Esc fires `cancel`: leave closing to the parent so its state stays the source of truth.
function onCancel(event) {
  event.preventDefault();
  emit('close');
}

// Browsers may still close the dialog themselves (e.g. a repeated Esc); report it.
function onClose() {
  if (props.open) emit('close');
}
</script>

<template>
  <dialog ref="dialog" class="modal" :aria-label="label" @cancel="onCancel" @close="onClose">
    <!-- Mounted only while open, so the content starts fresh each time. -->
    <slot v-if="open" />
  </dialog>
</template>

<style scoped>
.modal {
  width: min(28rem, calc(100% - 2rem));
  max-width: none;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 1.25rem;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 20px 45px rgba(16, 24, 40, 0.2);
}
.modal::backdrop { background: rgba(10, 10, 14, 0.45); }

/* Phones: a bottom sheet that uses the full width and stays clear of the home bar. */
@media (max-width: 560px) {
  .modal {
    width: 100%;
    max-height: 90dvh;
    margin: auto 0 0;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
  }
}
</style>
