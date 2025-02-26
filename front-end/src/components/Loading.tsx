import React, { memo } from 'react'
import { Spinner } from "@material-tailwind/react"

interface Iprops {
    children?: React.ReactNode
}
const Loading: React.FC<Iprops> = () => {
  return (
    <div className='flex flex-col justify-center items-center	'>
      <Spinner className="h-24 w-24" color="warning"/>
      
    </div>
  )
}

export default memo(Loading)