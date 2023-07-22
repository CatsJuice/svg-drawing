export function createToast(
  target: HTMLElement,
  message: string,
  options?: {
    position?: 'top' | 'bottom' | 'center' | 'left' | 'right'
    duration?: number
  },
) {
  const toast = document.createElement('div')
  toast.classList.add('toast')
  toast.classList.add(`toast--${options?.position}`)
  toast.textContent = message
  document.body.appendChild(toast)
  const rect = target.getBoundingClientRect()
  toast.style.position = 'fixed'
  toast.style.zIndex = '999'
  toast.style.left = `${rect.left + rect.width / 2}px`
  if (options?.position === 'top')
    toast.style.bottom = `${window.innerHeight - rect.top + 10}px`
  else if (options?.position === 'bottom')
    toast.style.top = `${rect.bottom + 10}px`

  toast.style.transform = 'translateX(-50%)'
  toast.style.opacity = '1'
  toast.style.transition = 'opacity 0.3s ease'
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, options?.duration ?? 2000)
}
