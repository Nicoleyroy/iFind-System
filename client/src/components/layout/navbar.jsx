import { useState, useEffect } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { NavLink } from 'react-router-dom'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
const navigation = [
  { name: 'Home', href: '/lost', current: false },
  { name: 'Report Items', href: '/report', current: false },
  { name: 'Your Posts', href: '/your-posts', current: false },
  { name: 'Contact Us', href: '#', current: false },

]
const userNavigation = [
  { name: 'Your profile', href: '#' },
  { name: 'Settings', href: '/settings' },
  { name: 'Sign out', href: '/login' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Navbar() {
  const [user, setUser] = useState({
    name: 'User',
    email: 'user@example.com',
    profilePicture: null,
  })

  useEffect(() => {
    // Load user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser({
          name: userData.name || 'User',
          email: userData.email || 'user@example.com',
          profilePicture: userData.profilePicture || null,
        });
      } catch (e) {
        console.warn('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  // Listen for storage changes to update profile picture when it's updated in Settings
  useEffect(() => {
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser({
            name: userData.name || 'User',
            email: userData.email || 'user@example.com',
            profilePicture: userData.profilePicture || null,
          });
        } catch (e) {
          console.warn('Failed to parse user from localStorage', e);
        }
      }
    };

    // Listen for custom event that can be dispatched when user updates profile
    window.addEventListener('userUpdated', handleUserUpdate);
    // Also listen for storage events (for cross-tab updates)
    window.addEventListener('storage', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-full">
        <Disclosure as="nav" className="bg-rose-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="size-8 bg-[#8B0000] rounded flex items-center justify-center text-white font-bold">
                    iF
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        end
                        className={({ isActive }) =>
                          classNames(
                            isActive
                              ? 'text-white'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white',
                            'px-3 py-2 text-sm font-medium',
                          )
                        }
                      >
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button
                    type="button"
                    className="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <MenuButton className="relative flex max-w-xs items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      {user.profilePicture ? (
                        <img
                          alt={user.name}
                          src={user.profilePicture}
                          className="size-8 rounded-full outline -outline-offset-1 outline-white/10 object-cover"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-[#8B0000] flex items-center justify-center text-white text-xs font-semibold outline -outline-offset-1 outline-white/10">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </MenuButton>

                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      {userNavigation.map((item) => (
                        <MenuItem key={item.name}>
                          {item.name === 'Sign out' ? (
                            <a
                              href={item.href}
                              onClick={(e) => {
                                e.preventDefault();
                                localStorage.removeItem('user');
                                window.location.href = item.href;
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                            >
                              {item.name}
                            </a>
                          ) : (
                            <NavLink
                              to={item.href}
                              className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                            >
                              {item.name}
                            </NavLink>
                          )}
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as={NavLink}
                  to={item.href}
                  end
                  className={({ isActive }) =>
                    classNames(
                      isActive ? 'text-white bg-white/5 border-l-4 border-[#C0152F] pl-2' : 'text-gray-300 hover:bg-white/5 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium',
                    )
                  }
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="shrink-0">
                  {user.profilePicture ? (
                    <img
                      alt={user.name}
                      src={user.profilePicture}
                      className="size-10 rounded-full outline -outline-offset-1 outline-white/10 object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-[#8B0000] flex items-center justify-center text-white text-sm font-semibold outline -outline-offset-1 outline-white/10">
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base/5 font-medium text-white">{user.name}</div>
                  <div className="text-sm font-medium text-gray-400">{user.email}</div>
                </div>
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as={item.name === 'Sign out' ? 'button' : NavLink}
                    to={item.name !== 'Sign out' ? item.href : undefined}
                    href={item.name === 'Sign out' ? item.href : undefined}
                    onClick={item.name === 'Sign out' ? (e) => {
                      e.preventDefault();
                      localStorage.removeItem('user');
                      window.location.href = item.href;
                    } : undefined}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white w-full text-left"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>
        <main>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{/* Your content */}</div>
        </main>
      </div>
  );
}

export default Navbar;

