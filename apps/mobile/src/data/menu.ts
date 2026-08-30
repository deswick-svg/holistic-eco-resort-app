export type MenuItem = {
  key: string;
  label: string;
  icon: string;
  section: 'primary' | 'explore' | 'account';
};

export const menuItems: MenuItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', section: 'primary' },
  { key: 'booking', label: 'Booking', icon: 'calendar-outline', section: 'primary' },
  { key: 'dining', label: 'Dining', icon: 'restaurant-outline', section: 'primary' },
  { key: 'activities', label: 'Activities', icon: 'bicycle-outline', section: 'primary' },
  { key: 'spa', label: 'Ayurvedic Spa', icon: 'leaf-outline', section: 'primary' },
  { key: 'map', label: 'Property Map', icon: 'map-outline', section: 'explore' },
  { key: 'attractions', label: 'Local Attractions', icon: 'location-outline', section: 'explore' },
  { key: 'reviews', label: 'Review Us', icon: 'chatbubbles-outline', section: 'explore' },
  { key: 'coupon', label: 'Discount Coupon', icon: 'pricetag-outline', section: 'explore' },
  { key: 'gallery', label: 'Gallery', icon: 'images-outline', section: 'explore' },
  { key: 'contact', label: 'Contact Us', icon: 'call-outline', section: 'explore' },
  { key: 'history', label: 'History of Checked-in Details', icon: 'time-outline', section: 'account' },
  { key: 'tripadvisor', label: 'Submit TripAdvisor Review', icon: 'star-outline', section: 'account' },
  { key: 'google-review', label: 'Submit Google Review', icon: 'logo-google', section: 'account' },
  { key: 'delete-account', label: 'Delete Account', icon: 'trash-outline', section: 'account' },
];
