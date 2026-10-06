import {render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe,expect,it} from 'vitest'
import LandingPage from '../pages/LandingPage'

describe('LandingPage',()=>{
  it('shows RADR branding, auth entry points, and the remote-work hero image',()=>{
    render(<MemoryRouter><LandingPage/></MemoryRouter>)
    expect(screen.getByRole('heading',{name:/Find the work worth your attention/i})).toBeInTheDocument()
    expect(screen.getAllByRole('link',{name:/Create account/i})[0]).toHaveAttribute('href','/auth?mode=signup')
    expect(screen.getByRole('link',{name:/Sign in/i})).toHaveAttribute('href','/auth?mode=login&prompt=1')
    expect(screen.getByRole('img',{name:/Black woman wearing headphones/i})).toBeInTheDocument()
  })
})
