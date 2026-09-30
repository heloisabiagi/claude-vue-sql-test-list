import { mount, flushPromises } from '@vue/test-utils';
import App from '../App.vue';
import { api } from '../api.js';

jest.mock('../api.js', () => ({
  api: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

const USERS = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin', country: 'GB', createdAt: '2026-09-24 19:02:20' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'member', country: 'GB', createdAt: '2026-09-24 19:02:20' },
];

// jsdom has <dialog> but not its methods; mimic what browsers do.
const proto = window.HTMLDialogElement.prototype;
const original = { showModal: proto.showModal, close: proto.close };

beforeAll(() => {
  proto.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  proto.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

afterAll(() => Object.assign(proto, original));

beforeEach(() => {
  jest.clearAllMocks();
  api.list.mockResolvedValue({ data: USERS, meta: { total: USERS.length } });
});

/** An update call that stays pending until the test settles it. */
function pendingUpdate() {
  let resolve;
  api.update.mockReturnValueOnce(new Promise((r) => (resolve = r)));
  return () => resolve({ data: USERS[0] });
}

async function mountApp() {
  const wrapper = mount(App, { attachTo: document.body });
  await flushPromises();
  return wrapper;
}

const modalOpen = (wrapper) => wrapper.find('dialog').attributes('open') !== undefined;
const nameInput = (wrapper) => wrapper.find('dialog input');
const openEditFor = (wrapper, index) =>
  wrapper.findAll('tbody .name button')[index].trigger('click');

describe('App: user modal', () => {
  it('closes the modal once its save succeeds', async () => {
    const wrapper = await mountApp();
    const finishSave = pendingUpdate();

    await openEditFor(wrapper, 0);
    await wrapper.find('dialog form').trigger('submit');
    finishSave();
    await flushPromises();

    expect(api.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Ada Lovelace' }));
    expect(modalOpen(wrapper)).toBe(false);
    wrapper.unmount();
  });

  it('keeps a newer modal open when an earlier save finishes late', async () => {
    const wrapper = await mountApp();
    const finishSave = pendingUpdate();

    // Save Ada, then cancel while that save is still pending.
    await openEditFor(wrapper, 0);
    await wrapper.find('dialog form').trigger('submit');
    await wrapper.find('dialog button[type="button"]').trigger('click');
    expect(modalOpen(wrapper)).toBe(false);

    // Start editing Alan before Ada's save comes back.
    await openEditFor(wrapper, 1);
    await nameInput(wrapper).setValue('Alan M. Turing');

    finishSave();
    await flushPromises();

    expect(modalOpen(wrapper)).toBe(true);
    expect(nameInput(wrapper).element.value).toBe('Alan M. Turing');
    wrapper.unmount();
  });
});
