import { useState, useRef } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Shift+Enterで改行)"
            className="min-h-[44px] max-h-32 resize-none pr-10"
            disabled={disabled}
            rows={1}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-1"
            disabled={disabled}
          >
            <Smile className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <Button
          type="submit"
          size="icon"
          className="flex-shrink-0"
          disabled={!message.trim() || disabled}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}
