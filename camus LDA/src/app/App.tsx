import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { MobileFormsMode } from '@/components/layout/MobileFormsMode'

export default function App() {
  return (
    <>
      <MobileFormsMode />
      <RouterProvider router={router} />
    </>
  )
}
