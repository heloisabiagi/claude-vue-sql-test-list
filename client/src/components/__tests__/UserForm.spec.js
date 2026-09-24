import { mount, flushPromises } from '@vue/test-utils';
import UserForm from '../UserForm.vue';

const ADA = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'admin',
  createdAt: '2026-09-24 19:02:20',
  updatedAt: '2026-09-24 19:02:20',
};

/** Mounts the form with a resolving onSave unless a different one is supplied. */
function build({ editing = null, onSave = jest.fn().mockResolvedValue({}) } = {}) {
  const wrapper = mount(UserForm, { props: { editing, onSave } });
  return { wrapper, onSave };
}

const fields = (wrapper) => ({
  name: wrapper.findAll('input')[0],
  email: wrapper.findAll('input')[1],
  role: wrapper.find('select'),
});

async function fillIn(wrapper, { name, email, role }) {
  const f = fields(wrapper);
  if (name !== undefined) await f.name.setValue(name);
  if (email !== undefined) await f.email.setValue(email);
  if (role !== undefined) await f.role.setValue(role);
}

describe('UserForm', () => {
  describe('create mode', () => {
    it('shows the add heading and no cancel button', () => {
      const { wrapper } = build();

      expect(wrapper.find('h2').text()).toBe('Add a user');
      expect(wrapper.findAll('button')).toHaveLength(1);
      expect(wrapper.find('button[type="submit"]').text()).toBe('Add user');
    });

    it('starts blank with role defaulted to member', () => {
      const { wrapper } = build();
      const f = fields(wrapper);

      expect(f.name.element.value).toBe('');
      expect(f.email.element.value).toBe('');
      expect(f.role.element.value).toBe('member');
    });

    it('offers exactly the three supported roles', () => {
      const { wrapper } = build();

      expect(wrapper.findAll('option').map((o) => o.element.value)).toEqual([
        'admin',
        'member',
        'viewer',
      ]);
    });

    it('passes the entered values to onSave', async () => {
      const { wrapper, onSave } = build();
      await fillIn(wrapper, {
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'viewer',
      });

      await wrapper.find('form').trigger('submit');

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'viewer',
      });
    });

    it('clears the form after a successful save', async () => {
      const { wrapper } = build();
      await fillIn(wrapper, { name: 'Grace', email: 'grace@example.com', role: 'admin' });

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      const f = fields(wrapper);
      expect(f.name.element.value).toBe('');
      expect(f.email.element.value).toBe('');
      expect(f.role.element.value).toBe('member');
    });

    it('keeps the entered values when the save fails', async () => {
      const onSave = jest.fn().mockRejectedValue(new Error('nope'));
      const { wrapper } = build({ onSave });
      await fillIn(wrapper, { name: 'Grace', email: 'grace@example.com' });

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(fields(wrapper).name.element.value).toBe('Grace');
    });
  });

  describe('edit mode', () => {
    it('shows the edit heading and a cancel button', () => {
      const { wrapper } = build({ editing: ADA });

      expect(wrapper.find('h2').text()).toBe('Edit user');
      expect(wrapper.find('button[type="submit"]').text()).toBe('Save changes');
      expect(wrapper.findAll('button')).toHaveLength(2);
    });

    it('prefills the fields from the user being edited', () => {
      const { wrapper } = build({ editing: ADA });
      const f = fields(wrapper);

      expect(f.name.element.value).toBe('Ada Lovelace');
      expect(f.email.element.value).toBe('ada@example.com');
      expect(f.role.element.value).toBe('admin');
    });

    it('emits cancel when the cancel button is clicked', async () => {
      const { wrapper } = build({ editing: ADA });

      await wrapper.find('button[type="button"]').trigger('click');

      expect(wrapper.emitted('cancel')).toHaveLength(1);
    });

    it('does not clear the form after saving an edit', async () => {
      const { wrapper } = build({ editing: ADA });

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(fields(wrapper).name.element.value).toBe('Ada Lovelace');
    });

    it('refills the form when a different user is selected', async () => {
      const { wrapper } = build({ editing: ADA });

      await wrapper.setProps({
        editing: { ...ADA, id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'member' },
      });

      const f = fields(wrapper);
      expect(f.name.element.value).toBe('Alan Turing');
      expect(f.email.element.value).toBe('alan@example.com');
      expect(f.role.element.value).toBe('member');
    });

    it('resets to a blank form when editing is cleared', async () => {
      const { wrapper } = build({ editing: ADA });

      await wrapper.setProps({ editing: null });

      expect(fields(wrapper).name.element.value).toBe('');
      expect(wrapper.find('h2').text()).toBe('Add a user');
    });
  });

  describe('error handling', () => {
    it('shows per-field messages from a validation failure', async () => {
      const err = Object.assign(new Error('Validation failed'), {
        details: { name: 'Name is required', email: 'Email must be a valid address' },
      });
      const { wrapper } = build({ onSave: jest.fn().mockRejectedValue(err) });

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      const messages = wrapper.findAll('small.err').map((n) => n.text());
      expect(messages).toContain('Name is required');
      expect(messages).toContain('Email must be a valid address');
      expect(wrapper.find('p.banner').exists()).toBe(false);
    });

    it('shows a banner for errors without field details', async () => {
      const err = Object.assign(new Error('A user with that email already exists'), {
        details: {},
      });
      const { wrapper } = build({ onSave: jest.fn().mockRejectedValue(err) });

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.find('p.banner').text()).toBe('A user with that email already exists');
      expect(wrapper.findAll('small.err')).toHaveLength(0);
    });

    it('falls back to a generic message when the error has none', async () => {
      const { wrapper } = build({ onSave: jest.fn().mockRejectedValue({}) });

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.find('p.banner').text()).toBe('Something went wrong');
    });

    it('clears previous errors when resubmitting', async () => {
      const onSave = jest
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error('boom'), { details: {} }))
        .mockResolvedValueOnce({});
      const { wrapper } = build({ onSave });

      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(wrapper.find('p.banner').exists()).toBe(true);

      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(wrapper.find('p.banner').exists()).toBe(false);
    });

    it('clears errors when the edit target changes', async () => {
      const err = Object.assign(new Error('boom'), { details: {} });
      const { wrapper } = build({ editing: ADA, onSave: jest.fn().mockRejectedValue(err) });

      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(wrapper.find('p.banner').exists()).toBe(true);

      await wrapper.setProps({ editing: { ...ADA, id: 2, name: 'Alan' } });

      expect(wrapper.find('p.banner').exists()).toBe(false);
    });
  });

  describe('while saving', () => {
    it('disables the button and shows progress until the save settles', async () => {
      let release;
      const onSave = jest.fn(() => new Promise((resolve) => (release = resolve)));
      const { wrapper } = build({ onSave });
      const button = wrapper.find('button[type="submit"]');

      await wrapper.find('form').trigger('submit');

      expect(button.text()).toBe('Saving…');
      expect(button.element.disabled).toBe(true);

      release();
      await flushPromises();

      expect(button.text()).toBe('Add user');
      expect(button.element.disabled).toBe(false);
    });

    it('re-enables the button after a failed save', async () => {
      const { wrapper } = build({ onSave: jest.fn().mockRejectedValue(new Error('boom')) });

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.find('button[type="submit"]').element.disabled).toBe(false);
    });
  });
});
