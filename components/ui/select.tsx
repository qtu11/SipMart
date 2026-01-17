import * as React from "react"

interface SelectProps {
    value?: string
    onValueChange?: (value: string) => void
    children?: React.ReactNode
    className?: string
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
    ({ className, children, value, onValueChange, ...props }, ref) => {
        const [open, setOpen] = React.useState(false)
        const [selectedValue, setSelectedValue] = React.useState(value || '')

        React.useEffect(() => {
            if (value !== undefined) {
                setSelectedValue(value)
            }
        }, [value])

        const handleSelect = (newValue: string) => {
            setSelectedValue(newValue)
            onValueChange?.(newValue)
            setOpen(false)
        }

        return (
            <SelectContext.Provider value={{ value: selectedValue, onSelect: handleSelect, open, setOpen }}>
                <div ref={ref} className={`relative ${className || ''}`} {...props}>
                    {children}
                </div>
            </SelectContext.Provider>
        )
    }
)
Select.displayName = "Select"

interface SelectContextType {
    value: string
    onSelect: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(SelectContext)
        return (
            <button
                ref={ref}
                type="button"
                onClick={() => context?.setOpen(!context.open)}
                className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
                {...props}
            >
                {children}
                <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        )
    }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const context = React.useContext(SelectContext)
    return <span>{context?.value || placeholder}</span>
}

const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    if (!context?.open) return null

    return (
        <div
            ref={ref}
            className={`absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md ${className || ''}`}
            {...props}
        >
            <div className="p-1 max-h-60 overflow-auto">{children}</div>
        </div>
    )
})
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
    ({ className, children, value, ...props }, ref) => {
        const context = React.useContext(SelectContext)
        const isSelected = context?.value === value

        return (
            <div
                ref={ref}
                onClick={() => context?.onSelect(value)}
                className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${isSelected ? 'bg-accent' : ''} ${className || ''}`}
                {...props}
            >
                {isSelected && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                )}
                {children}
            </div>
        )
    }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
