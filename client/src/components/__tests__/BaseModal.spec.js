import { mount } from '@vue/test-utils';
import BaseModal from '../BaseModal.vue';

// jsdom has <dialog> but not its methods; mimic what browsers do.
const proto = window.HTMLDialogElement.prototype;
const original = { showModal: proto.showModal, close: proto.close };

beforeAll(() => {
  proto.showModal = jest.fn(function showModal() {
    this.setAttribute('open', '');
  });
  proto.close = jest.fn(function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

afterAll(() => Object.assign(proto, original));

beforeEach(() => jest.clearAllMocks());

function build(props = {}) {
  return mount(BaseModal, {
    props: { label: 'Edit user', ...props },
    slots: { default: '<input class="field" />' },
    attachTo: document.body,
  });
}

describe('BaseModal', () => {
  it('stays closed and renders no content until opened', () => {
    const wrapper = build();

    expect(wrapper.find('dialog').attributes('open')).toBeUndefined();
    expect(wrapper.find('.field').exists()).toBe(false);
    expect(proto.showModal).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('opens as a modal with its content when open is set', async () => {
    const wrapper = build();

    await wrapper.setProps({ open: true });

    expect(proto.showModal).toHaveBeenCalledTimes(1);
    expect(wrapper.find('dialog').attributes('open')).toBeDefined();
    expect(wrapper.find('.field').exists()).toBe(true);
    wrapper.unmount();
  });

  it('opens straight away when mounted open', () => {
    const wrapper = build({ open: true });

    expect(proto.showModal).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('closes and drops its content when open is cleared', async () => {
    const wrapper = build({ open: true });

    await wrapper.setProps({ open: false });

    expect(proto.close).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.field').exists()).toBe(false);
    // Closing because the parent asked is not reported back as a close request.
    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
  });

  it('uses the label as the dialog name', () => {
    const wrapper = build({ label: 'Add a user' });

    expect(wrapper.find('dialog').attributes('aria-label')).toBe('Add a user');
    wrapper.unmount();
  });

  it('asks the parent to close on Esc instead of closing itself', async () => {
    const wrapper = build({ open: true });
    const esc = new Event('cancel', { cancelable: true });

    wrapper.find('dialog').element.dispatchEvent(esc);

    expect(esc.defaultPrevented).toBe(true);
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });

  it('reports when the browser closes the dialog on its own', () => {
    const wrapper = build({ open: true });

    wrapper.find('dialog').element.dispatchEvent(new Event('close'));

    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });
});
