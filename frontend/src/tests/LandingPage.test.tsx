import {render,screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe,expect,it} from 'vitest'
import LandingPage from '../pages/LandingPage'

describe('LandingPage',()=>{
  it('shows RADR branding and auth entry points',()=>{
    render(<MemoryRouter><LandingPage/></MemoryRouter>)
    expect(screen.getByRole('heading',{name:/Find the work worth your attention/i})).toBeInTheDocument()
    expect(screen.getByRole('link',{name:/Create account/i})).toHaveAttribute('href','/auth?mode=signup')
    expect(screen.getByRole('link',{name:/Sign in/i})).toHaveAttribute('href','/auth?mode=login&prompt=1')
  })
  it('lets visitors inspect sample match reasons',async()=>{
    const user=userEvent.setup()
    render(<MemoryRouter><LandingPage/></MemoryRouter>)
    await user.click(screen.getByRole('button',{name:/Community Manager/i}))
    expect(screen.getByText(/community management · content · events/i)).toBeInTheDocument()
  })
})
