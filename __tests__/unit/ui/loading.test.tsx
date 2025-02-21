import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Loading, TableLoading, FormLoading, ButtonLoading, InlineLoading } from "@/components/ui/loading"

describe("Loading Components", () => {
  describe("Base Loading Component", () => {
    it("renders with default props", () => {
      render(<Loading />)
      const status = screen.getByRole('status', { hidden: true })
      expect(status).toHaveTextContent('Loading...')
    })

    it("applies size classes correctly", () => {
      const { container } = render(<Loading size="sm" />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('w-4 h-4')
    })

    it("applies fullscreen variant correctly", () => {
      const { container } = render(<Loading variant="fullscreen" />)
      const wrapperElement = container.firstChild as HTMLElement
      expect(wrapperElement).toHaveClass("fixed", "inset-0", "bg-background/80")
    })

    it("applies custom className", () => {
      const { container } = render(<Loading className="test-class" />)
      const wrapperElement = container.firstChild as HTMLElement
      expect(wrapperElement).toHaveClass("test-class")
    })

    it("displays custom message", () => {
      render(<Loading message="Please wait..." />)
      expect(screen.getByRole('status', { hidden: true }))
        .toHaveTextContent('Please wait...')
    })

    it("handles inline variant", () => {
      const { container } = render(<Loading variant="inline" />)
      const wrapperElement = container.firstChild as HTMLElement
      expect(wrapperElement).toHaveClass("inline-flex")
    })

    it("respects alignment prop", () => {
      const { container } = render(<Loading align="start" />)
      const wrapperElement = container.firstChild as HTMLElement
      expect(wrapperElement).toHaveClass("items-start")
    })

    it("uses custom aria-label when provided", () => {
      const customLabel = "Custom loading state"
      render(<Loading aria-label={customLabel} />)
      const loadingElement = screen.getByLabelText(customLabel)
      expect(loadingElement).toBeInTheDocument()
    })
  })

  describe("Specialized Loading Components", () => {
    it("renders TableLoading with correct props", () => {
      render(<TableLoading />)
      const element = screen.getByRole('status', { hidden: true })
      expect(element).toHaveTextContent('Loading data...')
      const wrapper = element.parentElement?.parentElement
      expect(wrapper).toHaveClass('min-h-[200px]')
    })

    it("renders FormLoading with correct props", () => {
      render(<FormLoading />)
      const element = screen.getByRole('status', { hidden: true })
      expect(element).toHaveTextContent('Loading form...')
      const wrapper = element.parentElement?.parentElement
      expect(wrapper).toHaveClass('min-h-[100px]')
    })

    it("renders ButtonLoading with correct props", () => {
      render(<ButtonLoading />)
      const wrapper = screen.getByRole('status', { hidden: true }).parentElement?.parentElement
      expect(wrapper).toHaveClass('inline-flex', 'items-center')
    })

    it("renders InlineLoading with correct props", () => {
      render(<InlineLoading />)
      const wrapper = screen.getByRole('status', { hidden: true }).parentElement?.parentElement
      expect(wrapper).toHaveClass('inline-flex', 'items-center')
    })
  })

  describe("Loading Component Accessibility", () => {
    it("has appropriate ARIA attributes", () => {
      render(<Loading />)
      const status = screen.getByRole('status', { hidden: true })
      expect(status).toBeInTheDocument()
      expect(status).toHaveClass('sr-only')
    })

    it("maintains accessibility when variant changes", () => {
      render(<Loading variant="fullscreen" message="Loading content..." />)
      const status = screen.getByRole('status', { hidden: true })
      expect(status).toHaveTextContent('Loading content...')
      expect(status).toHaveClass('sr-only')
    })
  })

  describe("Loading Component Styling", () => {
    it("applies correct size classes for all sizes", () => {
      const sizes = ['sm', 'md', 'lg'] as const
      sizes.forEach(size => {
        const { container } = render(<Loading size={size} />)
        const spinner = container.querySelector('.animate-spin')
        const expectedClass = size === 'sm' ? 'w-4 h-4' : 
                            size === 'md' ? 'w-8 h-8' : 
                            'w-12 h-12'
        expect(spinner).toHaveClass(expectedClass)
      })
    })

    it("applies correct alignment classes for all alignments", () => {
      const alignments = ['start', 'center', 'end'] as const
      alignments.forEach(align => {
        const { container } = render(<Loading align={align} />)
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass(align === 'start' ? 'items-start' : 
                                  align === 'end' ? 'items-end' : 
                                  'items-center')
      })
    })
  })
}) 