import { ExternalLinkIcon } from '@heroicons/react/outline'
import { MediaRenderer } from '@thirdweb-dev/react'
import { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { lensClient, usePublication } from '@/lib/lens-protocol'
import {
  InvalidMetadataException,
  isPost,
  OpportunityMetadata,
  OpportunityMetadataBuilder
} from '@/lib/metadata'
import { PostTags } from '@/lib/metadata'
import { useAppPersistStore } from '@/store/app'

import { GridItemTwelve, GridLayout } from '../GridLayout'
import ApplyButton from '../Shared/ApplyButton'
import BookmarkButton from '../Shared/BookmarkButton'
import FollowButton from '../Shared/FollowButton'
import LogHoursButton from '../Shared/LogHoursButton'
import ErrorBody from '../Shared/PublicationPage/ErrorBody'
import Slug from '../Shared/Slug'
import { Button } from '../UI/Button'
import { Card } from '../UI/Card'
import { Spinner } from '../UI/Spinner'
import SEO from '../utils/SEO'
import ApplyToOpportunityModal from './ApplyToOpportunityModal'

const VolunteerPage: NextPage = () => {
  const { t } = useTranslation('common', {
    keyPrefix: 'components.volunteers.page'
  })
  const { t: e } = useTranslation('common', { keyPrefix: 'errors' })
  const {
    query: { id }
  } = useRouter()

  const { currentUser } = useAppPersistStore()

  const { data, loading, error } = usePublication({
    publicationId: Array.isArray(id) ? '' : id
  })

  const [wrongPostType, setWrongPostType] = useState(false)
  const [malformedMetadata, setMalformedMetadata] = useState(false)

  const opportunity = useMemo(() => {
    if (!data) return
    if (!isPost(data)) {
      setWrongPostType(true)
      return
    }

    try {
      return new OpportunityMetadataBuilder(data).build()
    } catch (e) {
      if (e instanceof InvalidMetadataException) {
        setMalformedMetadata(true)
      }
    }
  }, [data])

  const getDateString = (o: OpportunityMetadata) => {
    const ongoing = !o.endDate

    if (!ongoing) {
      return `${o.startDate} to ${o.endDate}`
    } else {
      return `${o.startDate} - ${t('ongoing')}`
    }
  }

  const getErrorMessage = () => {
    if (!!error || !data) {
      return error
    }
    if (wrongPostType) {
      return e('incorrect-publication-type')
    } else if (malformedMetadata) {
      return e('metadata-malformed')
    }

    return e('generic')
  }

  useEffect(() => {
    const fetch = async () => {
      if (opportunity?.post_id && currentUser?.id) {
        try {
          const result = await lensClient().publication.fetchAll({
            commentsOf: opportunity.post_id,
            metadata: {
              tags: {
                oneOf: [PostTags.Application.Apply]
              }
            }
          })
          result.items.forEach((item) => {
            if (item.__typename !== 'Comment')
              throw Error('Unexpected post type')

            // Found application
            if (item.profile.id === currentUser.id) {
              // check if user application was accepted/rejected here
            }
          })
        } catch (error) {
          if (error instanceof Error) {
            // maybe toast error here
            console.log(error)
          }
        }
      }
    }

    if (opportunity?.applicationRequired) fetch()
  })

  const [applied, setApplied] = useState<boolean>(false) // this one is possibly handled inside of ApplyButton
  const [accepted, setAccepted] = useState<boolean>(false) // this one is required to be implemented in this component

  const Body = ({ opportunity }: { opportunity: OpportunityMetadata }) => {
    return (
      <>
        {' '}
        <ApplyToOpportunityModal></ApplyToOpportunityModal>
        <div className="p-6">
          <div className="grid md:grid-cols-[auto_100px] sm:grid-cols-[auto_100px] gap-x-4 w-full">
            <div className="flex space-x-2 items-center overflow-hidden">
              <div className="col-span-1">
                <BookmarkButton
                  publicationId={opportunity.post_id}
                  postTag={PostTags.Bookmark.Opportunity}
                />
              </div>
              <div className="text-2xl font-bold text-brand-600 truncate text-ellipsis">
                {opportunity.name}
              </div>
              <div className="text-xl text-gray-400 font-bold truncate text-ellipsis">
                {opportunity.category}
              </div>
            </div>
            <div className="font-semibold" suppressHydrationWarning>
              {t('valid-from')} {getDateString(opportunity)}
            </div>
          </div>
          <div className="flex space-x-3 items-center">
            <Slug prefix="@" slug={opportunity.from.handle} />
            <FollowButton followId={opportunity.from.id} />
          </div>
          <div className="pt-6 pb-4">{opportunity.description}</div>
          {opportunity.imageUrl && (
            <div>
              <MediaRenderer
                key="attachment"
                className="object-cover h-50 rounded-lg border-[3px] border-black margin mb-[20px]"
                src={opportunity.imageUrl}
                alt={'image attachment'}
              />
            </div>
          )}
          <div className="flex justify-end space-x-3">
            {opportunity.website !== '' && (
              <Link href={opportunity.website} target="_blank" className="flex">
                <div className="flex items-center text-brand-600">
                  <div
                    className="mr-1 whitespace-nowrap"
                    suppressHydrationWarning
                  >
                    {t('external-url')}
                  </div>
                  <ExternalLinkIcon className="w-4 h-4 inline-flex mb-1" />
                </div>
              </Link>
            )}
            {opportunity.applicationRequired && !accepted ? (
              applied ? (
                // possibly move this logic into ApplyButton
                <Button>Applied already here</Button>
              ) : (
                <ApplyButton
                  publicationId={opportunity.post_id}
                  organizationId={opportunity.from.id}
                />
              )
            ) : (
              <LogHoursButton
                hoursDefault={opportunity.hoursPerWeek}
                publicationId={opportunity.post_id}
                organizationId={opportunity.from.id}
              />
            )}
          </div>
        </div>
      </>
    )
  }

  const getDisplayed = () => {
    if (loading) {
      return (
        <center className="p-20">
          <Spinner />
        </center>
      )
    } else if (
      !data ||
      wrongPostType ||
      // malformedMetadata ||
      !opportunity ||
      !isPost(data)
    ) {
      return <ErrorBody message={getErrorMessage()} />
    } else {
      return <Body opportunity={opportunity} />
    }
  }

  return (
    <>
      <SEO title="Volunteer Opportunity • BCharity VMS" />
      <GridLayout>
        <GridItemTwelve>
          <Card>{getDisplayed()}</Card>
        </GridItemTwelve>
      </GridLayout>
    </>
  )
}

export default VolunteerPage
