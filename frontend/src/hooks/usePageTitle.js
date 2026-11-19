import { useEffect } from 'react'
import { APP_NAME } from '../utils/constants.js'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME
  }, [title])
}