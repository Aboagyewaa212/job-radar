import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LandingPage from '../pages/LandingPage'

describe('LandingPage',()=>{
  it('shows the public value proposition and auth entry points',()=>{
    render(<MemoryRouter><LandingPage/></MemoryRouter>)
    expect(screen.getByRole('heading',{name:/Find work that fits your evidence/i})).toBeInTheDocument()
    expect(screen.getByRole('link',{name:/Create account/i})).toHaveAttribute('href','/auth?mode=signup')
    expect(screen.getByRole('link',{name:/Sign in/i})).toHaveAttribute('href','/auth?mode=login')
  })
})
