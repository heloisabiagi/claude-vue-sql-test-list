import { mount } from '@vue/test-utils';
import UserTable from '../UserTable.vue';

const USERS = [
  {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'admin',
    createdAt: '2026-09-24 19:02:20',
    updatedAt: '2026-09-24 19:02:20',
  },
  {
    id: 2,
    name: 'Alan Turing',
    email: 'alan@example.com',
    role: 'member',
    createdAt: '2026-01-05 08:30:00',
    updatedAt: '2026-01-05 08:30:00',
  },
];

const build = (props = {}) => mount(UserTable, { props: { users: USERS, ...props } });

const rows = (wrapper) => wrapper.findAll('tbody tr');
const cells = (row) => row.findAll('td').map((td) => td.text());

describe('UserTable', () => {
  describe('rendering', () => {
    it('renders one row per user', () => {
      expect(rows(build())).toHaveLength(2);
    });

    it('renders the column headers', () => {
      const headers = build().findAll('th').map((th) => th.text());
      expect(headers).toEqual(['Name', 'Email', 'Role', 'Added', '']);
    });

    it('shows each user name, email and role', () => {
      const [first] = rows(build());

      expect(first.find('.name').text()).toBe('Ada Lovelace');
      expect(first.find('.email').text()).toBe('ada@example.com');
      expect(first.find('.pill').text()).toBe('admin');
    });

    it('tags the role pill so it can be styled per role', () => {
      const pills = build().findAll('.pill');

      expect(pills[0].attributes('data-role')).toBe('admin');
      expect(pills[1].attributes('data-role')).toBe('member');
    });

    it('gives every row an edit and a delete button', () => {
      const [first] = rows(build());
      const buttons = first.findAll('.row-actions button');

      expect(buttons.map((b) => b.text())).toEqual(['Edit', 'Delete']);
    });
  });

  describe('date formatting', () => {
    it('renders the stored timestamp as a readable date', () => {
      const added = cells(rows(build())[0])[3];

      expect(added).not.toBe('2026-09-24 19:02:20');
      expect(added).toContain('2026');
      expect(added).toContain('24');
    });

    it('falls back to the raw value when the date cannot be parsed', () => {
      const wrapper = build({ users: [{ ...USERS[0], createdAt: 'not a date' }] });

      expect(cells(rows(wrapper)[0])[3]).toBe('not a date');
    });
  });

  describe('events', () => {
    it('emits edit with the clicked user', async () => {
      const wrapper = build();

      await rows(wrapper)[1].findAll('.row-actions button')[0].trigger('click');

      expect(wrapper.emitted('edit')).toHaveLength(1);
      expect(wrapper.emitted('edit')[0]).toEqual([USERS[1]]);
    });

    it('emits delete with the clicked user', async () => {
      const wrapper = build();

      await rows(wrapper)[0].findAll('.row-actions button')[1].trigger('click');

      expect(wrapper.emitted('delete')).toHaveLength(1);
      expect(wrapper.emitted('delete')[0]).toEqual([USERS[0]]);
    });

    it('does not emit anything on render', () => {
      const wrapper = build();

      expect(wrapper.emitted('edit')).toBeUndefined();
      expect(wrapper.emitted('delete')).toBeUndefined();
    });
  });

  describe('highlighting the edited row', () => {
    it('marks only the row matching editingId', () => {
      const [first, second] = rows(build({ editingId: 2 }));

      expect(first.classes()).not.toContain('active');
      expect(second.classes()).toContain('active');
    });

    it('marks nothing when editingId is null', () => {
      const marked = rows(build()).filter((r) => r.classes().includes('active'));

      expect(marked).toHaveLength(0);
    });
  });

  describe('loading and empty states', () => {
    it('shows the empty message when there are no users', () => {
      const wrapper = build({ users: [] });

      expect(wrapper.find('.empty').text()).toBe('No users to show.');
      expect(rows(wrapper)).toHaveLength(0);
    });

    it('hides the empty message while loading', () => {
      const wrapper = build({ users: [], loading: true });

      expect(wrapper.find('.empty').exists()).toBe(false);
    });

    it('hides the empty message when rows are present', () => {
      expect(build().find('.empty').exists()).toBe(false);
    });

    it('dims the table while loading', () => {
      expect(build({ loading: true }).find('.wrap').classes()).toContain('busy');
      expect(build({ loading: false }).find('.wrap').classes()).not.toContain('busy');
    });

    it('keeps showing the current rows while reloading', () => {
      expect(rows(build({ loading: true }))).toHaveLength(2);
    });
  });
});
