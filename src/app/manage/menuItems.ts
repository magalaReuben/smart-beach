import {
  Home,
  LineChart,
  ShoppingCart,
  Users2,
  Salad,
  Table,
  MapPin,
  UserCheck
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboard',
    Icon: Home,
    href: '/manage/dashboard'
  },
  {
    title: 'Orders',
    Icon: ShoppingCart,
    href: '/manage/orders'
  },
  {
    title: 'Serving places',
    Icon: MapPin,
    href: '/manage/serving-places'
  },
  {
    title: 'Waiters',
    Icon: UserCheck,
    href: '/manage/waiters'
  },
  {
    title: 'Tables',
    Icon: Table,
    href: '/manage/tables'
  },
  {
    title: 'Dishes',
    Icon: Salad,
    href: '/manage/dishes'
  },
  {
    title: 'Analytics',
    Icon: LineChart,
    href: '/manage/analytics'
  },
  {
    title: 'Staff',
    Icon: Users2,
    href: '/manage/accounts'
  }
]

export default menuItems
