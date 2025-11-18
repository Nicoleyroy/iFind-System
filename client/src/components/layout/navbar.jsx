import { useState, useEffect } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../../utils/constants'
const navigation = [
  { name: 'Home', href: '/lost', current: false },
  { name: 'Report Items', href: '/report', current: false },
  { name: 'Contact Us', href: '/contact', current: false },

]
const userNavigation = [
  { name: 'Your profile', href: '/profile' },
  { name: 'Settings', href: '/settings' },
  { name: 'Sign out', href: '/login' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: 'User',
    email: 'user@example.com',
    profilePicture: null,
    id: null,
  })
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
          id: userData._id || userData.id || null,
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
            id: userData._id || userData.id || null,
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

  useEffect(() => {
    // Load notifications
    const loadNotifications = async () => {
      if (!user.id) return;
      
      try {
        const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?userId=${user.id}`);
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setNotifications(json.data);
        }
      } catch (e) {
        console.warn('Failed to load notifications', e);
      }
    };

    // Load unread count
    const loadUnreadCount = async () => {
      if (!user.id) return;
      
      try {
        const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}?userId=${user.id}`);
        const json = await res.json();
        if (json.data && typeof json.data.count === 'number') {
          setUnreadCount(json.data.count);
        }
      } catch (e) {
        console.warn('Failed to load unread count', e);
      }
    };

    if (user.id) {
      loadNotifications();
      loadUnreadCount();
      
      // Refresh notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user.id]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await fetch(API_ENDPOINTS.NOTIFICATION_READ(notification._id), {
          method: 'PUT',
        });
        // Reload notifications
        const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?userId=${user.id}`);
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setNotifications(json.data);
        }
        // Reload unread count
        const countRes = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}?userId=${user.id}`);
        const countJson = await countRes.json();
        if (countJson.data && typeof countJson.data.count === 'number') {
          setUnreadCount(countJson.data.count);
        }
      } catch (e) {
        console.warn('Failed to mark notification as read', e);
      }
    }
    
    // Navigate to related item if available
    if (notification.relatedItemId) {
      navigate('/found');
      setNotificationsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user.id) return;
    
    try {
      await fetch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      // Reload notifications
      const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?userId=${user.id}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setNotifications(json.data);
      }
      // Reload unread count
      const countRes = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}?userId=${user.id}`);
      const countJson = await countRes.json();
      if (countJson.data && typeof countJson.data.count === 'number') {
        setUnreadCount(countJson.data.count);
      }
    } catch (e) {
      console.warn('Failed to mark all notifications as read', e);
    }
  };

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
        <Disclosure as="nav" className="bg-white shadow-md border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="h-10 w-10  flex items-center justify-center">
                    <img src="/IFIND-LOGO.png" alt="iFind Logo" className="h-10 w-10 " />
                    <span className="gap-y-2 font-bold text-lg">iFind</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-2">
                    {navigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        end
                        className={({ isActive }) =>
                          classNames(
                            isActive
                              ? 'bg-orange-50 text-orange-600 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
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
                <div className="ml-4 flex items-center md:ml-6 gap-4">
                  <Popover className="relative">
                    <PopoverButton
                      type="button"
                      className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none transition-all duration-200"
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon aria-hidden="true" className="h-6 w-6" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 items-center justify-center text-xs font-semibold text-white shadow-lg">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </span>
                      )}
                    </PopoverButton>
                    <PopoverPanel className="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                          <h3 className="text-base font-bold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="text-center py-8">
                              <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
                              <p className="text-sm text-gray-500 mt-2">No notifications yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {notifications.map((notification) => (
                                <div
                                  key={notification._id}
                                  onClick={() => handleNotificationClick(notification)}
                                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                    notification.read
                                      ? 'bg-gray-50 hover:bg-gray-100'
                                      : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                    {!notification.read && (
                                      <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverPanel>
                  </Popover>

                  {/* Profile dropdown with name */}
                  <Menu as="div" className="relative">
                    <MenuButton className="flex items-center gap-3 rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      {user.profilePicture ? (
                        <img
                          alt={user.name}
                          src={user.profilePicture}
                          className="h-8 w-8 rounded-full ring-2 ring-gray-300 object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-300">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </MenuButton>

                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in overflow-hidden"
                    >
                      {userNavigation.map((item, index) => (
                        <MenuItem key={item.name}>
                          {item.name === 'Sign out' ? (
                            <a
                              href={item.href}
                              onClick={(e) => {
                                e.preventDefault();
                                localStorage.removeItem('user');
                                window.location.href = item.href;
                              }}
                              className={`block px-4 py-3 text-sm font-medium text-gray-700 data-focus:bg-gradient-to-r data-focus:from-orange-50 data-focus:to-orange-100 data-focus:text-orange-600 transition-all ${
                                index === 0 ? 'border-b border-gray-100' : ''
                              } ${index === userNavigation.length - 1 ? 'border-t border-gray-100' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {item.name}
                              </div>
                            </a>
                          ) : (
                            <NavLink
                              to={item.href}
                              className={`block px-4 py-3 text-sm font-medium text-gray-700 data-focus:bg-gradient-to-r data-focus:from-orange-50 data-focus:to-orange-100 data-focus:text-orange-600 transition-all ${
                                index !== userNavigation.length - 1 ? 'border-b border-gray-100' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {item.name === 'Your profile' && (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                )}
                                {item.name === 'Settings' && (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                )}
                                {item.name}
                              </div>
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
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-2 focus:outline-offset-2 focus:outline-orange-500">
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
                      isActive ? 'text-orange-600 bg-orange-50 border-l-4 border-orange-600 pl-2' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                      'block rounded-md px-3 py-2 text-base font-medium',
                    )
                  }
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 pb-3 bg-gray-50">
              <div className="flex items-center px-5">
                <div className="shrink-0">
                  {user.profilePicture ? (
                    <img
                      alt={user.name}
                      src={user.profilePicture}
                      className="size-10 rounded-full outline -outline-offset-1 outline-gray-300 object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-sm font-semibold outline -outline-offset-1 outline-gray-300">
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base/5 font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm font-medium text-gray-600">{user.email}</div>
                </div>
                <Popover className="relative">
                  <PopoverButton
                    type="button"
                    className="relative ml-auto shrink-0 rounded-full p-1 text-gray-700 hover:text-gray-900 focus:outline-2 focus:outline-offset-2 focus:outline-orange-500"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-rose-950" />
                    )}
                  </PopoverButton>
                  <PopoverPanel className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((notification) => (
                              <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  notification.read
                                    ? 'bg-gray-50 hover:bg-gray-100'
                                    : 'bg-blue-50 hover:bg-blue-100'
                                }`}
                              >
                                <div className="flex items-start">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverPanel>
                </Popover>
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
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
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

