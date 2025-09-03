import React from "react"
import { ToastProvider, ToastViewport } from "./toast"
import { useToast } from "../../hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <div key={id} {...props}>
            {title && <div>{title}</div>}
            {description && <div>{description}</div>}
            {action}
          </div>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
