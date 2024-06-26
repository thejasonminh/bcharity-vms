import SEO from '@components/utils/SEO'
import { ChainId } from '@thirdweb-dev/react' // TODO
import { NextPage } from 'next'
import Router from 'next/router'
import { useEffect, useState } from 'react'

import isVerified from '@/lib/isVerified'
import { useAppPersistStore } from '@/store/app'

import UserDashboard from './UserDashboard'
const activeChainId = ChainId.Mainnet

/**
 * Component that displays the user settings page
 */
const UserSettingsDashboard: NextPage = () => {
  const { isAuthenticated, currentUser } = useAppPersistStore()
  const [loading, setLoading] = useState<boolean>(true)

  const [isOrganization, setIsOrganization] = useState<boolean>(false)

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setLoading(false)
      setIsOrganization(isVerified(currentUser.id))
    } else {
      Router.push('/')
    }
  }, [currentUser, isAuthenticated])

  return (
    <>
      <SEO title="Settings • BCharity VMS" />
      <UserDashboard />
    </>
  )
}

export default UserSettingsDashboard
